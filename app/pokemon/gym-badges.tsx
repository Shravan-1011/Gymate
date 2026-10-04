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
  getProfileGymBadgeStatus,
  type ProfileGymBadgeStatus,
  type ProfileDisplayGymBadge,
} from '../../services/pokemonAchievementService';

import GymBadgesCard from '../../components/pokemon/GymBadgesCard';

type BadgeTab =
  | 'normal'
  | 'gold';

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

  const [
    activeTab,
    setActiveTab,
  ] = useState<BadgeTab>(
    'normal'
  );

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

          /*
           * Load EVERY badge variant.
           *
           * Unlike getProfileDisplayGymBadges(),
           * this does not collapse Normal + Gold
           * into a single family entry.
           */
          const result =
            await getProfileGymBadgeStatus(
              profile.id
            );

          /*
           * Convert the status result into the
           * display shape expected by GymBadgesCard.
           */
          const displayBadges:
            ProfileDisplayGymBadge[] =
            result.map(
              (
                entry:
                  ProfileGymBadgeStatus
              ) => ({
                badge:
                  entry.badge,

                earned:
                  entry.earned,

                displayVariant:
                  entry.earned
                    ? entry.badge.variant
                    : 'locked',
              })
            );

          setBadges(
            displayBadges
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
   * VISIBLE BADGES
   * ======================================
   *
   * Only show the currently selected
   * Normal or Gold variant.
   */

  const visibleBadges =
    badges.filter(
      (
        badge
      ) =>
        badge.badge.variant ===
        activeTab
    );

  /*
   * ======================================
   * COUNTS
   * ======================================
   */

  const earnedCount =
    visibleBadges.filter(
      (
        badge
      ) =>
        badge.earned
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
              {earnedCount} / {
                visibleBadges.length
              }
            </Text>

            <Text
              style={
                styles.summarySubtext
              }
            >
              {activeTab === 'gold'
                ? 'GOLD BADGES'
                : 'NORMAL BADGES'}
            </Text>

          </View>

          {/* ==================================
              NORMAL / GOLD TABS
              ================================== */}

          <View
            style={
              styles.tabContainer
            }
          >

            {/* NORMAL TAB */}

            <Pressable
              onPress={() =>
                setActiveTab(
                  'normal'
                )
              }
              style={[
                styles.tab,

                activeTab ===
                  'normal' &&
                  styles.tabActive,
              ]}
            >

              <Text
                style={[
                  styles.tabText,

                  activeTab ===
                    'normal' &&
                    styles.tabTextActive,
                ]}
              >
                NORMAL
              </Text>

            </Pressable>

            {/* GOLD TAB */}

            <Pressable
              onPress={() =>
                setActiveTab(
                  'gold'
                )
              }
              style={[
                styles.tab,

                activeTab ===
                  'gold' &&
                  styles.tabGoldActive,
              ]}
            >

              <Text
                style={[
                  styles.tabText,

                  activeTab ===
                    'gold' &&
                    styles.tabGoldTextActive,
                ]}
              >
                GOLD
              </Text>

            </Pressable>

          </View>

          {/* ==================================
              BADGES
              ================================== */}

          {visibleBadges.map(
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
     * ======================================
     * HEADER
     * ======================================
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
     * ======================================
     * LOADING
     * ======================================
     */

    loading: {
      flex: 1,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    /*
     * ======================================
     * CONTENT
     * ======================================
     */

    content: {
      padding:
        spacing.lg,

      paddingBottom:
        spacing.xxxl,
    },

    /*
     * ======================================
     * SUMMARY
     * ======================================
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

    /*
     * ======================================
     * NORMAL / GOLD TABS
     * ======================================
     */

    tabContainer: {
      flexDirection:
        'row',

      marginBottom:
        spacing.lg,

      borderWidth:
        2,

      borderColor:
        colors.border,

      backgroundColor:
        colors.surface,
    },

    tab: {
      flex: 1,

      minHeight:
        42,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRightWidth:
        1,

      borderRightColor:
        colors.border,
    },

    tabActive: {
      backgroundColor:
        colors.primary,
    },

    tabGoldActive: {
      backgroundColor:
        '#FFD700',
    },

    tabText: {
      fontFamily:
        'PressStart2P',

      fontSize:
        7,

      color:
        colors.textSecondary,
    },

    tabTextActive: {
      color:
        colors.background,
    },

    tabGoldTextActive: {
      color:
        colors.background,
    },

  });