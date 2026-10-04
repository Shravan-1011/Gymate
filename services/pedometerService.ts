import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';

import {
  initialize as initializeHealthConnect,
  getSdkStatus,
  requestPermission as requestHealthConnectPermission,
  getGrantedPermissions,
  readRecords,
} from 'react-native-health-connect';

export type PedometerPermissionState =
  | 'granted'
  | 'denied'
  | 'undetermined';

export type PedometerStatus = {
  available: boolean;
  permission: PedometerPermissionState;
  granted: boolean;
  rawStatus: string;
};

/*
 * ============================================================
 * ANDROID HEALTH CONNECT
 * ============================================================
 */

let healthConnectInitialized = false;

async function ensureHealthConnect(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    if (healthConnectInitialized) {
      return true;
    }

    const sdkStatus = await getSdkStatus();

    console.log(
      '[Gymate] Health Connect SDK status:',
      sdkStatus,
    );

    /*
     * SDK status 1 means unavailable.
     * We still attempt initialization because
     * provider implementations can vary.
     */

    if (sdkStatus === 1) {
      console.warn(
        '[Gymate] Health Connect is unavailable.',
      );

      return false;
    }

    const initialized =
      await initializeHealthConnect();

    console.log(
      '[Gymate] Health Connect initialized:',
      initialized,
    );

    if (!initialized) {
      return false;
    }

    healthConnectInitialized = true;

    return true;
  } catch (error) {
    console.error(
      '[Gymate] Health Connect initialization failed:',
      error,
    );

    return false;
  }
}

/*
 * ============================================================
 * HEALTH CONNECT PERMISSION
 * ============================================================
 */

async function hasHealthConnectStepPermission(): Promise<boolean> {
  try {
    const granted =
      await getGrantedPermissions();

    const hasSteps =
      granted.some(
        permission =>
          permission.accessType === 'read' &&
          permission.recordType === 'Steps',
      );

    console.log(
      '[Gymate] Health Connect step permission:',
      hasSteps,
    );

    return hasSteps;
  } catch (error) {
    console.error(
      '[Gymate] Failed to check Health Connect permissions:',
      error,
    );

    return false;
  }
}

async function requestHealthConnectStepPermission(): Promise<boolean> {
  try {
    const initialized =
      await ensureHealthConnect();

    if (!initialized) {
      return false;
    }

    const existing =
      await hasHealthConnectStepPermission();

    if (existing) {
      return true;
    }

    const permissions =
      await requestHealthConnectPermission([
        {
          accessType: 'read',
          recordType: 'Steps',
        },
      ]);

    console.log(
      '[Gymate] Health Connect permission result:',
      permissions,
    );

    return permissions.some(
      permission =>
        permission.accessType === 'read' &&
        permission.recordType === 'Steps',
    );
  } catch (error) {
    console.error(
      '[Gymate] Failed to request Health Connect permission:',
      error,
    );

    return false;
  }
}

/*
 * ============================================================
 * DATE HELPERS
 * ============================================================
 */

function startOfToday(): Date {
  const date = new Date();

  date.setHours(
    0,
    0,
    0,
    0,
  );

  return date;
}

function endOfToday(): Date {
  const date = new Date();

  date.setHours(
    23,
    59,
    59,
    999,
  );

  return date;
}

/*
 * ============================================================
 * ANDROID HEALTH CONNECT STEP READER
 * ============================================================
 */

async function getTodayHealthConnectSteps(): Promise<number> {
  try {
    const initialized =
      await ensureHealthConnect();

    if (!initialized) {
      return 0;
    }

    const permission =
      await hasHealthConnectStepPermission();

    if (!permission) {
      return 0;
    }

    const startTime =
      startOfToday().toISOString();

    const endTime =
      new Date().toISOString();

    const result =
      await readRecords(
        'Steps',
        {
          timeRangeFilter: {
            operator: 'between',
            startTime,
            endTime,
          },
        },
      );

    const records =
      result.records ?? [];

    /*
     * Health Connect can contain multiple
     * step sources, e.g. Google Fit,
     * Samsung Health, device sensors, etc.
     *
     * We therefore need to combine the records.
     */

    const total =
      records.reduce(
        (
          sum,
          record,
        ) => {
          const count =
            Number(record.count);

          if (
            !Number.isFinite(count) ||
            count < 0
          ) {
            return sum;
          }

          return sum + count;
        },
        0,
      );

    const steps =
      Math.max(
        0,
        Math.floor(total),
      );

    console.log(
      '[Gymate] Health Connect today steps:',
      {
        records: records.length,
        steps,
      },
    );

    return steps;
  } catch (error) {
    console.error(
      '[Gymate] Failed to read Health Connect steps:',
      error,
    );

    return 0;
  }
}

/*
 * ============================================================
 * IOS PEDOMETER
 * ============================================================
 */

async function getTodayIOSSteps(): Promise<number> {
  try {
    const available =
      await Pedometer.isAvailableAsync();

    if (!available) {
      return 0;
    }

    const permission =
      await Pedometer.getPermissionsAsync();

    if (!permission.granted) {
      return 0;
    }

    const result =
      await Pedometer.getStepCountAsync(
        startOfToday(),
        new Date(),
      );

    return Math.max(
      0,
      Math.floor(result.steps),
    );
  } catch (error) {
    console.error(
      '[Gymate] Failed to read iOS steps:',
      error,
    );

    return 0;
  }
}

/*
 * ============================================================
 * STATUS
 * ============================================================
 */

export async function getPedometerStatus(): Promise<PedometerStatus> {
  /*
   * Android
   */

  if (Platform.OS === 'android') {
    try {
      const initialized =
        await ensureHealthConnect();

      if (!initialized) {
        return {
          available: false,
          permission: 'denied',
          granted: false,
          rawStatus: 'health-connect-unavailable',
        };
      }

      const granted =
        await hasHealthConnectStepPermission();

      return {
        available: true,
        permission:
          granted
            ? 'granted'
            : 'undetermined',
        granted,
        rawStatus:
          granted
            ? 'granted'
            : 'health-connect-permission-required',
      };
    } catch (error) {
      console.error(
        '[Gymate] Failed to get Android step status:',
        error,
      );

      return {
        available: false,
        permission: 'denied',
        granted: false,
        rawStatus: 'error',
      };
    }
  }

  /*
   * iOS
   */

  try {
    const available =
      await Pedometer.isAvailableAsync();

    if (!available) {
      return {
        available: false,
        permission: 'denied',
        granted: false,
        rawStatus: 'pedometer-unavailable',
      };
    }

    const permission =
      await Pedometer.getPermissionsAsync();

    return {
      available: true,
      permission:
        permission.status === 'granted'
          ? 'granted'
          : permission.status === 'denied'
            ? 'denied'
            : 'undetermined',
      granted:
        permission.granted,
      rawStatus:
        permission.status,
    };
  } catch (error) {
    console.error(
      '[Gymate] Failed to get iOS pedometer status:',
      error,
    );

    return {
      available: false,
      permission: 'denied',
      granted: false,
      rawStatus: 'error',
    };
  }
}

/*
 * ============================================================
 * REQUEST PERMISSION
 * ============================================================
 */

export async function requestPedometerPermission(): Promise<PedometerPermissionState> {
  /*
   * Android uses Health Connect.
   */

  if (Platform.OS === 'android') {
    const granted =
      await requestHealthConnectStepPermission();

    return granted
      ? 'granted'
      : 'denied';
  }

  /*
   * iOS uses Expo Pedometer.
   */

  try {
    const available =
      await Pedometer.isAvailableAsync();

    if (!available) {
      return 'denied';
    }

    const before =
      await Pedometer.getPermissionsAsync();

    if (before.granted) {
      return 'granted';
    }

    const permission =
      await Pedometer.requestPermissionsAsync();

    return permission.status === 'granted'
      ? 'granted'
      : 'denied';
  } catch (error) {
    console.error(
      '[Gymate] Failed to request iOS pedometer permission:',
      error,
    );

    return 'denied';
  }
}

/*
 * ============================================================
 * GET TODAY'S DEVICE STEPS
 * ============================================================
 */

export async function getTodayDeviceSteps(): Promise<number> {
  /*
   * Android
   */

  if (Platform.OS === 'android') {
    return getTodayHealthConnectSteps();
  }

  /*
   * iOS
   */

  return getTodayIOSSteps();
}

/*
 * ============================================================
 * LIVE SUBSCRIPTION
 * ============================================================
 */

export async function subscribeToPedometer(
  onSteps: (steps: number) => void,
) {
  /*
   * Android:
   *
   * Health Connect is our source of truth.
   *
   * Health Connect data may not update every
   * second, so poll it while the Activity screen
   * is open.
   */

  if (Platform.OS === 'android') {
    try {
      const initialized =
        await ensureHealthConnect();

      if (!initialized) {
        return null;
      }

      const permission =
        await hasHealthConnectStepPermission();

      if (!permission) {
        return null;
      }

      let stopped = false;

      const poll = async () => {
        if (stopped) {
          return;
        }

        const steps =
          await getTodayHealthConnectSteps();

        if (!stopped) {
          onSteps(steps);
        }
      };

      /*
       * Read immediately.
       */

      await poll();

      /*
       * Refresh every 10 seconds while
       * the Activity screen is open.
       */

      const interval =
        setInterval(
          poll,
          10_000,
        );

      return {
        remove: () => {
          stopped = true;
          clearInterval(interval);
        },
      };
    } catch (error) {
      console.error(
        '[Gymate] Failed to start Android step polling:',
        error,
      );

      return null;
    }
  }

  /*
   * iOS:
   * Native pedometer watcher.
   */

  try {
    const available =
      await Pedometer.isAvailableAsync();

    if (!available) {
      return null;
    }

    const permission =
      await Pedometer.getPermissionsAsync();

    if (!permission.granted) {
      return null;
    }

    return Pedometer.watchStepCount(
      result => {
        const steps =
          Math.max(
            0,
            Math.floor(
              result.steps,
            ),
          );

        onSteps(steps);
      },
    );
  } catch (error) {
    console.error(
      '[Gymate] Failed to subscribe to iOS pedometer:',
      error,
    );

    return null;
  }
}