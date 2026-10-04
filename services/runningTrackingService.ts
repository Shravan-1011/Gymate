import * as Location from 'expo-location';

import {
  createRunningSession,
  getActiveRunningSession,
  getRunningSessionById,
  updateRunningSession,
} from '../database/activityRepository';

export { getRunningSessionById };

import type {
  RunLocationPoint,
  RunningSession,
} from '../types/activity';

import {
  calculateAveragePace,
  calculateFastestPace,
  calculateValidMovementMeters,
  isValidRunningPoint,
} from '../utils/runningMath';


export const RUNNING_LOCATION_TASK =
  'gymate-running-location-task';


function nowISO(): string {
  return new Date().toISOString();
}


function todayDate(): string {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    date.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}


/*
 * ========================================
 * PERMISSIONS
 * ========================================
 */

export async function requestRunningPermissions() {
  const foreground =
    await Location.requestForegroundPermissionsAsync();

  if (foreground.status !== 'granted') {
    return {
      foregroundGranted: false,
      backgroundGranted: false,
    };
  }

  const background =
    await Location.requestBackgroundPermissionsAsync();

  return {
    foregroundGranted: true,
    backgroundGranted:
      background.status === 'granted',
  };
}


/*
 * ========================================
 * LOCATION SERVICES
 * ========================================
 */

export async function isLocationEnabled(): Promise<boolean> {
  return Location.hasServicesEnabledAsync();
}


/*
 * ========================================
 * LOCATION → RUN POINT
 * ========================================
 */

export function locationToRunPoint(
  location: Location.LocationObject,
): RunLocationPoint {

  return {
    latitude:
      location.coords.latitude,

    longitude:
      location.coords.longitude,

    timestamp:
      new Date(
        location.timestamp,
      ).toISOString(),

    altitude:
      location.coords.altitude ?? null,

    accuracy:
      location.coords.accuracy ?? null,

    speed:
      location.coords.speed ?? null,
  };
}


/*
 * ========================================
 * START RUN
 * ========================================
 */

export async function startRunningSession(
  profileId: string,
): Promise<RunningSession> {

  if (!profileId) {
    throw new Error(
      'Profile ID is required to start a run.',
    );
  }


  const existing =
    await getActiveRunningSession(
      profileId,
    );


  if (existing) {
    throw new Error(
      'A running session is already active.',
    );
  }


  const permission =
    await requestRunningPermissions();


  if (!permission.foregroundGranted) {
    throw new Error(
      'Location permission is required to start a run.',
    );
  }


  const locationEnabled =
    await isLocationEnabled();


  if (!locationEnabled) {
    throw new Error(
      'Location services are disabled on the device.',
    );
  }


  const startedAt =
    nowISO();


  /*
   * IMPORTANT:
   *
   * Pass the exact start timestamp into
   * the database.
   */

  const run =
    await createRunningSession(
      profileId,
      startedAt,
    );


  return run;
}


/*
 * ========================================
 * ROUTE STATS
 * ========================================
 */

export function calculateRouteStats(
  route: RunLocationPoint[],
  durationSeconds: number,
) {

  let distanceMeters = 0;


  for (
    let index = 1;
    index < route.length;
    index++
  ) {

    const previous =
      route[index - 1];

    const current =
      route[index];


    if (
      !isValidRunningPoint(previous) ||
      !isValidRunningPoint(current)
    ) {
      continue;
    }


    distanceMeters +=
      calculateValidMovementMeters(
        previous,
        current,
      );
  }


  const averagePace =
    calculateAveragePace(
      durationSeconds,
      distanceMeters,
    );


  const fastestPace =
    calculateFastestPace(
      route,
    );


  return {

    distanceMeters,

    averagePaceSecondsPerKm:
      averagePace,

    fastestPaceSecondsPerKm:
      fastestPace,

  };
}


/*
 * ========================================
 * APPEND GPS LOCATIONS
 * ========================================
 */

export async function appendRunLocations(
  profileId: string,
  runId: string,
  locations: RunLocationPoint[],
): Promise<RunningSession | null> {

  if (
    locations.length === 0
  ) {
    return getRunningSessionById(
      profileId,
      runId,
    );
  }


  const run =
    await getRunningSessionById(
      profileId,
      runId,
    );


  if (!run) {
    return null;
  }


  /*
   * GPS points are accepted ONLY while
   * the run is actively running.
   */

  if (
    run.status !== 'active'
  ) {
    return run;
  }


  const validLocations =
    locations.filter(
      isValidRunningPoint,
    );


  if (
    validLocations.length === 0
  ) {
    return run;
  }


  /*
   * Append the new points to the
   * persisted route.
   */

  const route = [
    ...run.route,
    ...validLocations,
  ];


  /*
   * Calculate ONLY active running time.
   *
   * Paused time is excluded.
   */

  const elapsedSeconds =
    calculateElapsedActiveSeconds(
      run,
    );


  const stats =
    calculateRouteStats(
      route,
      elapsedSeconds,
    );


  return updateRunningSession(
    profileId,
    runId,
    {

      route,

      durationSeconds:
        elapsedSeconds,

      distanceMeters:
        stats.distanceMeters,

      averagePaceSecondsPerKm:
        stats.averagePaceSecondsPerKm,

      fastestPaceSecondsPerKm:
        stats.fastestPaceSecondsPerKm,

    },
  );
}


/*
 * ========================================
 * ACTIVE DURATION
 * ========================================
 *
 * This is the important pause/resume
 * calculation.
 *
 * active duration =
 *
 *   wall clock duration
 *   -
 *   completed pause duration
 *   -
 *   current pause duration
 *
 * ========================================
 */

export function calculateElapsedActiveSeconds(
  run: RunningSession,
): number {

  if (
    !run.startedAt
  ) {
    return 0;
  }


  const started =
    new Date(
      run.startedAt,
    ).getTime();


  const end =
    run.endedAt != null
      ? new Date(
          run.endedAt,
        ).getTime()
      : Date.now();


  /*
   * Completed pauses.
   */

  let pausedMilliseconds =
    Math.max(
      0,
      run.totalPausedSeconds * 1000,
    );


  /*
   * If currently paused, also exclude
   * the current unfinished pause.
   */

  if (
    run.status === 'paused' &&
    run.pausedAt
  ) {

    pausedMilliseconds +=
      Math.max(
        0,
        end -
          new Date(
            run.pausedAt,
          ).getTime(),
      );
  }


  return Math.floor(
    Math.max(
      0,
      end -
        started -
        pausedMilliseconds,
    ) / 1000,
  );
}


/*
 * ========================================
 * PAUSE RUN
 * ========================================
 */

export async function pauseRunningSession(
  profileId: string,
  runId: string,
): Promise<RunningSession | null> {

  const run =
    await getRunningSessionById(
      profileId,
      runId,
    );


  if (!run) {
    return null;
  }


  if (
    run.status !== 'active'
  ) {
    return run;
  }


  /*
   * Persist the exact moment the pause
   * started.
   */

  const pausedAt =
    nowISO();


  /*
   * Freeze the current active duration.
   */

  const durationSeconds =
    calculateElapsedActiveSeconds(
      run,
    );


  return updateRunningSession(
    profileId,
    runId,
    {

      status:
        'paused',

      pausedAt,

      durationSeconds,

    },
  );
}


/*
 * ========================================
 * RESUME RUN
 * ========================================
 */

export async function resumeRunningSession(
  profileId: string,
  runId: string,
): Promise<RunningSession | null> {

  const run =
    await getRunningSessionById(
      profileId,
      runId,
    );


  if (!run) {
    return null;
  }


  if (
    run.status !== 'paused'
  ) {
    return run;
  }


  const resumedAt =
    nowISO();


  /*
   * Calculate how long THIS pause lasted.
   */

  const pausedMilliseconds =
    run.pausedAt
      ? Math.max(
          0,
          new Date(
            resumedAt,
          ).getTime() -
            new Date(
              run.pausedAt,
            ).getTime(),
        )
      : 0;


  const additionalPausedSeconds =
    Math.floor(
      pausedMilliseconds / 1000,
    );


  return updateRunningSession(
    profileId,
    runId,
    {

      status:
        'active',

      pausedAt:
        null,

      totalPausedSeconds:
        run.totalPausedSeconds +
        additionalPausedSeconds,

    },
  );
}


/*
 * ========================================
 * FINISH RUN
 * ========================================
 */

export async function finishRunningSession(
  profileId: string,
  runId: string,
): Promise<RunningSession | null> {

  const run =
    await getRunningSessionById(
      profileId,
      runId,
    );


  if (!run) {
    return null;
  }


  if (
    run.status !== 'active' &&
    run.status !== 'paused'
  ) {
    return run;
  }


  const endedAt =
    nowISO();


  const durationSeconds =
    calculateFinalDuration(
      run,
      endedAt,
    );


  /*
   * If the user finishes while paused,
   * the current pause must be included
   * in the permanent pause ledger.
   */

  const additionalPausedSeconds =
    run.status === 'paused' &&
    run.pausedAt
      ? Math.floor(
          Math.max(
            0,
            new Date(
              endedAt,
            ).getTime() -
              new Date(
                run.pausedAt,
              ).getTime(),
          ) / 1000,
        )
      : 0;


  const stats =
    calculateRouteStats(
      run.route,
      durationSeconds,
    );


  return updateRunningSession(
    profileId,
    runId,
    {

      status:
        'completed',

      endedAt,

      pausedAt:
        null,

      totalPausedSeconds:
        run.totalPausedSeconds +
        additionalPausedSeconds,

      durationSeconds,

      distanceMeters:
        stats.distanceMeters,

      averagePaceSecondsPerKm:
        stats.averagePaceSecondsPerKm,

      fastestPaceSecondsPerKm:
        stats.fastestPaceSecondsPerKm,

    },
  );
}


/*
 * ========================================
 * FINAL DURATION
 * ========================================
 */

function calculateFinalDuration(
  run: RunningSession,
  endedAt: string,
): number {

  const started =
    new Date(
      run.startedAt,
    ).getTime();


  const ended =
    new Date(
      endedAt,
    ).getTime();


  let pausedMilliseconds =
    Math.max(
      0,
      run.totalPausedSeconds * 1000,
    );


  if (
    run.status === 'paused' &&
    run.pausedAt
  ) {

    pausedMilliseconds +=
      Math.max(
        0,
        ended -
          new Date(
            run.pausedAt,
          ).getTime(),
      );
  }


  return Math.max(
    0,
    Math.floor(
      (
        ended -
        started -
        pausedMilliseconds
      ) / 1000,
    ),
  );
}


/*
 * ========================================
 * GET CURRENT RUN
 * ========================================
 */

export async function getCurrentRunningSession(
  profileId: string,
) {

  return getActiveRunningSession(
    profileId,
  );
}


/*
 * ========================================
 * START GPS TRACKING
 * ========================================
 */

export async function startRunningLocationTracking(): Promise<void> {

  const alreadyRunning =
    await Location.hasStartedLocationUpdatesAsync(
      RUNNING_LOCATION_TASK,
    );


  if (
    alreadyRunning
  ) {
    return;
  }


  await Location.startLocationUpdatesAsync(
    RUNNING_LOCATION_TASK,
    {

      accuracy:
        Location.Accuracy.High,

      distanceInterval:
        5,

      timeInterval:
        3000,

      deferredUpdatesDistance:
        5,

      deferredUpdatesInterval:
        3000,

      pausesUpdatesAutomatically:
        false,

      showsBackgroundLocationIndicator:
        true,

      foregroundService: {
        notificationTitle:
          'Gymate Run in Progress',

        notificationBody:
          'Gymate is tracking your running route.',

        notificationColor:
          '#b7ff3c',
      },

    },
  );
}


/*
 * ========================================
 * STOP GPS TRACKING
 * ========================================
 */

export async function stopRunningLocationTracking(): Promise<void> {

  const started =
    await Location.hasStartedLocationUpdatesAsync(
      RUNNING_LOCATION_TASK,
    );


  if (
    !started
  ) {
    return;
  }


  await Location.stopLocationUpdatesAsync(
    RUNNING_LOCATION_TASK,
  );
}


/*
 * ========================================
 * FINAL GPS CAPTURE
 * ========================================
 *
 * Best-effort foreground location before
 * finishing.
 *
 * This helps make sure the last GPS point
 * reaches the saved route before the
 * summary screen loads.
 * ========================================
 */

async function captureFinalLocation(
  profileId: string,
  runId: string,
): Promise<void> {

  try {

    const run =
      await getRunningSessionById(
        profileId,
        runId,
      );


    if (
      !run ||
      run.status !== 'active'
    ) {
      return;
    }


    const permission =
      await Location.getForegroundPermissionsAsync();


    if (
      permission.status !== 'granted'
    ) {
      return;
    }


    if (
      !(await isLocationEnabled())
    ) {
      return;
    }


    const location =
      await Location.getCurrentPositionAsync(
        {
          accuracy:
            Location.Accuracy.High,
        },
      );


    await appendRunLocations(
      profileId,
      runId,
      [
        locationToRunPoint(
          location,
        ),
      ],
    );

  } catch (error) {

    console.warn(
      'Failed to capture final running location:',
      error,
    );

  }
}


/*
 * ========================================
 * FINISH + STOP GPS
 * ========================================
 */

export async function finishRunAndStopTracking(
  profileId: string,
  runId: string,
): Promise<RunningSession | null> {

  /*
   * Capture the latest foreground point
   * before shutting down the location
   * task.
   */

  await captureFinalLocation(
    profileId,
    runId,
  );


  await stopRunningLocationTracking();


  return finishRunningSession(
    profileId,
    runId,
  );
}