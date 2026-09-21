import type {
  ImageSourcePropType,
} from 'react-native';

/*
 * ========================================
 * GYM BADGE ASSET REGISTRY
 * ========================================
 */

export const GYM_BADGE_REGISTRY:
  Record<
    string,
    ImageSourcePropType
  > = {

  badge_01:
    require('./badge_01.png'),

  badge_01_gold:
    require('./badge_01_gold.png'),

  badge_02:
    require('./badge_02.png'),

  badge_02_gold:
    require('./badge_02_gold.png'),

  badge_03:
    require('./badge_03.png'),

  badge_03_gold:
    require('./badge_03_gold.png'),

  badge_04:
    require('./badge_04.png'),

  badge_04_gold:
    require('./badge_04_gold.png'),

  badge_05:
    require('./badge_05.png'),

  badge_05_gold:
    require('./badge_05_gold.png'),

  badge_06:
    require('./badge_06.png'),

  badge_06_gold:
    require('./badge_06_gold.png'),

  badge_07:
    require('./badge_07.png'),

  badge_07_gold:
    require('./badge_07_gold.png'),

  badge_08:
    require('./badge_08.png'),

  badge_08_gold:
    require('./badge_08_gold.png'),
};

/*
 * ========================================
 * GET BADGE SOURCE
 * ========================================
 */

export function getGymBadgeSource(
  assetId: string
): ImageSourcePropType | null {

  return (
    GYM_BADGE_REGISTRY[assetId] ??
    null
  );
}