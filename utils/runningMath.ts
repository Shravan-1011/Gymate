import type { RunLocationPoint } from '../types/activity';

const EARTH_RADIUS_METERS = 6_371_000;

export const MIN_VALID_ACCURACY_METERS = 50;

export const MIN_MOVEMENT_METERS = 3;

export const MAX_REASONABLE_SPEED_MPS = 12;

/**
 * Minimum distance required for a GPS segment to be considered
 * meaningful for pace calculations.
 *
 * Very short GPS movements are often caused by GPS jitter.
 */
export const MIN_PACE_SEGMENT_METERS = 10;

/**
 * Maximum pace considered physically reasonable for this app.
 *
 * 2:30/km = 24 km/h.
 *
 * This is intentionally generous enough for running while
 * preventing GPS spikes from producing absurd "best pace" values.
 */
export const MIN_REASONABLE_PACE_SECONDS_PER_KM = 150;

/**
 * Maximum pace we allow to contribute to fastest-pace calculations.
 *
 * 20:00/km.
 *
 * Slower segments are not useful for determining best pace.
 */
export const MAX_REASONABLE_PACE_SECONDS_PER_KM = 1200;

/**
 * Calculate distance between two GPS coordinates using
 * the Haversine formula.
 */
export function calculateDistanceMeters(
  first: RunLocationPoint,
  second: RunLocationPoint,
): number {
  const lat1 = toRadians(first.latitude);
  const lat2 = toRadians(second.latitude);

  const deltaLat = toRadians(
    second.latitude - first.latitude,
  );

  const deltaLon = toRadians(
    second.longitude - first.longitude,
  );

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a),
    );

  return EARTH_RADIUS_METERS * c;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Returns true when the GPS point is usable for
 * running calculations.
 */
export function isValidRunningPoint(
  point: RunLocationPoint,
): boolean {
  if (
    !Number.isFinite(point.latitude) ||
    !Number.isFinite(point.longitude)
  ) {
    return false;
  }

  if (
    point.latitude < -90 ||
    point.latitude > 90 ||
    point.longitude < -180 ||
    point.longitude > 180
  ) {
    return false;
  }

  if (
    point.accuracy != null &&
    point.accuracy > MIN_VALID_ACCURACY_METERS
  ) {
    return false;
  }

  if (
    point.speed != null &&
    (
      point.speed < 0 ||
      point.speed > MAX_REASONABLE_SPEED_MPS
    )
  ) {
    return false;
  }

  return true;
}

/**
 * Calculates a movement segment between two points.
 *
 * Returns 0 when the movement is too small or looks
 * like GPS noise.
 */
export function calculateValidMovementMeters(
  previous: RunLocationPoint,
  current: RunLocationPoint,
): number {
  if (!isValidRunningPoint(previous)) {
    return 0;
  }

  if (!isValidRunningPoint(current)) {
    return 0;
  }

  const distance = calculateDistanceMeters(
    previous,
    current,
  );

  if (distance < MIN_MOVEMENT_METERS) {
    return 0;
  }

  if (current.speed != null) {
    if (
      current.speed < 0 ||
      current.speed > MAX_REASONABLE_SPEED_MPS
    ) {
      return 0;
    }
  }

  return distance;
}

/**
 * Calculate pace in seconds per kilometer.
 */
export function calculatePaceSecondsPerKm(
  durationSeconds: number,
  distanceMeters: number,
): number | null {
  if (
    durationSeconds <= 0 ||
    distanceMeters <= 0
  ) {
    return null;
  }

  return (
    durationSeconds /
    (distanceMeters / 1000)
  );
}

/**
 * Format seconds/km for UI.
 *
 * Example:
 * 330 -> "5:30"
 */
export function formatPace(
  secondsPerKm: number | null,
): string {
  if (
    secondsPerKm == null ||
    !Number.isFinite(secondsPerKm) ||
    secondsPerKm <= 0
  ) {
    return '--:--';
  }

  const totalSeconds = Math.max(
    0,
    Math.round(secondsPerKm),
  );

  const minutes = Math.floor(
    totalSeconds / 60,
  );

  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds
    .toString()
    .padStart(2, '0')}`;
}

/**
 * Calculate average pace from total duration
 * and total distance.
 */
export function calculateAveragePace(
  durationSeconds: number,
  distanceMeters: number,
): number | null {
  return calculatePaceSecondsPerKm(
    durationSeconds,
    distanceMeters,
  );
}

/**
 * Returns the timestamp difference between two
 * GPS points in seconds.
 */
function calculateSegmentDurationSeconds(
  previous: RunLocationPoint,
  current: RunLocationPoint,
): number | null {
  const previousTime = new Date(
    previous.timestamp,
  ).getTime();

  const currentTime = new Date(
    current.timestamp,
  ).getTime();

  if (
    !Number.isFinite(previousTime) ||
    !Number.isFinite(currentTime)
  ) {
    return null;
  }

  const durationSeconds =
    (currentTime - previousTime) / 1000;

  if (
    durationSeconds <= 0 ||
    durationSeconds > 120
  ) {
    return null;
  }

  return durationSeconds;
}

/**
 * Finds the fastest meaningful pace represented
 * by the route.
 *
 * IMPORTANT:
 *
 * We intentionally do NOT use point.speed directly.
 * GPS speed readings can briefly spike and produce
 * unrealistic values.
 *
 * Instead, we calculate pace from:
 *
 *   segment distance / segment duration
 *
 * and ignore very short GPS segments.
 */
export function calculateFastestPace(
  route: RunLocationPoint[],
): number | null {
  if (route.length < 2) {
    return null;
  }

  let fastest: number | null = null;

  for (let index = 1; index < route.length; index += 1) {
    const previous = route[index - 1];
    const current = route[index];

    if (
      !isValidRunningPoint(previous) ||
      !isValidRunningPoint(current)
    ) {
      continue;
    }

    const distanceMeters =
      calculateDistanceMeters(
        previous,
        current,
      );

    /**
     * Ignore tiny GPS movements.
     *
     * Example:
     * 2–5 meter GPS jitter should never become
     * the user's "best pace".
     */
    if (
      distanceMeters <
      MIN_PACE_SEGMENT_METERS
    ) {
      continue;
    }

    const durationSeconds =
      calculateSegmentDurationSeconds(
        previous,
        current,
      );

    if (durationSeconds == null) {
      continue;
    }

    const pace =
      calculatePaceSecondsPerKm(
        durationSeconds,
        distanceMeters,
      );

    if (pace == null) {
      continue;
    }

    /**
     * Ignore physically unreasonable pace values.
     *
     * This prevents GPS jumps from creating something
     * like 0:12/km.
     */
    if (
      pace <
        MIN_REASONABLE_PACE_SECONDS_PER_KM ||
      pace >
        MAX_REASONABLE_PACE_SECONDS_PER_KM
    ) {
      continue;
    }

    if (
      fastest == null ||
      pace < fastest
    ) {
      fastest = pace;
    }
  }

  return fastest;
}