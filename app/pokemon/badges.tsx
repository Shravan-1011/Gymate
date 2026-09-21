import {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Image,
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
  getProfileDisplayGymBadges,
} from '../../services/pokemonAchievementService';

import { getGymBadgeSource } from '../../assets/badges/registry';

type DisplayGymBadge = Awaited<
  ReturnType<
    typeof getProfileDisplayGymBadges
  >
>[number];

export default function PokemonGymBadgesScreen() {
  const { profile } = useProfile();

  const [isLoading, setIsLoading] =
    useState(true);

  const [badges, setBadges] =
    useState<DisplayGymBadge[]>([]);

  const load = useCallback(async () => {
    if (!profile?.id) {
      return;
    }

    setIsLoading(true);

    try {
      const result =
        await getProfileDisplayGymBadges(
          profile.id
        );

      setBadges(result);
    } catch (error) {
      console.error(
        '[POKEMON] Failed to load gym badges:',
        error
      );
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const earnedCount = badges.filter(
    (badge) =>
      badge.displayVariant !== 'locked'
  ).length;

  const goldCount = badges.filter(
    (badge) => badge.displayVariant === 'gold'
  ).length;

  return (
    <View style={styles.container}>
      {/* HEADER */}

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Text style={styles.backButton}>
            {'< BACK'}
          </Text>
        </Pressable>

        <Text style={styles.title}>
          GYM BADGES
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.loadingScreen}>
          <ActivityIndicator
            size="small"
            color={colors.primary}
          />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.content
          }
        >
          {/* COLLECTION SUMMARY */}

          <PixelCard
            padding={spacing.md}
            style={styles.summaryCard}
          >
            <Text
              style={styles.summaryTitle}
            >
              BADGE COLLECTION
            </Text>

            <View
              style={styles.summaryRow}
            >
              <View
                style={styles.summaryStat}
              >
                <Text
                  style={styles.summaryValue}
                >
                  {earnedCount}
                </Text>

                <Text
                  style={styles.summaryLabel}
                >
                  / {badges.length} BADGES
                </Text>
              </View>

              <View
                style={styles.summaryDivider}
              />

              <View
                style={styles.summaryStat}
              >
                <Text
                  style={styles.goldValue}
                >
                  {goldCount}
                </Text>

                <Text
                  style={styles.summaryLabel}
                >
                  GOLD
                </Text>
              </View>
            </View>
          </PixelCard>

          {/* BADGES */}

          <Text style={styles.sectionTitle}>
            GYM BADGES
          </Text>

          <View style={styles.badgeGrid}>
            {badges.map((entry) => {
              const badge =
                entry.badge;

              const source =
                entry.displayVariant !== 'locked'
                  ? getGymBadgeSource(
                      badge.assetId
                    )
                  : null;

              return (
                <PixelCard
                  key={badge.familyId}
                  padding={spacing.md}
                  style={[
                    styles.badgeCard,
                    entry.displayVariant ===
                      'normal' &&
                      styles.badgeCardNormal,
                    entry.displayVariant ===
                      'gold' &&
                      styles.badgeCardGold,
                    entry.displayVariant ===
                      'locked' &&
                      styles.badgeCardLocked,
                  ]}
                >
                  {/* BADGE IMAGE */}

                  <View
                    style={[
                      styles.badgeImageBox,
                      entry.displayVariant ===
                        'normal' &&
                        styles.badgeImageBoxNormal,
                      entry.displayVariant ===
                        'gold' &&
                        styles.badgeImageBoxGold,
                    ]}
                  >
                    {source ? (
                      <Image
                        source={source}
                        resizeMode="contain"
                        style={
                          styles.badgeImage
                        }
                      />
                    ) : (
                      <Text
                        style={
                          styles.lockedIcon
                        }
                      >
                        ?
                      </Text>
                    )}
                  </View>

                  {/* BADGE NAME */}

                  <Text
                    style={[
                      styles.badgeName,
                      entry.displayVariant ===
                        'locked' &&
                        styles.badgeNameLocked,
                    ]}
                    numberOfLines={2}
                  >
                    {badge.name}
                  </Text>

                  {/* STATUS */}

                  {entry.displayVariant ===
                    'gold' && (
                    <Text
                      style={styles.goldText}
                    >
                      ★ GOLD
                    </Text>
                  )}

                  {entry.displayVariant ===
                    'normal' && (
                    <Text
                      style={
                        styles.normalText
                      }
                    >
                      EARNED
                    </Text>
                  )}

                  {entry.displayVariant ===
                    'locked' && (
                    <Text
                      style={
                        styles.lockedText
                      }
                    >
                      LOCKED
                    </Text>
                  )}

                  <Text
                    style={
                      styles.description
                    }
                  >
                    {badge.description}
                  </Text>
                </PixelCard>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  /* HEADER */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },

  backButton: {
    fontFamily: 'VT323',
    fontSize: 20,
    color: colors.primary,
  },

  title: {
    fontFamily: 'PressStart2P',
    fontSize: 13,
    color: colors.text,
  },

  headerSpacer: {
    width: 60,
  },

  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  /* SUMMARY */

  summaryCard: {
    marginBottom: spacing.xl,
  },

  summaryTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },

  summaryValue: {
    fontFamily: 'PressStart2P',
    fontSize: 20,
    color: colors.primary,
  },

  goldValue: {
    fontFamily: 'PressStart2P',
    fontSize: 20,
    color: '#FFD700',
  },

  summaryLabel: {
    fontFamily: 'VT323',
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 3,
  },

  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },

  /* BADGES */

  sectionTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 11,
    color: colors.text,
    marginBottom: spacing.md,
  },

  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },

  badgeCard: {
    width: '47%',
    alignItems: 'center',
  },

  badgeCardLocked: {
    opacity: 0.5,
  },

  badgeCardNormal: {
    borderColor: colors.primary,
  },

  badgeCardGold: {
    borderColor: '#FFD700',
  },

  badgeImageBox: {
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceLight,
  },

  badgeImageBoxNormal: {
    borderColor: colors.primary,
  },

  badgeImageBoxGold: {
    borderColor: '#FFD700',
  },

  badgeImage: {
    width: 72,
    height: 72,
  },

  lockedIcon: {
    fontFamily: 'PressStart2P',
    fontSize: 24,
    color: colors.textMuted,
  },

  badgeName: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  badgeNameLocked: {
    color: colors.textMuted,
  },

  goldText: {
    fontFamily: 'VT323',
    fontSize: 16,
    color: '#FFD700',
    marginTop: 2,
  },

  normalText: {
    fontFamily: 'VT323',
    fontSize: 16,
    color: colors.primary,
    marginTop: 2,
  },

  lockedText: {
    fontFamily: 'VT323',
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 2,
  },

  description: {
    fontFamily: 'VT323',
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});