import {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  router,
  useFocusEffect,
} from 'expo-router';

import { useProfile } from '../../context/ProfileContext';

import PixelCard from '../../components/PixelCard';

import {
  colors,
  spacing,
} from '../../constants/theme';

import {
  getProfileAchievementStatus,
  type ProfileAchievementStatus,
  type AchievementProgress,
} from '../../services/pokemonAchievementService';

/*
 * ========================================
 * PROGRESS FORMATTER
 * ========================================
 */

function formatNumber(
  value: number
): string {

  if (
    Number.isInteger(value)
  ) {
    return value.toLocaleString();
  }

  return value.toLocaleString(
    undefined,
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  );
}

/*
 * ========================================
 * PROGRESS LABEL
 * ========================================
 */

function getProgressLabel(
  progress:
    AchievementProgress
): string {

  const current =
    formatNumber(
      progress.current
    );

  const target =
    formatNumber(
      progress.target
    );

  switch (
    progress.unit
  ) {

    case 'pokemon':
      return `${current} / ${target} POKÉMON`;

    case 'level_100_pokemon':
      return `${current} / ${target} LV.100 POKÉMON`;

    case 'days':
      return `${current} / ${target} DAYS`;

    case 'workouts':
      return `${current} / ${target} WORKOUTS`;

    case 'perfect_nutrition_days':
      return `${current} / ${target} PERFECT DAYS`;

    case 'ten_k_step_days':
      return `${current} / ${target} 10K STEP DAYS`;

    case 'kilometers':
      return `${current} / ${target} KM`;

    case 'badges':
      return `${current} / ${target} BADGES`;

    case 'pokemon_owned':
      return `${current} / ${target} POKÉMON`;

    default:
      return `${current} / ${target}`;
  }
}

/*
 * ========================================
 * ACHIEVEMENT CARD
 * ========================================
 */

function AchievementCard({
  status,
}: {
  status:
    ProfileAchievementStatus;
}) {

  const achievement =
    status.achievement;

  const progress =
    status.progress;

  const percentage =
    Math.round(
      progress.percentage
    );

  return (
    <PixelCard
      padding={spacing.md}
      style={[
        styles.card,

        status.unlocked &&
          styles.cardUnlocked,
      ]}
    >

      {/* HEADER */}

      <View style={styles.row}>

        {/* ICON */}

        <View
          style={[
            styles.achievementIcon,

            status.unlocked &&
              styles.achievementIconUnlocked,
          ]}
        >

          <Text
            style={[
              styles.achievementIconText,

              !status.unlocked &&
                styles.achievementIconTextLocked,
            ]}
          >
            {status.unlocked
              ? '◆'
              : '◇'}
          </Text>

        </View>

        {/* NAME */}

        <View
          style={
            styles.nameContainer
          }
        >

          <Text
            style={[
              styles.name,

              !status.unlocked &&
                styles.nameLocked,
            ]}
          >
            {achievement.name}
          </Text>

          <Text
            style={
              styles.statusText
            }
          >
            {status.unlocked
              ? 'UNLOCKED'
              : 'LOCKED'}
          </Text>

        </View>

      </View>

      {/* DESCRIPTION */}

      <Text
        style={
          styles.description
        }
      >
        {achievement.description}
      </Text>

      {/* PROGRESS */}

      <View
        style={
          styles.progressSection
        }
      >

        <View
          style={
            styles.progressHeader
          }
        >

          <Text
            style={
              styles.progressTitle
            }
          >
            PROGRESS
          </Text>

          <Text
            style={
              styles.progressPercentage
            }
          >
            {percentage}%
          </Text>

        </View>

        <Text
          style={
            styles.progressValue
          }
        >
          {getProgressLabel(
            progress
          )}
        </Text>

        {/* BAR */}

        <View
          style={
            styles.progressTrack
          }
        >

          <View
            style={[
              styles.progressFill,

              {
                width:
                  `${percentage}%`,
              },

              status.unlocked &&
                styles.progressFillUnlocked,
            ]}
          />

        </View>

      </View>

      {/* REWARD */}

      <View
        style={
          styles.rewardRow
        }
      >

        <Text
          style={
            styles.rewardLabel
          }
        >
          REWARD
        </Text>

        {achievement.rewardShards >
          0 && (
          <Text
            style={
              styles.reward
            }
          >
            +{achievement.rewardShards}{' '}
            SHARDS
          </Text>
        )}

        {achievement.rewardBadgeId && (
          <Text
            style={
              styles.badgeReward
            }
          >
            + GYM BADGE
          </Text>
        )}

      </View>

    </PixelCard>
  );
}

/*
 * ========================================
 * SCREEN
 * ========================================
 */

export default function PokemonAchievementsScreen() {

  const {
    profile,
  } = useProfile();

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    statuses,
    setStatuses,
  ] = useState<
    ProfileAchievementStatus[]
  >([]);

  /*
   * ======================================
   * LOAD
   * ======================================
   */

  const load =
    useCallback(
      async () => {

        if (
          !profile?.id
        ) {
          setIsLoading(
            false
          );

          return;
        }

        setIsLoading(
          true
        );

        try {

          const result =
            await getProfileAchievementStatus(
              profile.id
            );

          setStatuses(
            result
          );

        } catch (
          error
        ) {

          console.error(
            '[POKEMON] Failed to load achievements:',
            error
          );

        } finally {

          setIsLoading(
            false
          );
        }

      },
      [
        profile?.id,
      ]
    );

  /*
   * ======================================
   * REFRESH ON FOCUS
   * ======================================
   */

  useFocusEffect(
    useCallback(
      () => {

        load();

      },
      [
        load,
      ]
    )
  );

  /*
   * ======================================
   * COUNTS
   * ======================================
   */

  const unlockedCount =
    statuses.filter(
      (
        status
      ) =>
        status.unlocked
    ).length;

  /*
   * ======================================
   * SCREEN
   * ======================================
   */

  return (
    <View
      style={
        styles.container
      }
    >

      {/* HEADER */}

      <View
        style={
          styles.header
        }
      >

        <Pressable
          onPress={() =>
            router.back()
          }
          hitSlop={10}
        >

          <Text
            style={
              styles.backButton
            }
          >
            {'< BACK'}
          </Text>

        </Pressable>

        <Text
          style={
            styles.title
          }
        >
          ACHIEVEMENTS
        </Text>

        <View
          style={
            styles.headerSpacer
          }
        />

      </View>

      {isLoading ? (

        <View
          style={
            styles.loadingScreen
          }
        >

          <ActivityIndicator
            size="small"
            color={
              colors.primary
            }
          />

        </View>

      ) : (

        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.content
          }
        >

          {/* ==================================
              OVERALL PROGRESS
              ================================== */}

          <PixelCard
            padding={
              spacing.md
            }
            style={
              styles.progressCard
            }
          >

            <Text
              style={
                styles.progressLabel
              }
            >
              ACHIEVEMENT PROGRESS
            </Text>

            <Text
              style={
                styles.progressValueLarge
              }
            >
              {unlockedCount} / {statuses.length}
            </Text>

            <Text
              style={
                styles.progressSubtext
              }
            >
              {unlockedCount ===
              statuses.length
                ? 'ALL ACHIEVEMENTS UNLOCKED'
                : `${statuses.length - unlockedCount} REMAINING`}
            </Text>

          </PixelCard>

          {/* ==================================
              ACHIEVEMENTS
              ================================== */}

          {statuses.map(
            (
              status
            ) => (

              <AchievementCard
                key={
                  status
                    .achievement
                    .id
                }
                status={
                  status
                }
              />

            )
          )}

        </ScrollView>
      )}

    </View>
  );
}

/*
 * ========================================
 * STYLES
 * ========================================
 */

const styles =
  StyleSheet.create({

    container: {
      flex: 1,

      backgroundColor:
        colors.background,
    },

    /*
     * HEADER
     */

    header: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      paddingHorizontal:
        spacing.lg,

      paddingTop:
        spacing.xxl,

      paddingBottom:
        spacing.md,
    },

    backButton: {
      fontFamily:
        'VT323',

      fontSize:
        20,

      color:
        colors.primary,
    },

    title: {
      fontFamily:
        'PressStart2P',

      fontSize:
        13,

      color:
        colors.text,
    },

    headerSpacer: {
      width:
        60,
    },

    /*
     * LOADING
     */

    loadingScreen: {
      flex: 1,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    /*
     * CONTENT
     */

    content: {
      padding:
        spacing.lg,

      paddingBottom:
        spacing.xxxl,
    },

    /*
     * OVERALL PROGRESS
     */

    progressCard: {
      marginBottom:
        spacing.lg,

      alignItems:
        'center',
    },

    progressLabel: {
      fontFamily:
        'PressStart2P',

      fontSize:
        8,

      color:
        colors.textSecondary,
    },

    progressValueLarge: {
      fontFamily:
        'PressStart2P',

      fontSize:
        22,

      color:
        colors.primary,

      marginTop:
        spacing.sm,
    },

    progressSubtext: {
      fontFamily:
        'VT323',

      fontSize:
        16,

      color:
        colors.textMuted,

      marginTop:
        spacing.xs,
    },

    /*
     * ACHIEVEMENT CARD
     */

    card: {
      marginBottom:
        spacing.md,

      opacity:
        0.55,

      borderColor:
        colors.border,
    },

    cardUnlocked: {
      opacity:
        1,

      borderColor:
        colors.primary,
    },

    /*
     * HEADER ROW
     */

    row: {
      flexDirection:
        'row',

      alignItems:
        'center',
    },

    achievementIcon: {
      width:
        44,

      height:
        44,

      borderWidth:
        1,

      borderColor:
        colors.border,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight:
        spacing.sm,

      backgroundColor:
        colors.surfaceLight,
    },

    achievementIconUnlocked: {
      borderColor:
        colors.primary,
    },

    achievementIconText: {
      fontFamily:
        'PressStart2P',

      fontSize:
        18,

      color:
        colors.primary,
    },

    achievementIconTextLocked: {
      color:
        colors.textMuted,
    },

    nameContainer: {
      flex: 1,
    },

    name: {
      fontFamily:
        'PressStart2P',

      fontSize:
        10,

      color:
        colors.text,
    },

    nameLocked: {
      color:
        colors.textSecondary,
    },

    statusText: {
      fontFamily:
        'VT323',

      fontSize:
        14,

      color:
        colors.primary,

      marginTop:
        3,
    },

    /*
     * DESCRIPTION
     */

    description: {
      fontFamily:
        'VT323',

      fontSize:
        17,

      color:
        colors.textSecondary,

      marginTop:
        spacing.md,

      lineHeight:
        20,
    },

    /*
     * ACHIEVEMENT PROGRESS
     */

    progressSection: {
      marginTop:
        spacing.md,
    },

    progressHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',
    },

    progressTitle: {
      fontFamily:
        'PressStart2P',

      fontSize:
        7,

      color:
        colors.textMuted,
    },

    progressPercentage: {
      fontFamily:
        'PressStart2P',

      fontSize:
        8,

      color:
        colors.primary,
    },

    progressValue: {
      fontFamily:
        'VT323',

      fontSize:
        17,

      color:
        colors.text,

      marginTop:
        spacing.xs,
    },

    /*
     * PROGRESS BAR
     */

    progressTrack: {
      height:
        12,

      marginTop:
        spacing.sm,

      backgroundColor:
        colors.surfaceLight,

      borderWidth:
        1,

      borderColor:
        colors.border,

      overflow:
        'hidden',
    },

    progressFill: {
      height:
        '100%',

      backgroundColor:
        colors.primary,

      opacity:
        0.65,
    },

    progressFillUnlocked: {
      opacity:
        1,
    },

    /*
     * REWARD
     */

    rewardRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      flexWrap:
        'wrap',

      gap:
        spacing.sm,

      marginTop:
        spacing.md,
    },

    rewardLabel: {
      fontFamily:
        'PressStart2P',

      fontSize:
        7,

      color:
        colors.textMuted,
    },

    reward: {
      fontFamily:
        'VT323',

      fontSize:
        15,

      color:
        colors.primary,
    },

    badgeReward: {
      fontFamily:
        'VT323',

      fontSize:
        15,

      color:
        colors.text,
    },

  });