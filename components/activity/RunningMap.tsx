import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Animated,
  Easing,
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../../constants/theme';
import type { RunLocationPoint } from '../../types/activity';


/*
 * ========================================
 * TYPES
 * ========================================
 */

type Props = {
  route: RunLocationPoint[];
  followLatest?: boolean;
  fitRoute?: boolean;
  showMarkers?: boolean;
};

type Point = {
  x: number;
  y: number;
};

type ViewState = {
  zoom: number;
  panX: number;
  panY: number;
  /** live runs: keep the latest position centred while zoomed */
  follow: boolean;
};

type DistanceMarker = {
  km: number;
  base: Point;
};


/*
 * ========================================
 * CONSTANTS
 * ========================================
 */

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 24;

/** keep the fitted route away from the edges + the control column */
const PAD_X = 44;
const PAD_Y = 30;

/** a stationary track still gets a sensible size */
const MIN_RANGE_METERS = 40;

const LINE_WIDTH = 5;
const MARKER_SIZE = 18;

const NICE_METERS = [
  1, 2, 5, 10, 20, 50, 100, 200, 500,
  1000, 2000, 5000, 10000, 20000, 50000,
];

const MARKER_INTERVALS_KM = [
  0.1, 0.25, 0.5, 1, 2, 5, 10, 25,
];

const DEFAULT_VIEW: ViewState = {
  zoom: 1,
  panX: 0,
  panY: 0,
  follow: true,
};


/*
 * ========================================
 * GEO HELPERS
 * ========================================
 */

function isValidPoint(point: RunLocationPoint) {
  return (
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude)
  );
}

/** Haversine distance in meters. */
function distanceMeters(
  a: RunLocationPoint,
  b: RunLocationPoint,
) {
  const earthRadius = 6371000;

  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const deltaLat =
    ((b.latitude - a.latitude) * Math.PI) / 180;

  const deltaLon =
    ((b.longitude - a.longitude) * Math.PI) / 180;

  const value =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) ** 2;

  return (
    earthRadius *
    2 *
    Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
  );
}

function calculateBearing(
  from: RunLocationPoint,
  to: RunLocationPoint,
) {
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;

  const deltaLon =
    ((to.longitude - from.longitude) * Math.PI) / 180;

  const y = Math.sin(deltaLon) * Math.cos(lat2);

  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);

  return (
    (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360
  );
}

function formatDistance(meters: number) {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(2)} km`;
}

function formatMeters(meters: number) {
  return meters >= 1000
    ? `${meters / 1000} km`
    : `${meters} m`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}


/*
 * ========================================
 * ROUTE SEGMENT
 * ========================================
 */

function Segment({
  from,
  to,
}: {
  from: Point;
  to: Point;
}) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  const length = Math.sqrt(dx * dx + dy * dy);

  if (length < 0.5) {
    return null;
  }

  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.segment,
        {
          left: from.x,
          top: from.y - LINE_WIDTH / 2,
          // small overshoot hides the gap between joints
          width: length + LINE_WIDTH / 2,
          transform: [{ rotate: `${angle}deg` }],
        },
      ]}
    />
  );
}


/*
 * ========================================
 * COMPONENT
 * ========================================
 */

export default function RunningMap({
  route,
  followLatest = false,
  fitRoute = false,
  showMarkers = true,
}: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const [view, setViewState] =
    useState<ViewState>(DEFAULT_VIEW);

  const viewRef = useRef<ViewState>(DEFAULT_VIEW);

  const width = size.width;
  const height = size.height;

  const centerX = width / 2;
  const centerY = height / 2;

  const validRoute = useMemo(
    () => route.filter(isValidPoint),
    [route],
  );

  /*
   * Cumulative distance along the route (meters).
   */
  const cumulative = useMemo(() => {
    const values: number[] = [];

    let total = 0;

    for (let i = 0; i < validRoute.length; i += 1) {
      if (i > 0) {
        total += distanceMeters(
          validRoute[i - 1],
          validRoute[i],
        );
      }

      values.push(total);
    }

    return values;
  }, [validRoute]);

  const routeMeters =
    cumulative.length > 0
      ? cumulative[cumulative.length - 1]
      : 0;


  /*
   * ======================================
   * PROJECTION
   *
   * lat/lon → meters (with latitude
   * correction) → fitted to the viewport.
   * The route's bounding box is always
   * centred in the viewport at zoom 1.
   * ======================================
   */

  const geo = useMemo(() => {
    if (
      validRoute.length === 0 ||
      width <= 0 ||
      height <= 0
    ) {
      return null;
    }

    let minLat = validRoute[0].latitude;
    let maxLat = minLat;
    let minLon = validRoute[0].longitude;
    let maxLon = minLon;

    for (const point of validRoute) {
      minLat = Math.min(minLat, point.latitude);
      maxLat = Math.max(maxLat, point.latitude);
      minLon = Math.min(minLon, point.longitude);
      maxLon = Math.max(maxLon, point.longitude);
    }

    const latMid = (minLat + maxLat) / 2;
    const lonMid = (minLon + maxLon) / 2;

    const lonFactor =
      111320 * Math.cos((latMid * Math.PI) / 180);

    const latFactor = 110574;

    const meters = validRoute.map(point => ({
      x: (point.longitude - lonMid) * lonFactor,
      y: (latMid - point.latitude) * latFactor,
    }));

    let minX = meters[0].x;
    let maxX = minX;
    let minY = meters[0].y;
    let maxY = minY;

    for (const point of meters) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }

    const rangeX = Math.max(maxX - minX, MIN_RANGE_METERS);
    const rangeY = Math.max(maxY - minY, MIN_RANGE_METERS);

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    const scale = Math.max(
      0.0001,
      Math.min(
        (width - PAD_X * 2) / rangeX,
        (height - PAD_Y * 2) / rangeY,
      ),
    );

    const base: Point[] = meters.map(point => ({
      x: width / 2 + (point.x - midX) * scale,
      y: height / 2 + (point.y - midY) * scale,
    }));

    return {
      base,
      /** pixels per meter at zoom 1 */
      scale,
      routeWidth: rangeX * scale,
      routeHeight: rangeY * scale,
    };
  }, [validRoute, width, height]);


  /*
   * ======================================
   * EFFECTIVE VIEW
   * (live runs follow the latest position
   *  while zoomed in)
   * ======================================
   */

  const latestBase =
    geo && geo.base.length > 0
      ? geo.base[geo.base.length - 1]
      : null;

  const following =
    followLatest && view.follow && latestBase !== null;

  const followWeight = clamp(
    (view.zoom - 1) / 1.5,
    0,
    1,
  );

  const pan: Point =
    following && latestBase
      ? {
          x:
            -(latestBase.x - centerX) *
            view.zoom *
            followWeight,
          y:
            -(latestBase.y - centerY) *
            view.zoom *
            followWeight,
        }
      : { x: view.panX, y: view.panY };

  const panRef = useRef<Point>({ x: 0, y: 0 });
  const metricsRef = useRef({
    width: 0,
    height: 0,
    routeWidth: 0,
    routeHeight: 0,
  });

  panRef.current = pan;

  metricsRef.current = {
    width,
    height,
    routeWidth: geo?.routeWidth ?? 0,
    routeHeight: geo?.routeHeight ?? 0,
  };

  const toScreen = (point: Point): Point => ({
    x: centerX + pan.x + (point.x - centerX) * view.zoom,
    y: centerY + pan.y + (point.y - centerY) * view.zoom,
  });

  const pixelsPerMeter = (geo?.scale ?? 1) * view.zoom;


  /*
   * ======================================
   * GESTURES
   * ======================================
   */

  function commit(next: ViewState) {
    viewRef.current = next;
    setViewState(next);
  }

  function clampPan(
    zoom: number,
    x: number,
    y: number,
  ): Point {
    if (zoom <= 1.001) {
      return { x: 0, y: 0 };
    }

    const m = metricsRef.current;

    const maxX =
      (m.routeWidth * zoom) / 2 + m.width / 2 - 48;

    const maxY =
      (m.routeHeight * zoom) / 2 + m.height / 2 - 48;

    return {
      x: clamp(x, -Math.max(0, maxX), Math.max(0, maxX)),
      y: clamp(y, -Math.max(0, maxY), Math.max(0, maxY)),
    };
  }

  /** keep the point under `focal` fixed while zooming */
  function panForZoom(
    focal: Point,
    focalStart: Point,
    panStart: Point,
    zoomStart: number,
    zoomNext: number,
  ): Point {
    const m = metricsRef.current;

    const cx = m.width / 2;
    const cy = m.height / 2;

    const ratio = zoomNext / zoomStart;

    return {
      x:
        focal.x -
        cx -
        (focalStart.x - cx - panStart.x) * ratio,
      y:
        focal.y -
        cy -
        (focalStart.y - cy - panStart.y) * ratio,
    };
  }

  function zoomBy(factor: number) {
    const current = viewRef.current;

    const zoom = clamp(
      current.zoom * factor,
      MIN_ZOOM,
      MAX_ZOOM,
    );

    const eff = panRef.current;

    const ratio = zoom / current.zoom;

    const next = clampPan(
      zoom,
      eff.x * ratio,
      eff.y * ratio,
    );

    commit({
      zoom,
      panX: next.x,
      panY: next.y,
      follow: current.follow,
    });
  }

  function resetView() {
    commit(DEFAULT_VIEW);
  }

  const gesture = useRef({
    count: 0,
    panStart: { x: 0, y: 0 },
    zoomStart: 1,
    distStart: 1,
    focalStart: { x: 0, y: 0 },
    moved: false,
    startTime: 0,
    lastTap: { time: 0, x: 0, y: 0 },
  }).current;

  function readTouches(event: GestureResponderEvent) {
    const touches = event.nativeEvent.touches;

    if (touches.length >= 2) {
      const a = touches[0];
      const b = touches[1];

      return {
        count: 2,
        x: (a.locationX + b.locationX) / 2,
        y: (a.locationY + b.locationY) / 2,
        dist: Math.max(
          1,
          Math.hypot(
            a.locationX - b.locationX,
            a.locationY - b.locationY,
          ),
        ),
      };
    }

    if (touches.length === 1) {
      return {
        count: 1,
        x: touches[0].locationX,
        y: touches[0].locationY,
        dist: 1,
      };
    }

    return { count: 0, x: 0, y: 0, dist: 1 };
  }

  function beginGesture(
    info: ReturnType<typeof readTouches>,
  ) {
    gesture.count = info.count;
    gesture.panStart = { ...panRef.current };
    gesture.zoomStart = viewRef.current.zoom;
    gesture.distStart = info.dist;
    gesture.focalStart = { x: info.x, y: info.y };
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onMoveShouldSetPanResponder: event =>
        event.nativeEvent.touches.length >= 2 ||
        viewRef.current.zoom > 1.01,

      // At 1x a single finger may hand over to the page
      // scroll; when zoomed / pinching the map keeps the touch.
      onPanResponderTerminationRequest: event =>
        viewRef.current.zoom <= 1.01 &&
        event.nativeEvent.touches.length < 2,

      onPanResponderGrant: event => {
        gesture.moved = false;
        gesture.startTime = Date.now();

        beginGesture(readTouches(event));
      },

      onPanResponderMove: event => {
        const info = readTouches(event);

        if (info.count === 0) {
          return;
        }

        if (info.count !== gesture.count) {
          beginGesture(info);
        }

        const current = viewRef.current;

        const zoom =
          info.count === 2
            ? clamp(
                gesture.zoomStart *
                  (info.dist / gesture.distStart),
                MIN_ZOOM,
                MAX_ZOOM,
              )
            : gesture.zoomStart;

        const movedEnough =
          info.count === 2 ||
          Math.hypot(
            info.x - gesture.focalStart.x,
            info.y - gesture.focalStart.y,
          ) > 6;

        if (!movedEnough && !gesture.moved) {
          return;
        }

        gesture.moved = true;

        const target = panForZoom(
          { x: info.x, y: info.y },
          gesture.focalStart,
          gesture.panStart,
          gesture.zoomStart,
          zoom,
        );

        const nextPan = clampPan(zoom, target.x, target.y);

        commit({
          zoom,
          panX: nextPan.x,
          panY: nextPan.y,
          // pinching keeps following; dragging the map takes control
          follow:
            info.count === 2
              ? current.follow
              : zoom > 1.01
                ? false
                : current.follow,
        });
      },

      onPanResponderRelease: event => {
        const now = Date.now();

        const wasTap =
          !gesture.moved && now - gesture.startTime < 260;

        if (!wasTap) {
          return;
        }

        const x = event.nativeEvent.locationX;
        const y = event.nativeEvent.locationY;

        const last = gesture.lastTap;

        const isDoubleTap =
          now - last.time < 300 &&
          Math.hypot(x - last.x, y - last.y) < 36;

        gesture.lastTap = { time: now, x, y };

        if (!isDoubleTap) {
          return;
        }

        gesture.lastTap = { time: 0, x: 0, y: 0 };

        const current = viewRef.current;

        if (current.zoom > 1.5) {
          commit(DEFAULT_VIEW);
          return;
        }

        const zoom = clamp(
          Math.max(current.zoom * 2.5, 2.5),
          MIN_ZOOM,
          MAX_ZOOM,
        );

        const nextPan = panForZoom(
          { x, y },
          { x, y },
          panRef.current,
          current.zoom,
          zoom,
        );

        const clamped = clampPan(
          zoom,
          nextPan.x,
          nextPan.y,
        );

        commit({
          zoom,
          panX: clamped.x,
          panY: clamped.y,
          follow: false,
        });
      },
    }),
  ).current;


  /*
   * Reset the camera when a run starts / ends
   */

  useEffect(() => {
    commit(DEFAULT_VIEW);
  }, [followLatest]);


  /*
   * Live pulse
   */

  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!followLatest) {
      pulse.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );

    loop.start();

    return () => loop.stop();
  }, [followLatest, pulse]);


  /*
   * ======================================
   * DRAWING DATA
   * ======================================
   */

  // simplify to ~2.5px, then cull what is off screen
  const segments = useMemo(() => {
    if (!geo) {
      return [];
    }

    const projected = geo.base.map(point => ({
      x: centerX + pan.x + (point.x - centerX) * view.zoom,
      y: centerY + pan.y + (point.y - centerY) * view.zoom,
    }));

    const kept: Point[] = [];

    let lastKept: Point | null = null;

    for (let i = 0; i < projected.length; i += 1) {
      const point = projected[i];

      if (
        lastKept === null ||
        i === projected.length - 1 ||
        Math.hypot(
          point.x - lastKept.x,
          point.y - lastKept.y,
        ) >= 2.5
      ) {
        kept.push(point);
        lastKept = point;
      }
    }

    const margin = 30;

    const result: { key: string; from: Point; to: Point }[] =
      [];

    for (let i = 1; i < kept.length; i += 1) {
      const a = kept[i - 1];
      const b = kept[i];

      const outside =
        (a.x < -margin && b.x < -margin) ||
        (a.x > width + margin && b.x > width + margin) ||
        (a.y < -margin && b.y < -margin) ||
        (a.y > height + margin && b.y > height + margin);

      if (!outside) {
        result.push({ key: `s-${i}`, from: a, to: b });
      }
    }

    return result;
  }, [
    geo,
    view.zoom,
    pan.x,
    pan.y,
    centerX,
    centerY,
    width,
    height,
  ]);

  // marker spacing adapts to zoom
  const markerInterval =
    MARKER_INTERVALS_KM.find(
      interval =>
        interval * 1000 * pixelsPerMeter >= 70,
    ) ??
    MARKER_INTERVALS_KM[MARKER_INTERVALS_KM.length - 1];

  const markers = useMemo<DistanceMarker[]>(() => {
    if (!geo || geo.base.length < 2) {
      return [];
    }

    const result: DistanceMarker[] = [];

    const total = cumulative[cumulative.length - 1];

    let segment = 1;

    for (
      let km = markerInterval;
      km * 1000 <= total && result.length < 60;
      km += markerInterval
    ) {
      const target = km * 1000;

      while (
        segment < cumulative.length - 1 &&
        cumulative[segment] < target
      ) {
        segment += 1;
      }

      const startDistance = cumulative[segment - 1];
      const endDistance = cumulative[segment];

      const span = endDistance - startDistance;

      const progress =
        span > 0 ? (target - startDistance) / span : 0;

      const from = geo.base[segment - 1];
      const to = geo.base[segment];

      result.push({
        km: Number(km.toFixed(2)),
        base: {
          x: from.x + (to.x - from.x) * progress,
          y: from.y + (to.y - from.y) * progress,
        },
      });
    }

    return result;
  }, [geo, cumulative, markerInterval]);

  const startScreen =
    geo && geo.base.length > 0 ? toScreen(geo.base[0]) : null;

  const latestScreen = latestBase ? toScreen(latestBase) : null;


  /*
   * Heading from the last couple of meters of movement
   */

  const heading = useMemo(() => {
    if (validRoute.length < 2) {
      return 0;
    }

    const latest = validRoute[validRoute.length - 1];

    for (
      let i = validRoute.length - 2;
      i >= Math.max(0, validRoute.length - 12);
      i -= 1
    ) {
      if (distanceMeters(validRoute[i], latest) >= 3) {
        return calculateBearing(validRoute[i], latest);
      }
    }

    return calculateBearing(
      validRoute[validRoute.length - 2],
      latest,
    );
  }, [validRoute]);

  const currentGps =
    validRoute.length > 0
      ? validRoute[validRoute.length - 1]
      : null;


  /*
   * Scale grid (one cell = a round number of meters)
   */

  const gridMeters =
    NICE_METERS.find(
      meters => meters * pixelsPerMeter >= 42,
    ) ?? NICE_METERS[NICE_METERS.length - 1];

  const gridPixels = gridMeters * pixelsPerMeter;

  const gridLines = useMemo(() => {
    if (width <= 0 || height <= 0 || gridPixels < 8) {
      return { vertical: [] as number[], horizontal: [] as number[] };
    }

    const originX = centerX + pan.x;
    const originY = centerY + pan.y;

    const vertical: number[] = [];
    const horizontal: number[] = [];

    const startX =
      originX - Math.ceil(originX / gridPixels) * gridPixels;

    for (
      let x = startX;
      x <= width && vertical.length < 40;
      x += gridPixels
    ) {
      if (x >= 0) {
        vertical.push(x);
      }
    }

    const startY =
      originY - Math.ceil(originY / gridPixels) * gridPixels;

    for (
      let y = startY;
      y <= height && horizontal.length < 40;
      y += gridPixels
    ) {
      if (y >= 0) {
        horizontal.push(y);
      }
    }

    return { vertical, horizontal };
  }, [width, height, gridPixels, centerX, centerY, pan.x, pan.y]);


  /*
   * Status
   */

  const hasRoute = validRoute.length > 0;

  const statusLabel = !hasRoute
    ? 'SEARCHING'
    : followLatest
      ? 'GPS LIVE'
      : 'SAVED';

  const statusLive = hasRoute && followLatest;

  const cameraMoved =
    Math.abs(view.zoom - 1) > 0.02 ||
    Math.abs(view.panX) > 1 ||
    Math.abs(view.panY) > 1 ||
    (followLatest && !view.follow);

  const handleViewportLayout = (
    event: LayoutChangeEvent,
  ) => {
    const { width: w, height: h } = event.nativeEvent.layout;

    setSize(previous =>
      previous.width === w && previous.height === h
        ? previous
        : { width: w, height: h },
    );
  };

  const inView = (point: Point, margin = 14) =>
    point.x >= -margin &&
    point.x <= width + margin &&
    point.y >= -margin &&
    point.y <= height + margin;

  return (
    <View style={styles.container}>

      {/* =========================
          HEADER
         ========================= */}

      <View style={styles.header}>

        <View>
          <Text style={styles.title}>RUN ROUTE</Text>

          <Text style={styles.subtitle}>
            {fitRoute ? 'FULL TRACK' : 'GPS TRACK'}
          </Text>
        </View>

        <View
          style={[
            styles.status,
            statusLive
              ? styles.statusLive
              : styles.statusIdle,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              statusLive
                ? styles.statusDotLive
                : styles.statusDotIdle,
            ]}
          />

          <Text
            style={[
              styles.statusText,
              statusLive
                ? styles.statusTextLive
                : styles.statusTextIdle,
            ]}
          >
            {statusLabel}
          </Text>
        </View>

      </View>


      {/* =========================
          MAP VIEWPORT
          (everything drawn here is clipped, so the
           route can never slide under the text above
           or below it)
         ========================= */}

      <View
        style={styles.viewport}
        onLayout={handleViewportLayout}
        {...panResponder.panHandlers}
      >

        {/* Grid */}

        <View
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
        >
          {gridLines.vertical.map(x => (
            <View
              key={`gv-${Math.round(x * 10)}`}
              style={[styles.gridV, { left: x }]}
            />
          ))}

          {gridLines.horizontal.map(y => (
            <View
              key={`gh-${Math.round(y * 10)}`}
              style={[styles.gridH, { top: y }]}
            />
          ))}
        </View>


        {/* Route */}

        <View
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
        >

          {segments.map(segment => (
            <Segment
              key={segment.key}
              from={segment.from}
              to={segment.to}
            />
          ))}

          {markers.map(marker => {
            const point = toScreen(marker.base);

            if (!inView(point)) {
              return null;
            }

            return (
              <View
                key={`m-${marker.km}`}
                style={[
                  styles.distanceMarker,
                  {
                    left: point.x - 14,
                    top: point.y - 14,
                  },
                ]}
              >
                <Text style={styles.distanceMarkerText}>
                  {marker.km}
                </Text>
              </View>
            );
          })}

          {showMarkers &&
            startScreen &&
            inView(startScreen) && (
              <View
                style={[
                  styles.startMarker,
                  {
                    left: startScreen.x - MARKER_SIZE / 2,
                    top: startScreen.y - MARKER_SIZE / 2,
                  },
                ]}
              >
                <Text style={styles.startMarkerText}>S</Text>
              </View>
            )}

          {latestScreen && inView(latestScreen, 30) && (
            <>
              {followLatest ? (
                <>
                  <View
                    style={[
                      styles.pulseHolder,
                      {
                        left: latestScreen.x - 20,
                        top: latestScreen.y - 20,
                      },
                    ]}
                  >
                    <Animated.View
                      style={[
                        styles.pulse,
                        {
                          opacity: pulse.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.55, 0],
                          }),
                          transform: [
                            {
                              scale: pulse.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.5, 1.5],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                  </View>

                  <View
                    style={[
                      styles.currentPosition,
                      {
                        left: latestScreen.x - MARKER_SIZE / 2,
                        top: latestScreen.y - MARKER_SIZE / 2,
                      },
                    ]}
                  />

                  {validRoute.length > 1 && (
                    <View
                      style={[
                        styles.directionArrow,
                        {
                          left: latestScreen.x - 9,
                          top: latestScreen.y - 9,
                          transform: [
                            { rotate: `${heading}deg` },
                          ],
                        },
                      ]}
                    >
                      <View style={styles.arrowTriangle} />
                    </View>
                  )}
                </>
              ) : (
                showMarkers && (
                  <View
                    style={[
                      styles.finishMarker,
                      {
                        left: latestScreen.x - MARKER_SIZE / 2,
                        top: latestScreen.y - MARKER_SIZE / 2,
                      },
                    ]}
                  >
                    <Text style={styles.finishMarkerText}>
                      F
                    </Text>
                  </View>
                )
              )}
            </>
          )}

        </View>


        {/* Empty state */}

        {!hasRoute && (
          <View
            pointerEvents="none"
            style={styles.emptyState}
          >
            <View style={styles.targetIcon}>
              <View style={styles.targetOuter} />
              <View style={styles.targetMiddle} />
              <View style={styles.targetCenter} />
            </View>

            <Text style={styles.emptyTitle}>
              WAITING FOR GPS
            </Text>

            <Text style={styles.emptySubtitle}>
              Move outdoors to build your route
            </Text>
          </View>
        )}


        {/* Zoom controls */}

        {hasRoute && (
          <View
            pointerEvents="box-none"
            style={styles.controls}
          >
            <Pressable
              accessibilityLabel="Zoom in"
              onPress={() => zoomBy(1.6)}
              style={({ pressed }) => [
                styles.controlButton,
                pressed && styles.controlPressed,
              ]}
            >
              <Text style={styles.controlText}>+</Text>
            </Pressable>

            <Text
              pointerEvents="none"
              style={styles.zoomLabel}
            >
              {view.zoom.toFixed(1)}X
            </Text>

            <Pressable
              accessibilityLabel="Zoom out"
              onPress={() => zoomBy(1 / 1.6)}
              style={({ pressed }) => [
                styles.controlButton,
                pressed && styles.controlPressed,
              ]}
            >
              <Text style={styles.controlText}>−</Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Fit route"
              onPress={resetView}
              style={({ pressed }) => [
                styles.controlButton,
                styles.fitButton,
                cameraMoved && styles.fitButtonActive,
                pressed && styles.controlPressed,
              ]}
            >
              <Text
                style={[
                  styles.fitText,
                  cameraMoved && styles.fitTextActive,
                ]}
              >
                FIT
              </Text>
            </Pressable>
          </View>
        )}

      </View>


      {/* =========================
          BOTTOM INFO
         ========================= */}

      <View style={styles.bottomPanel}>

        <Metric
          label="DIST"
          value={hasRoute ? formatDistance(routeMeters) : '--'}
          highlight
        />

        <View style={styles.metricDivider} />

        <Metric
          label="POINTS"
          value={String(validRoute.length)}
        />

        <View style={styles.metricDivider} />

        <Metric
          label="GPS"
          value={
            currentGps?.accuracy
              ? `±${Math.round(currentGps.accuracy)}m`
              : '--'
          }
        />

        <View style={styles.metricDivider} />

        <Metric
          label="GRID"
          value={hasRoute ? formatMeters(gridMeters) : '--'}
        />

      </View>

    </View>
  );
}


/*
 * ========================================
 * METRIC
 * ========================================
 */

function Metric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>

      <Text
        numberOfLines={1}
        style={[
          styles.metricValue,
          highlight && styles.metricValueHighlight,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}


/*
 * ========================================
 * STYLES
 * ========================================
 */

const styles = StyleSheet.create({

  container: {
    flex: 1,
    minHeight: 300,
    overflow: 'hidden',
    backgroundColor: '#07100B',
    borderWidth: 1,
    borderColor: '#1C3325',
  },


  /* header */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  title: {
    color: colors.primary,
    fontFamily: 'PressStart2P',
    fontSize: 9,
  },

  subtitle: {
    marginTop: 5,
    color: '#587060',
    fontFamily: 'VT323',
    fontSize: 14,
  },

  status: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderRadius: 6,
  },

  statusLive: {
    backgroundColor: '#0B1B11',
    borderColor: '#31553D',
  },

  statusIdle: {
    backgroundColor: '#0D1510',
    borderColor: '#243A2C',
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },

  statusDotLive: {
    backgroundColor: colors.primary,
  },

  statusDotIdle: {
    backgroundColor: '#587060',
  },

  statusText: {
    fontFamily: 'PressStart2P',
    fontSize: 6,
  },

  statusTextLive: {
    color: colors.primary,
  },

  statusTextIdle: {
    color: '#7C9182',
  },


  /* viewport */

  viewport: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#06100A',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1C3325',
  },

  gridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#12261A',
  },

  gridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#12261A',
  },


  /* route */

  segment: {
    position: 'absolute',
    height: LINE_WIDTH,
    borderRadius: LINE_WIDTH / 2,
    backgroundColor: colors.primary,
    transformOrigin: 'left center',
  },

  distanceMarker: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0B1710',
    borderWidth: 1,
    borderColor: '#587060',
    alignItems: 'center',
    justifyContent: 'center',
  },

  distanceMarkerText: {
    color: '#B9C9BD',
    fontFamily: 'VT323',
    fontSize: 13,
  },

  startMarker: {
    position: 'absolute',
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    backgroundColor: '#111111',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  startMarkerText: {
    color: '#FFFFFF',
    fontFamily: 'PressStart2P',
    fontSize: 6,
  },

  finishMarker: {
    position: 'absolute',
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  finishMarkerText: {
    color: '#101010',
    fontFamily: 'PressStart2P',
    fontSize: 6,
  },

  currentPosition: {
    position: 'absolute',
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },

  pulseHolder: {
    position: 'absolute',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pulse: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'rgba(183,255,60,0.15)',
  },

  directionArrow: {
    position: 'absolute',
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrowTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 11,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
    transform: [{ translateY: -15 }],
  },


  /* empty */

  emptyState: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  targetIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  targetOuter: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#536A5B',
  },

  targetMiddle: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#536A5B',
  },

  targetCenter: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#536A5B',
  },

  emptyTitle: {
    color: '#B7C8BC',
    fontFamily: 'PressStart2P',
    fontSize: 8,
  },

  emptySubtitle: {
    marginTop: 8,
    color: '#64796B',
    fontFamily: 'VT323',
    fontSize: 15,
    textAlign: 'center',
  },


  /* controls */

  controls: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  controlButton: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#294635',
    backgroundColor: 'rgba(7,16,11,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  controlPressed: {
    opacity: 0.6,
  },

  controlText: {
    color: colors.primary,
    fontFamily: 'PressStart2P',
    fontSize: 11,
  },

  zoomLabel: {
    color: '#708477',
    fontFamily: 'VT323',
    fontSize: 13,
    marginVertical: 3,
  },

  fitButton: {
    marginTop: 6,
  },

  fitButtonActive: {
    borderColor: colors.primary,
  },

  fitText: {
    color: '#708477',
    fontFamily: 'PressStart2P',
    fontSize: 6,
  },

  fitTextActive: {
    color: colors.primary,
  },


  /* bottom */

  bottomPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 9,
    paddingHorizontal: 6,
  },

  metric: {
    flex: 1,
    alignItems: 'center',
  },

  metricLabel: {
    color: '#607669',
    fontFamily: 'PressStart2P',
    fontSize: 5,
  },

  metricValue: {
    marginTop: 5,
    color: '#DCE8DF',
    fontFamily: 'VT323',
    fontSize: 17,
  },

  metricValueHighlight: {
    color: colors.primary,
  },

  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#294635',
  },

});