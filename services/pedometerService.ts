import { Pedometer } from 'expo-sensors';

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

function normalizePermission(
  status: string,
): PedometerPermissionState {
  if (status === 'granted') {
    return 'granted';
  }

  if (status === 'denied') {
    return 'denied';
  }

  return 'undetermined';
}

export async function getPedometerStatus(): Promise<PedometerStatus> {
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

    console.log(
      '[Gymate] Pedometer status:',
      {
        available,
        status: permission.status,
        granted: permission.granted,
        canAskAgain: permission.canAskAgain,
      },
    );

    return {
      available: true,
      permission: normalizePermission(
        permission.status,
      ),
      granted: permission.granted,
      rawStatus: permission.status,
    };
  } catch (error) {
    console.error(
      '[Gymate] Failed to get pedometer status:',
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

export async function requestPedometerPermission(): Promise<PedometerPermissionState> {
  try {
    const available =
      await Pedometer.isAvailableAsync();

    if (!available) {
      console.log(
        '[Gymate] Pedometer unavailable',
      );

      return 'denied';
    }

    const before =
      await Pedometer.getPermissionsAsync();

    console.log(
      '[Gymate] Permission BEFORE request:',
      {
        status: before.status,
        granted: before.granted,
        canAskAgain: before.canAskAgain,
      },
    );

    if (before.granted) {
      return 'granted';
    }

    const permission =
      await Pedometer.requestPermissionsAsync();

    console.log(
      '[Gymate] Permission AFTER request:',
      {
        status: permission.status,
        granted: permission.granted,
        canAskAgain: permission.canAskAgain,
      },
    );

    return normalizePermission(
      permission.status,
    );
  } catch (error) {
    console.error(
      '[Gymate] Failed to request pedometer permission:',
      error,
    );

    return 'denied';
  }
}

export async function getTodayDeviceSteps(): Promise<number> {
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

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();

    const result =
      await Pedometer.getStepCountAsync(
        start,
        end,
      );

    return Math.max(
      0,
      Math.floor(result.steps),
    );
  } catch (error) {
    console.error(
      '[Gymate] Failed to read steps:',
      error,
    );

    return 0;
  }
}

export async function subscribeToPedometer(
  onSteps: (steps: number) => void,
) {
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
      (result) => {
        const steps = Math.max(
          0,
          Math.floor(result.steps),
        );

        onSteps(steps);
      },
    );
  } catch (error) {
    console.error(
      '[Gymate] Failed to subscribe to pedometer:',
      error,
    );

    return null;
  }
}