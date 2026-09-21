import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

import {
  getAnyActiveRunningSession,
} from '../database/activityRepository';

import {
  appendRunLocations,
  locationToRunPoint,
  RUNNING_LOCATION_TASK,
} from '../services/runningTrackingService';

TaskManager.defineTask(
  RUNNING_LOCATION_TASK,
  async ({
    data,
    error,
  }) => {
    if (error) {
      console.error(
        'Gymate running location error:',
        error,
      );

      return;
    }

    if (!data) {
      return;
    }

    const {
      locations,
    } = data as {
      locations: Location.LocationObject[];
    };

    if (
      !locations ||
      locations.length === 0
    ) {
      return;
    }

    try {
      const run =
        await getAnyActiveRunningSession();

      if (!run) {
        return;
      }

      if (run.status !== 'active') {
        return;
      }

      const points =
        locations.map(
          locationToRunPoint,
        );

      await appendRunLocations(
  run.profileId,
  run.id,
  points,
);
    } catch (taskError) {
      console.error(
        'Failed to process running locations:',
        taskError,
      );
    }
  },
);