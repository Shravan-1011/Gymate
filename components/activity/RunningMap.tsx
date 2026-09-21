import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../../constants/theme';
import type { RunLocationPoint } from '../../types/activity';

type Props = {
  route: RunLocationPoint[];
  followLatest?: boolean;
  fitRoute?: boolean;
  showMarkers?: boolean;
};

type ScreenPoint = {
  x: number;
  y: number;
};

type DistanceMarker = {
  point: ScreenPoint;
  distanceKm: number;
};

const PADDING = 42;
const MIN_ROUTE_RANGE = 0.00008;
const MARKER_SIZE = 18;

function isValidPoint(point: RunLocationPoint) {
  return (
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude)
  );
}

/**
 * Haversine distance in meters.
 */
function distanceMeters(
  a: RunLocationPoint,
  b: RunLocationPoint
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
    Math.atan2(
      Math.sqrt(value),
      Math.sqrt(1 - value)
    )
  );
}

function totalRouteDistance(
  route: RunLocationPoint[]
) {
  if (route.length < 2) {
    return 0;
  }

  let total = 0;

  for (let i = 1; i < route.length; i++) {
    total += distanceMeters(
      route[i - 1],
      route[i]
    );
  }

  return total;
}

function calculateBearing(
  from: RunLocationPoint,
  to: RunLocationPoint
) {
  const lat1 =
    (from.latitude * Math.PI) / 180;

  const lat2 =
    (to.latitude * Math.PI) / 180;

  const deltaLon =
    ((to.longitude - from.longitude) *
      Math.PI) /
    180;

  const y =
    Math.sin(deltaLon) * Math.cos(lat2);

  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) *
      Math.cos(lat2) *
      Math.cos(deltaLon);

  const bearing =
    (Math.atan2(y, x) * 180) / Math.PI;

  return (bearing + 360) % 360;
}

function formatDistance(distanceKm: number) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(2)} km`;
}

function RouteSegment({
  from,
  to,
}: {
  from: ScreenPoint;
  to: ScreenPoint;
}) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  const length = Math.sqrt(
    dx * dx + dy * dy
  );

  if (length < 1) {
    return null;
  }

  const angle =
    (Math.atan2(dy, dx) * 180) / Math.PI;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.routeSegment,
        {
          left: from.x,
          top: from.y,
          width: length,
          transform: [
            {
              rotate: `${angle}deg`,
            },
          ],
        },
      ]}
    />
  );
}

export default function RunningMap({
  route,
  followLatest = false,
  fitRoute = false,
  showMarkers = true,
}: Props) {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const validRoute = useMemo(
    () => route.filter(isValidPoint),
    [route]
  );

  const routeDistanceMeters = useMemo(
    () => totalRouteDistance(validRoute),
    [validRoute]
  );

  const routeDistanceKm =
    routeDistanceMeters / 1000;

  /*
   * Convert GPS coordinates into screen coordinates.
   *
   * This intentionally does NOT use a map provider.
   * The GPS route itself is the visualization.
   */
  const screenPoints = useMemo<ScreenPoint[]>(
    () => {
      if (
        validRoute.length === 0 ||
        width <= 0 ||
        height <= 0
      ) {
        return [];
      }

      let minLat = validRoute[0].latitude;
      let maxLat = validRoute[0].latitude;

      let minLon = validRoute[0].longitude;
      let maxLon = validRoute[0].longitude;

      for (const point of validRoute) {
        minLat = Math.min(
          minLat,
          point.latitude
        );

        maxLat = Math.max(
          maxLat,
          point.latitude
        );

        minLon = Math.min(
          minLon,
          point.longitude
        );

        maxLon = Math.max(
          maxLon,
          point.longitude
        );
      }

      let latRange = maxLat - minLat;
      let lonRange = maxLon - minLon;

      /*
       * Prevent a stationary/very short GPS track
       * from collapsing into one pixel.
       */
      if (latRange < MIN_ROUTE_RANGE) {
        const center =
          (minLat + maxLat) / 2;

        latRange = MIN_ROUTE_RANGE;

        minLat =
          center - MIN_ROUTE_RANGE / 2;

        maxLat =
          center + MIN_ROUTE_RANGE / 2;
      }

      if (lonRange < MIN_ROUTE_RANGE) {
        const center =
          (minLon + maxLon) / 2;

        lonRange = MIN_ROUTE_RANGE;

        minLon =
          center - MIN_ROUTE_RANGE / 2;

        maxLon =
          center + MIN_ROUTE_RANGE / 2;
      }

      const availableWidth = Math.max(
        1,
        width - PADDING * 2
      );

      const availableHeight = Math.max(
        1,
        height - PADDING * 2
      );

      const scaleX =
        availableWidth / lonRange;

      const scaleY =
        availableHeight / latRange;

      /*
       * Keep geographic proportions.
       */
      const scale = Math.min(
        scaleX,
        scaleY
      );

      const renderedWidth =
        lonRange * scale;

      const renderedHeight =
        latRange * scale;

      const offsetX =
        (width - renderedWidth) / 2;

      const offsetY =
        (height - renderedHeight) / 2;

      return validRoute.map((point) => ({
        x:
          offsetX +
          (point.longitude - minLon) *
            scale,

        y:
          offsetY +
          (maxLat - point.latitude) *
            scale,
      }));
    },
    [validRoute, width, height]
  );

  /*
   * Create distance markers approximately every 0.5 km.
   */
  const distanceMarkers = useMemo<
    DistanceMarker[]
  >(() => {
    if (
      validRoute.length < 2 ||
      screenPoints.length < 2
    ) {
      return [];
    }

    const markers: DistanceMarker[] = [];

    let accumulated = 0;
    let nextMarker = 0.5;

    for (let i = 1; i < validRoute.length; i++) {
      const segmentDistance =
        distanceMeters(
          validRoute[i - 1],
          validRoute[i]
        );

      const previousDistance =
        accumulated;

      accumulated +=
        segmentDistance / 1000;

      while (
        nextMarker <= accumulated &&
        segmentDistance > 0
      ) {
        const segmentStart =
          previousDistance;

        const progress =
          (nextMarker - segmentStart) /
          (accumulated - segmentStart);

        const from =
          screenPoints[i - 1];

        const to =
          screenPoints[i];

        if (from && to) {
          markers.push({
            distanceKm: nextMarker,
            point: {
              x:
                from.x +
                (to.x - from.x) *
                  progress,

              y:
                from.y +
                (to.y - from.y) *
                  progress,
            },
          });
        }

        nextMarker += 0.5;
      }
    }

    return markers;
  }, [validRoute, screenPoints]);

  const startPoint =
    screenPoints.length > 0
      ? screenPoints[0]
      : null;

  const latestPoint =
    screenPoints.length > 0
      ? screenPoints[
          screenPoints.length - 1
        ]
      : null;

  const previousPoint =
    screenPoints.length > 1
      ? screenPoints[
          screenPoints.length - 2
        ]
      : null;

  const currentGps =
    validRoute.length > 0
      ? validRoute[
          validRoute.length - 1
        ]
      : null;

  const previousGps =
    validRoute.length > 1
      ? validRoute[
          validRoute.length - 2
        ]
      : null;

  const heading =
    currentGps && previousGps
      ? calculateBearing(
          previousGps,
          currentGps
        )
      : 0;

  const handleLayout = (
    event: LayoutChangeEvent
  ) => {
    const {
      width: layoutWidth,
      height: layoutHeight,
    } = event.nativeEvent.layout;

    setWidth(layoutWidth);
    setHeight(layoutHeight);
  };

  /*
   * This state is intentionally simple.
   * It forces the visual layer to refresh whenever
   * new GPS points arrive.
   */
  const [routeVersion, setRouteVersion] =
    useState(0);

  useEffect(() => {
    setRouteVersion(
      (value) => value + 1
    );
  }, [route.length]);

  const isPaused =
    validRoute.length > 0 &&
    !followLatest;

  const routeLabel =
    routeDistanceMeters < 1
      ? '0 m'
      : formatDistance(routeDistanceKm);

  return (
    <View
      style={styles.container}
      onLayout={handleLayout}
    >
      {/* =========================
          BACKGROUND
         ========================= */}

      <View
        pointerEvents="none"
        style={styles.background}
      >
        <View style={styles.gridVertical25} />
        <View style={styles.gridVertical50} />
        <View style={styles.gridVertical75} />

        <View style={styles.gridHorizontal25} />
        <View style={styles.gridHorizontal50} />
        <View style={styles.gridHorizontal75} />

        <View style={styles.centerCrossHorizontal} />
        <View style={styles.centerCrossVertical} />
      </View>

      {/* =========================
          TOP HEADER
         ========================= */}

      <View
        pointerEvents="none"
        style={styles.topHeader}
      >
        <View>
          <Text style={styles.routeTitle}>
            RUN ROUTE
          </Text>

          <Text style={styles.routeSubtitle}>
            GPS TRACK
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            isPaused
              ? styles.statusPaused
              : styles.statusLive,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              isPaused
                ? styles.statusDotPaused
                : styles.statusDotLive,
            ]}
          />

          <Text
            style={[
              styles.statusText,
              isPaused
                ? styles.statusTextPaused
                : styles.statusTextLive,
            ]}
          >
            {isPaused
              ? 'PAUSED'
              : validRoute.length > 0
                ? 'GPS LIVE'
                : 'SEARCHING'}
          </Text>
        </View>
      </View>

      {/* =========================
          ROUTE LAYER
         ========================= */}

      <View
        key={routeVersion}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      >
        {/* Route segments */}

        {screenPoints.map(
          (point, index) => {
            if (index === 0) {
              return null;
            }

            return (
              <RouteSegment
                key={`route-${index}`}
                from={
                  screenPoints[index - 1]
                }
                to={point}
              />
            );
          }
        )}

        {/* Distance markers */}

        {distanceMarkers.map(
          (marker) => (
            <View
              key={`distance-${marker.distanceKm}`}
              style={[
                styles.distanceMarker,
                {
                  left:
                    marker.point.x - 13,
                  top:
                    marker.point.y - 13,
                },
              ]}
            >
              <Text
                style={
                  styles.distanceMarkerText
                }
              >
                {marker.distanceKm}
              </Text>
            </View>
          )
        )}

        {/* Start marker */}

        {showMarkers &&
          startPoint && (
            <View
              style={[
                styles.startMarker,
                {
                  left:
                    startPoint.x -
                    MARKER_SIZE / 2,
                  top:
                    startPoint.y -
                    MARKER_SIZE / 2,
                },
              ]}
            >
              <Text
                style={styles.startMarkerText}
              >
                S
              </Text>
            </View>
          )}

        {/* Current position */}

        {latestPoint && (
          <>
            {followLatest && (
              <View
                style={[
                  styles.positionPulseOuter,
                  {
                    left:
                      latestPoint.x - 19,
                    top:
                      latestPoint.y - 19,
                  },
                ]}
              >
                <View
                  style={
                    styles.positionPulseInner
                  }
                />
              </View>
            )}

            <View
              style={[
                styles.currentPosition,
                {
                  left:
                    latestPoint.x -
                    MARKER_SIZE / 2,
                  top:
                    latestPoint.y -
                    MARKER_SIZE / 2,
                },
              ]}
            />

            {/* Direction arrow */}

            {previousPoint &&
              followLatest && (
                <View
                  style={[
                    styles.directionArrow,
                    {
                      left:
                        latestPoint.x - 9,
                      top:
                        latestPoint.y - 9,
                      transform: [
                        {
                          rotate: `${heading}deg`,
                        },
                      ],
                    },
                  ]}
                >
                  <View
                    style={
                      styles.arrowTriangle
                    }
                  />
                </View>
              )}
          </>
        )}
      </View>

      {/* =========================
          EMPTY STATE
         ========================= */}

      {validRoute.length === 0 && (
        <View
          pointerEvents="none"
          style={styles.emptyState}
        >
          <View style={styles.targetIcon}>
            <View
              style={styles.targetOuter}
            />

            <View
              style={styles.targetMiddle}
            />

            <View
              style={styles.targetCenter}
            />
          </View>

          <Text style={styles.emptyTitle}>
            WAITING FOR GPS
          </Text>

          <Text style={styles.emptySubtitle}>
            Move outdoors to build your route
          </Text>
        </View>
      )}

      {/* =========================
          TOP LEFT DISTANCE
         ========================= */}

      {validRoute.length > 0 && (
        <View
          pointerEvents="none"
          style={styles.distanceCard}
        >
          <Text style={styles.distanceLabel}>
            DISTANCE
          </Text>

          <Text style={styles.distanceValue}>
            {routeLabel}
          </Text>
        </View>
      )}

      {/* =========================
          BOTTOM INFO
         ========================= */}

      {validRoute.length > 0 && (
        <View
          pointerEvents="none"
          style={styles.bottomPanel}
        >
          <View style={styles.bottomMetric}>
            <Text style={styles.metricLabel}>
              POINTS
            </Text>

            <Text style={styles.metricValue}>
              {validRoute.length}
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.bottomMetric}>
            <Text style={styles.metricLabel}>
              ROUTE
            </Text>

            <Text style={styles.metricValue}>
              {fitRoute
                ? 'FULL'
                : followLatest
                  ? 'LIVE'
                  : 'SAVED'}
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.bottomMetric}>
            <Text style={styles.metricLabel}>
              GPS
            </Text>

            <Text style={styles.metricValue}>
              {currentGps?.accuracy
                ? `±${Math.round(
                    currentGps.accuracy
                  )}m`
                : '--'}
            </Text>
          </View>
        </View>
      )}

      {/* =========================
          SCALE INDICATOR
         ========================= */}

      {validRoute.length > 0 && (
        <View
          pointerEvents="none"
          style={styles.scaleContainer}
        >
          <View style={styles.scaleLine} />

          <Text style={styles.scaleText}>
            ~500 m
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 280,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#07100B',
    borderWidth: 1,
    borderColor: '#1C3325',
  },

  background: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#07100B',
  },

  gridVertical25: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '25%',
    width: 1,
    backgroundColor: '#12261A',
  },

  gridVertical50: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
    backgroundColor: '#172E20',
  },

  gridVertical75: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '75%',
    width: 1,
    backgroundColor: '#12261A',
  },

  gridHorizontal25: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '25%',
    height: 1,
    backgroundColor: '#12261A',
  },

  gridHorizontal50: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
    backgroundColor: '#172E20',
  },

  gridHorizontal75: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '75%',
    height: 1,
    backgroundColor: '#12261A',
  },

  centerCrossHorizontal: {
    position: 'absolute',
    left: '47%',
    right: '47%',
    top: '50%',
    height: 1,
    backgroundColor: '#294635',
    opacity: 0.5,
  },

  centerCrossVertical: {
    position: 'absolute',
    top: '47%',
    bottom: '47%',
    left: '50%',
    width: 1,
    backgroundColor: '#294635',
    opacity: 0.5,
  },

  topHeader: {
    position: 'absolute',
    top: 12,
    left: 14,
    right: 14,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  routeTitle: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  routeSubtitle: {
    marginTop: 2,
    color: '#587060',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
  },

  statusLive: {
    backgroundColor: '#0B1B11',
    borderColor: '#31553D',
  },

  statusPaused: {
    backgroundColor: '#1A160A',
    borderColor: '#58491D',
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  statusDotLive: {
    backgroundColor: colors.primary,
  },

  statusDotPaused: {
    backgroundColor: '#D6B84D',
  },

  statusText: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
  },

  statusTextLive: {
    color: colors.primary,
  },

  statusTextPaused: {
    color: '#D6B84D',
  },

  routeSegment: {
    position: 'absolute',
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.65,
    shadowRadius: 5,
    elevation: 4,
    transformOrigin: 'left center',
  },

  distanceMarker: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0B1710',
    borderWidth: 1,
    borderColor: '#587060',
    alignItems: 'center',
    justifyContent: 'center',
  },

  distanceMarkerText: {
    color: '#B9C9BD',
    fontSize: 7,
    fontWeight: '900',
  },

  startMarker: {
    position: 'absolute',
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    backgroundColor: '#111',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },

  startMarkerText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },

  currentPosition: {
    position: 'absolute',
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    zIndex: 20,
    shadowColor: colors.primary,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },

  positionPulseOuter: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.35,
  },

  positionPulseInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },

  directionArrow: {
    position: 'absolute',
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
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
    transform: [{ translateY: -13 }],
  },

  emptyState: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    transform: [{ translateY: -45 }],
    alignItems: 'center',
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
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  emptySubtitle: {
    marginTop: 5,
    color: '#64796B',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },

  distanceCard: {
    position: 'absolute',
    left: 12,
    top: 55,
    zIndex: 25,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: 'rgba(7,16,11,0.94)',
    borderWidth: 1,
    borderColor: '#294635',
  },

  distanceLabel: {
    color: '#64796B',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
  },

  distanceValue: {
    marginTop: 2,
    color: '#E1ECE4',
    fontSize: 15,
    fontWeight: '900',
  },

  bottomPanel: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    backgroundColor: 'rgba(7,16,11,0.94)',
    borderWidth: 1,
    borderColor: '#1C3325',
  },

  bottomMetric: {
    minWidth: 65,
    alignItems: 'center',
  },

  metricLabel: {
    color: '#607669',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
  },

  metricValue: {
    marginTop: 2,
    color: '#DCE8DF',
    fontSize: 10,
    fontWeight: '900',
  },

  metricDivider: {
    width: 1,
    height: 25,
    backgroundColor: '#294635',
  },

  scaleContainer: {
    position: 'absolute',
    right: 12,
    bottom: 58,
    zIndex: 25,
    alignItems: 'center',
  },

  scaleLine: {
    width: 45,
    height: 3,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#7C9182',
  },

  scaleText: {
    marginTop: 3,
    color: '#708477',
    fontSize: 7,
    fontWeight: '800',
  },
});