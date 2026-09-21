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
import PixelButton from '../../components/PixelButton';
import PokemonSprite from '../../components/pokemon/PokemonSprite';
import AnimatedPokemonIcon from '../../components/pokemon/AnimatedPokemonIcon';
import PokemonCry from '../../components/pokemon/PokemonCry';
import { awardXP } from '../../services/xpService';
import ProgressBar from '../../components/ProgressBar';

import { devAddPokeballShards } from '../../services/pokeballShardService';

import {
  colors,
  spacing,
} from '../../constants/theme';

import {
  getStarterState,
  getAvailableStarters,
  selectStarterPokemon,
  getTeamWithDetails,
  getShopState,
} from '../../services/pokemonService';

import {
  getPokemonXPPerLevel,
  getPokemonMaxLevel,
} from '../../services/pokemonDataService';

import {
  getOrCreateProgression,
  getXPProgress,
} from '../../services/xpService';

import {
  PokemonSpecies,
  UserPokemon,
} from '../../types/pokemon';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

/*
 * ========================================
 * TYPES
 * ========================================
 */

type TeamEntry = {
  slot: number;
  userPokemon: UserPokemon;
  species: PokemonSpecies | null;
};

/*
 * ========================================
 * TOUCHABLE CARD CONTENT WRAPPER
 * ========================================
 */

function PixelCardTouchable({
  onPress,
  children,
}: {
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.touchableContent,
        pressed && {
          opacity: 0.7,
        },
      ]}
    >
      {children}
    </Pressable>
  );
}

/*
 * ========================================
 * POKÉMON TAB
 * ========================================
 */

export default function PokemonScreen() {
  const { profile } = useProfile();
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] =
    useState(true);

  const [starterSelected, setStarterSelected] =
    useState(false);

  const [starterOptions, setStarterOptions] =
    useState<PokemonSpecies[]>([]);

  const [selectingStarterId, setSelectingStarterId] =
    useState<string | null>(null);

  const [isConfirming, setIsConfirming] =
    useState(false);

  const [revealedStarter, setRevealedStarter] =
    useState<PokemonSpecies | null>(null);

  const [team, setTeam] = useState<
    TeamEntry[]
  >([]);

  const [shardBalance, setShardBalance] =
    useState(0);

  const [trainerLevel, setTrainerLevel] =
    useState(0);

  /*
   * ======================================
   * LOAD STATE
   * ======================================
   */

  const loadState = useCallback(async () => {
    if (!profile?.id) {
      return;
    }

    setIsLoading(true);

    try {
      const state = await getStarterState(
        profile.id
      );

      setStarterSelected(
        state.starterSelected
      );

      if (!state.starterSelected) {
        setStarterOptions(
          getAvailableStarters()
        );
      } else {
        const [
          teamDetails,
          shopState,
          progression,
        ] = await Promise.all([
          getTeamWithDetails(profile.id),
          getShopState(profile.id),
          getOrCreateProgression(
            profile.id
          ),
        ]);

        setTeam(teamDetails);

        setShardBalance(
          shopState.shardBalance
        );

        setTrainerLevel(
          getXPProgress(
            progression.totalXP
          ).currentLevel
        );
      }
    } catch (error) {
      console.error(
        '[POKEMON] Failed to load Pokémon tab state:',
        error
      );
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useFocusEffect(
    useCallback(() => {
      if (!revealedStarter) {
        loadState();
      }
    }, [loadState, revealedStarter])
  );

  /*
   * ======================================
   * CONFIRM STARTER
   * ======================================
   */

  async function handleConfirmStarter() {
    if (
      !profile?.id ||
      !selectingStarterId ||
      isConfirming
    ) {
      return;
    }

    setIsConfirming(true);

    try {
      const result =
        await selectStarterPokemon(
          profile.id,
          selectingStarterId
        );

      const species =
        starterOptions.find(
          (option) =>
            option.id ===
            result.userPokemon.speciesId
        ) ?? null;

      setRevealedStarter(species);
    } catch (error) {
      console.error(
        '[POKEMON] Failed to select starter:',
        error
      );
    } finally {
      setIsConfirming(false);
    }
  }

  function handleEnterDashboard() {
    setRevealedStarter(null);
    setSelectingStarterId(null);
    loadState();
  }

  /*
   * ======================================
   * LOADING
   * ======================================
   */

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingScreen,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <ActivityIndicator
          size="small"
          color={colors.primary}
        />
      </View>
    );
  }

  /*
   * ======================================
   * STARTER REVEAL
   * ======================================
   */

  if (revealedStarter) {
    return (
      <View style={styles.container}>
        <View
          style={[
            styles.revealScreen,
            {
              paddingTop:
                insets.top + spacing.xl,
              paddingBottom:
                insets.bottom + spacing.xl,
            },
          ]}
        >
          <Text style={styles.revealLabel}>
            YOUR PARTNER
          </Text>

          <PokemonSprite
            spriteAssetId={
              revealedStarter.spriteAssetId
            }
            iconAssetId={
              revealedStarter.iconAssetId
            }
            name={revealedStarter.name}
            rarity={revealedStarter.rarity}
            size="sprite"
          />

          <PokemonCry
            cryAssetId={
              revealedStarter.cryAssetId
            }
            autoPlay
            showButton={false}
          />

          <Text style={styles.revealName}>
            {revealedStarter.name}
          </Text>

          <Text style={styles.revealFlavor}>
            {revealedStarter.name} is ready
            to grow alongside you. Every
            workout, every streak, every
            goal you hit — it grows too.
          </Text>

          <PixelButton
            title="LET'S GO"
            onPress={handleEnterDashboard}
            style={styles.revealButton}
          />
        </View>
      </View>
    );
  }

  /*
   * ======================================
   * STARTER SELECTION
   * ======================================
   */

  if (!starterSelected) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.starterScrollContent,
          {
            paddingTop:
              insets.top + spacing.lg,
            paddingBottom:
              insets.bottom +
              spacing.xxxl +
              spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          CHOOSE YOUR STARTER
        </Text>

        <Text style={styles.subtitle}>
          THIS PARTNER WILL BE WITH YOU
          FROM DAY ONE
        </Text>

        <View style={styles.starterGrid}>
          {starterOptions.map(
            (starter) => {
              const isSelected =
                selectingStarterId ===
                starter.id;

              return (
                <PixelCard
                  key={starter.id}
                  padding={spacing.md}
                  style={[
                    styles.starterCard,
                    isSelected &&
                      styles.starterCardSelected,
                  ]}
                >
                  <PixelCardTouchable
                    onPress={() =>
                      setSelectingStarterId(
                        starter.id
                      )
                    }
                  >
                    <PokemonSprite
                      spriteAssetId={
                        starter.spriteAssetId
                      }
                      iconAssetId={
                        starter.iconAssetId
                      }
                      name={starter.name}
                      rarity={
                        starter.rarity
                      }
                      size="sprite"
                    />

                    <Text
                      style={
                        styles.starterName
                      }
                    >
                      {starter.name}
                    </Text>

                    <Text
                      style={
                        styles.starterTypes
                      }
                    >
                      {starter.types
                        .join(' / ')
                        .toUpperCase()}
                    </Text>
                  </PixelCardTouchable>
                </PixelCard>
              );
            }
          )}
        </View>

        <PixelButton
          title={
            isConfirming
              ? 'CONFIRMING...'
              : 'CONFIRM CHOICE'
          }
          onPress={handleConfirmStarter}
          disabled={
            !selectingStarterId ||
            isConfirming
          }
          style={styles.confirmButton}
        />
      </ScrollView>
    );
  }

  /*
   * ======================================
   * DASHBOARD
   * ======================================
   */

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.dashboardContent,
        {
          paddingTop:
            insets.top + spacing.lg,
          paddingBottom:
            insets.bottom +
            spacing.xxxl +
            spacing.xl,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ================================
          HEADER: SHARDS + TRAINER LEVEL
          ================================ */}

      <View style={styles.statsRow}>
        <PixelCard
          style={styles.statCard}
          padding={spacing.md}
        >
          <Text style={styles.statLabel}>
            TRAINER LV
          </Text>

          <Text style={styles.statValue}>
            {trainerLevel}
          </Text>
        </PixelCard>

        <PixelCard
          style={styles.statCard}
          padding={spacing.md}
        >
          <Text style={styles.statLabel}>
            SHARDS
          </Text>

          <Text style={styles.statValue}>
            {shardBalance}
          </Text>
        </PixelCard>
      </View>

      {/* ================================
          TEAM
          ================================ */}

      <Text style={styles.sectionTitle}>
        YOUR TEAM
      </Text>

      <View style={styles.teamRow}>
        {[0, 1, 2].map((slotIndex) => {
          const entry = team.find(
            (member) =>
              member.slot ===
              slotIndex + 1
          );

          if (!entry) {
            return (
              <PixelCard
                key={`empty-${slotIndex}`}
                style={styles.teamSlotEmpty}
                padding={spacing.md}
              >
                <Text
                  style={
                    styles.emptySlotText
                  }
                >
                  EMPTY
                </Text>
              </PixelCard>
            );
          }

          const xpPerLevel =
            getPokemonXPPerLevel();

          const maxLevel =
            getPokemonMaxLevel();

          const progress =
            entry.userPokemon.level >=
            maxLevel
              ? 1
              : (entry.userPokemon.xp %
                  xpPerLevel) /
                xpPerLevel;

          return (
            <PixelCard
              key={entry.userPokemon.id}
              padding={spacing.sm}
            >
              <PixelCardTouchable
                onPress={() =>
                  router.push(
                    `/pokemon/detail/${entry.userPokemon.id}`
                  )
                }
              >
                {entry.species?.iconAssetId && (
                  <AnimatedPokemonIcon
                    iconAssetId={
                      entry.species.iconAssetId
                    }
                    size={64}
                    frameDuration={250}
                  />
                )}

                <Text
                  style={
                    styles.teamPokemonName
                  }
                  numberOfLines={1}
                >
                  {entry.species?.name ??
                    '???'}
                </Text>

                <Text
                  style={
                    styles.teamPokemonLevel
                  }
                >
                  LV {entry.userPokemon.level}
                </Text>

                <ProgressBar
                  progress={progress}
                />
              </PixelCardTouchable>
            </PixelCard>
          );
        })}
      </View>

      <Pressable
        onPress={async () => {
          if (!profile) return;

          const result =
            await devAddPokeballShards(
              profile.id,
              100
            );

          console.log(
            'DEV SHARDS:',
            result.pokeballShards
          );
        }}
        style={styles.devShardButton}
      >
        <Text style={styles.devShardButtonText}>
          DEV +100 SHARDS
        </Text>
      </Pressable>

      {__DEV__ && (
        <View style={styles.devXpContainer}>
          {[100, 500, 1000].map(
            (amount) => (
              <Pressable
                key={amount}
                onPress={async () => {
                  try {
                    if (!profile?.id) {
                      console.error(
                        'DEV XP: No profile ID'
                      );
                      return;
                    }

                    const activityDate =
                      new Date()
                        .toISOString()
                        .slice(0, 10);

                    const result =
                      await awardXP(
                        profile.id,
                        amount,
                        'dev',
                        activityDate,
                        `dev-${Date.now()}`
                      );

                    console.log(
                      `DEV: Added ${amount} XP`,
                      result
                    );
                  } catch (error) {
                    console.error(
                      'DEV XP ERROR:',
                      error
                    );
                  }
                }}
                style={styles.devButton}
              >
                <Text
                  style={
                    styles.devButtonText
                  }
                >
                  +{amount} XP
                </Text>
              </Pressable>
            )
          )}
        </View>
      )}

      {/* ================================
          NAVIGATION
          ================================ */}

      <Text style={styles.sectionTitle}>
        POKÉMON WORLD
      </Text>

      <View style={styles.navGrid}>
        <PixelButton
          title="PC"
          onPress={() =>
            router.push('/pokemon/pc')
          }
          style={styles.navButton}
        />

        <PixelButton
          title="SHOP"
          onPress={() =>
            router.push('/pokemon/shop')
          }
          style={styles.navButton}
        />

        <PixelButton
          title="ACHIEVEMENTS"
          variant="secondary"
          onPress={() =>
            router.push(
              '/pokemon/achievements'
            )
          }
          style={styles.navButton}
        />

        <PixelButton
          title="GYM BADGES"
          variant="secondary"
          onPress={() =>
            router.push('/pokemon/badges')
          }
          style={styles.navButton}
        />

        <PixelButton
          title="MUSIC"
          variant="secondary"
          onPress={() =>
            router.push('/pokemon/music')
          }
          style={[
            styles.navButton,
            styles.musicButton,
          ]}
        />
      </View>
    </ScrollView>
  );
}

/*
 * ========================================
 * STYLES
 * ========================================
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  touchableContent: {
    alignItems: 'center',
  },

  /* -------------------------------
     STARTER SELECTION
     ------------------------------- */

  starterScrollContent: {
    paddingHorizontal: spacing.lg,
  },

  title: {
    fontFamily: 'PressStart2P',
    fontSize: 16,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  subtitle: {
    fontFamily: 'VT323',
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  starterGrid: {
    gap: spacing.md,
  },

  starterCard: {
    borderColor: colors.border,
  },

  starterCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceLight,
  },

  starterName: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: colors.text,
    marginTop: spacing.sm,
  },

  starterTypes: {
    fontFamily: 'VT323',
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  confirmButton: {
    marginTop: spacing.xl,
  },

  /* -------------------------------
     STARTER REVEAL
     ------------------------------- */

  revealScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },

  revealLabel: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },

  revealName: {
    fontFamily: 'PressStart2P',
    fontSize: 18,
    color: colors.primary,
    marginTop: spacing.lg,
  },

  revealFlavor: {
    fontFamily: 'VT323',
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 24,
  },

  revealButton: {
    marginTop: spacing.xxl,
    minWidth: 200,
  },

  /* -------------------------------
     DASHBOARD
     ------------------------------- */

  dashboardContent: {
    paddingHorizontal: spacing.lg,
  },

  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },

  statCard: {
    flex: 1,
    alignItems: 'center',
  },

  statLabel: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: colors.textSecondary,
  },

  statValue: {
    fontFamily: 'PressStart2P',
    fontSize: 18,
    color: colors.primary,
    marginTop: spacing.sm,
  },

  sectionTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: colors.text,
    marginBottom: spacing.md,
  },

  teamRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },

  teamSlotEmpty: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },

  emptySlotText: {
    fontFamily: 'VT323',
    fontSize: 16,
    color: colors.textMuted,
  },

  teamPokemonName: {
    fontFamily: 'VT323',
    fontSize: 16,
    color: colors.text,
    marginTop: spacing.xs,
  },

  teamPokemonLevel: {
    fontFamily: 'VT323',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },

  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },

  navButton: {
    flexBasis: '47%',
  },

  musicButton: {
    marginBottom: spacing.lg,
  },

  /* -------------------------------
     DEV CONTROLS
     ------------------------------- */

  devShardButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#222',
    marginVertical: 12,
    alignItems: 'center',
  },

  devShardButtonText: {
    color: colors.primary,
  },

  devXpContainer: {
    gap: 8,
    marginTop: 20,
  },

  devButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ff4444',
    backgroundColor: '#2a1111',
    alignItems: 'center',
  },

  devButtonText: {
    color: '#ff5555',
    fontWeight: '700',
    fontSize: 12,
  },

  menuButton: {
    borderWidth: 1,
    borderColor: '#B8FF00',
    backgroundColor: '#101010',
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  menuButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: '#B8FF00',
  },
});