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

import {
  useProfile,
} from '../../context/ProfileContext';

import {
  colors,
  spacing,
} from '../../constants/theme';

import {
  getProfileDisplayGymBadges,
  type ProfileDisplayGymBadge,
} from '../../services/pokemonAchievementService';

import GymBadgesCard from '../../components/pokemon/GymBadgesCard';

export default function GymBadgesScreen() {

  const {
    profile,
  } = useProfile();

  const [
    badges,
    setBadges,
  ] = useState<
    ProfileDisplayGymBadge[]
  >([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  /*
   * ======================================
   * LOAD BADGES
   * ======================================
   */

  const loadBadges =
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
            await getProfileDisplayGymBadges(
              profile.id
            );

          setBadges(
            result
          );

        } catch (
          error
        ) {

          console.error(
            '[POKEMON] Failed to load gym badges:',
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
   * REFRESH WHEN SCREEN OPENS
   * ======================================
   */

  useFocusEffect(
    useCallback(
      () => {

        loadBadges();

      },
      [
        loadBadges,
      ]
    )
  );

  /*
   * ======================================
   * COUNTS
   * ======================================
   */

  const earnedCount =
    badges.filter(
      (
        badge
      ) =>
        badge.earned
    ).length;

  const goldCount =
    badges.filter(
      (
        badge
      ) =>
        badge.displayVariant ===
        'gold'
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

      {/* ==================================
          HEADER
          ================================== */}

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
          GYM BADGES
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
            styles.loading
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
              SUMMARY
              ================================== */}

          <View
            style={
              styles.summary
            }
          >

            <Text
              style={
                styles.summaryTitle
              }
            >
              GYM BADGE COLLECTION
            </Text>

            <Text
              style={
                styles.summaryValue
              }
            >
              {earnedCount} / {badges.length}
            </Text>

            <Text
              style={
                styles.summarySubtext
              }
            >
              {goldCount > 0
                ? `${goldCount} GOLD BADGE${goldCount === 1 ? '' : 'S'}`
                : 'NO GOLD BADGES YET'}
            </Text>

          </View>

          {/* ==================================
              BADGES
              ================================== */}

          {badges.map(
            (
              badge
            ) => (

              <GymBadgesCard
                key={
                  badge.badge.id
                }
                badge={
                  badge
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

    loading: {
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
     * SUMMARY
     */

    summary: {
      alignItems:
        'center',

      padding:
        spacing.lg,

      marginBottom:
        spacing.lg,

      borderWidth:
        2,

      borderColor:
        colors.border,

      backgroundColor:
        colors.surface,
    },

    summaryTitle: {
      fontFamily:
        'PressStart2P',

      fontSize:
        8,

      color:
        colors.textSecondary,

      textAlign:
        'center',
    },

    summaryValue: {
      fontFamily:
        'PressStart2P',

      fontSize:
        24,

      color:
        colors.primary,

      marginTop:
        spacing.sm,
    },

    summarySubtext: {
      fontFamily:
        'VT323',

      fontSize:
        16,

      color:
        colors.textMuted,

      marginTop:
        spacing.xs,
    },

  });