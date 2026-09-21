import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  Modal,
} from 'react-native';

import { useCallback,useEffect, useState } from 'react';

import { router,useFocusEffect, } from 'expo-router';

import { useProfile } from '../../context/ProfileContext';

import {
  getOrCreateProgression,
  getXPProgress,
  type ProfileProgression,
} from '../../services/xpService';

import {
  getProfileDisplayGymBadges,
  type ProfileDisplayGymBadge,
} from '../../services/pokemonAchievementService';

import TrainerSelector from '../../components/profile/TrainerSelector';

import {
  countPokedexEntries,
} from '../../database/pokedexRepository';

import {
  TRAINER_SPRITES,
} from '../../constants/trainers';

import {
  updateProfile,
} from '../../database/profileRepository';

import GymBadgeIcon from '../../components/pokemon/GymBadgeIcon';

import {
  getUserPokemonForProfile,
} from '../../database/userPokemonRepository';

import {
  pokemonSpecies,
} from '../../data/pokemonSpecies';

import {
  colors,
  spacing,
} from '../../constants/theme';

import {
  useSoundSettings,
} from '../../context/SoundContext';

import {
  useMusic,
} from '../../context/MusicContext';


/*
 * ========================================
 * POKÉBALL
 * ========================================
 */

function PokeBall({
  small = false,
}: {
  small?: boolean;
}) {
  return (
    <View
      style={[
        styles.pokeBall,
        small && styles.pokeBallSmall,
      ]}
    >
      <View
        style={[
          styles.pokeBallTop,
          small && styles.pokeBallTopSmall,
        ]}
      />

      <View
        style={[
          styles.pokeBallLine,
          small && styles.pokeBallLineSmall,
        ]}
      />

      <View
        style={[
          styles.pokeBallButton,
          small && styles.pokeBallButtonSmall,
        ]}
      >
        <View
          style={[
            styles.pokeBallButtonInner,
            small &&
              styles.pokeBallButtonInnerSmall,
          ]}
        />
      </View>
    </View>
  );
}


/*
 * ========================================
 * SIMPLE PIXEL ICON
 * ========================================
 */

function PixelSymbol({
  symbol,
}: {
  symbol: string;
}) {
  return (
    <View style={styles.icon}>
      <Text style={styles.iconText}>
        {symbol}
      </Text>
    </View>
  );
}


/*
 * ========================================
 * INFO ROW
 * ========================================
 */

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.infoRow}>
      <PixelSymbol symbol={icon} />

      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <View style={styles.infoValueContainer}>
        {children}
      </View>
    </View>
  );
}


/*
 * ========================================
 * PROFILE SCREEN
 * ========================================
 */

export default function ProfileScreen() {
  const {
    profile,
    profileDetails,
    logout,
  } = useProfile();


  /*
   * ======================================
   * AUDIO
   * ======================================
   */

  const {
    soundEnabled,
    soundVolume,
    setSoundEnabled,
    setSoundVolume,
  } = useSoundSettings();

  const {
    musicEnabled,
    musicVolume,
    setMusicEnabled,
    setMusicVolume,
  } = useMusic();


  /*
   * ======================================
   * PROGRESSION STATE
   * ======================================
   */

  const [progression, setProgression] =
    useState<ProfileProgression | null>(null);

  const [
    loadingProgression,
    setLoadingProgression,
  ] = useState(true);


  /*
   * ======================================
   * POKÉDEX STATE
   * ======================================
   */

  const [pokedexCount, setPokedexCount] =
    useState(0);

  const [loadingPokedex, setLoadingPokedex] =
    useState(true);


  /*
   * ======================================
   * GYM BADGES STATE
   * ======================================
   */

  const [
    profileBadges,
    setProfileBadges,
  ] = useState<ProfileDisplayGymBadge[]>([]);

  const [
    loadingBadges,
    setLoadingBadges,
  ] = useState(true);


  /*
   * ======================================
   * TRAINER SELECTOR
   * ======================================
   */

  const [
    showTrainerSelector,
    setShowTrainerSelector,
  ] = useState(false);

  const [
    selectedTrainerId,
    setSelectedTrainerId,
  ] = useState<string | null>(
    profile?.trainerSpriteId ?? null
  );


  /*
   * ======================================
   * SYNC SELECTED TRAINER
   * ======================================
   */

  useEffect(() => {
    setSelectedTrainerId(
      profile?.trainerSpriteId ?? null
    );
  }, [profile?.trainerSpriteId]);


  /*
   * ======================================
   * LOAD PROGRESSION
   * ======================================
   */

  useEffect(() => {
    const loadProgression = async () => {
      try {
        if (!profile?.id) {
          setProgression(null);
          return;
        }

        const data =
          await getOrCreateProgression(
            profile.id
          );

        setProgression(data);
      } catch (error) {
        console.error(
          'Failed to load progression:',
          error
        );
      } finally {
        setLoadingProgression(false);
      }
    };

    loadProgression();
  }, [profile?.id]);


  /*
   * ======================================
   * LOAD POKÉDEX
   * ======================================
   */

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const loadPokedex = async () => {
        if (!profile?.id) {
          if (mounted) {
            setPokedexCount(0);
            setLoadingPokedex(false);
          }

          return;
        }

        try {
          setLoadingPokedex(true);

          const count =
            await countPokedexEntries(
              profile.id
            );

          if (mounted) {
            setPokedexCount(count);
          }
        } catch (error) {
          console.error(
            'Failed to load Pokédex:',
            error
          );

          if (mounted) {
            setPokedexCount(0);
          }
        } finally {
          if (mounted) {
            setLoadingPokedex(false);
          }
        }
      };

      loadPokedex();

      return () => {
        mounted = false;
      };
    }, [profile?.id])
  );


  /*
   * ======================================
   * LOAD GYM BADGES
   * ======================================
   */

  useEffect(() => {
    let mounted = true;

    const loadBadges = async () => {
      if (!profile?.id) {
        if (mounted) {
          setProfileBadges([]);
          setLoadingBadges(false);
        }

        return;
      }

      try {
        setLoadingBadges(true);

        const badges =
          await getProfileDisplayGymBadges(
            profile.id
          );

        if (mounted) {
          setProfileBadges(badges);
        }
      } catch (error) {
        console.error(
          'Failed to load gym badges:',
          error
        );

        if (mounted) {
          setProfileBadges([]);
        }
      } finally {
        if (mounted) {
          setLoadingBadges(false);
        }
      }
    };

    loadBadges();

    return () => {
      mounted = false;
    };
  }, [profile?.id]);


  /*
   * ======================================
   * SELECTED TRAINER
   * ======================================
   */

  const selectedTrainer =
    TRAINER_SPRITES.find(
      trainer =>
        trainer.id === selectedTrainerId
    ) ?? null;


  /*
   * ======================================
   * TRAINER SELECT
   * ======================================
   */

  async function handleTrainerSelect(
    trainerId: string
  ) {
    if (!profile?.id) {
      return;
    }

    try {
      const updatedProfile =
        await updateProfile(
          profile.id,
          {
            trainerSpriteId:
              trainerId,
          }
        );

      if (updatedProfile) {
        setSelectedTrainerId(
          trainerId
        );

        setShowTrainerSelector(false);
      }
    } catch (error) {
      console.error(
        '[Profile] Failed to save trainer:',
        error
      );
    }
  }


  /*
   * ======================================
   * LOGOUT
   * ======================================
   */

  const handleLogout = async () => {
    await logout();

    router.replace('/profile/create');
  };


  /*
   * ======================================
   * CURRENT PROFILE DATA
   * ======================================
   */

  const trainerName =
    profileDetails?.displayName ??
    'NOT SET';

  const height =
    profileDetails?.heightCm != null
      ? `${profileDetails.heightCm} CM`
      : '--';

  const weight =
    profileDetails?.weightKg != null
      ? `${profileDetails.weightKg} KG`
      : '--';

  const goal =
    profileDetails?.fitnessGoal ??
    'NOT SET';

  const activityLevel =
    profileDetails?.activityLevel ??
    'NOT SET';


  /*
   * ======================================
   * REAL XP / PROGRESSION DATA
   * ======================================
   */

  const totalXP =
    progression?.totalXP ?? 0;

  const currentStreak =
    progression?.currentStreak ?? 0;

  const longestStreak =
    progression?.longestStreak ?? 0;


  /*
   * ======================================
   * XP CALCULATION
   * ======================================
   */

  const xpProgress =
    getXPProgress(totalXP);

  const trainerLevel =
    xpProgress.currentLevel;

  const currentXP =
    xpProgress.xpIntoLevel;

  const totalXPRequired =
    xpProgress.xpForNextLevel;

  const totalXPProgress =
    Math.min(
      totalXP /
        Math.max(
          totalXPRequired,
          1
        ),
      1
    );


  /*
   * ======================================
   * POKÉDEX
   * ======================================
   */

  const pokedexTotal =
    pokemonSpecies.length;


  /*
   * ======================================
   * RENDER
   * ======================================
   */

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* ====================================
            OUTER CARD
            ==================================== */}

        <View style={styles.card}>

          <View style={styles.cardInner}>

            {/* ==================================
                HEADER
                ================================== */}

            <View style={styles.header}>

              <View style={styles.headerLeft}>

                <PokeBall />

                <Text style={styles.title}>
                  GYMATE{'\n'}TRAINER CARD
                </Text>

              </View>

              <View style={styles.headerRight}>

                <Text style={styles.sparkle}>
                  ✦
                </Text>

                <Text
                  style={styles.headerTagline}
                >
                  TRAIN. EAT. GROW.
                </Text>

              </View>

            </View>


            {/* ==================================
                TRAINER
                ================================== */}

            <View style={styles.trainerSection}>

              <View style={styles.trainerPhotoContainer}>

                {selectedTrainer ? (
                  <Image
                    source={
                      selectedTrainer.source
                    }
                    style={styles.trainerImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View
                    style={
                      styles.trainerPlaceholder
                    }
                  >
                    <Text
                      style={
                        styles.trainerPlaceholderText
                      }
                    >
                      TRAINER
                    </Text>
                  </View>
                )}

              </View>

              <View style={styles.trainerInfo}>

                <Text
                  style={styles.trainerLabel}
                >
                  TRAINER
                </Text>

                <Text
                  style={styles.trainerName}
                  numberOfLines={1}
                >
                  {trainerName}
                </Text>

                <Pressable
                  onPress={() =>
                    setShowTrainerSelector(true)
                  }
                  style={({ pressed }) => [
                    styles.trainerButton,
                    pressed &&
                      styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={
                      styles.trainerButtonText
                    }
                  >
                    CHANGE TRAINER
                  </Text>
                </Pressable>

              </View>

            </View>


            {/* ==================================
                PROFILE INFO
                ================================== */}

            <View style={styles.infoSection}>

              <InfoRow
                icon="↕"
                label="HEIGHT"
              >
                <Text
                  style={styles.infoValue}
                >
                  {height}
                </Text>
              </InfoRow>

              <InfoRow
                icon="⚖"
                label="WEIGHT"
              >
                <Text
                  style={styles.infoValue}
                >
                  {weight}
                </Text>
              </InfoRow>

              <InfoRow
                icon="◎"
                label="GOAL"
              >
                <Text
                  style={styles.infoValue}
                  numberOfLines={1}
                >
                  {goal}
                </Text>
              </InfoRow>

              <InfoRow
                icon="★"
                label="STREAK"
              >
                <Text
                  style={styles.infoValue}
                >
                  {currentStreak} DAYS
                </Text>
              </InfoRow>

            </View>


            {/* ==================================
                XP
                ================================== */}

            <View style={styles.xpSection}>

              <View style={styles.xpHeader}>

                <Text
                  style={styles.xpTitle}
                >
                  TRAINER XP
                </Text>

                <Text
                  style={styles.xpLevelTop}
                >
                  LVL {loadingProgression
                    ? '--'
                    : trainerLevel}
                </Text>

              </View>

              <View style={styles.xpBody}>

                <Text
                  style={styles.xpNumber}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.65}
                >
                  {loadingProgression
                    ? '--'
                    : totalXP.toLocaleString()}

                  <Text style={styles.xpOf}>
                    {' / '}
                    {loadingProgression
                      ? '--'
                      : totalXPRequired.toLocaleString()}
                  </Text>
                </Text>

                <View
                  style={styles.barTrack}
                >
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${
                          totalXPProgress * 100
                        }%`,
                      },
                    ]}
                  />
                </View>

                <Text
                  style={styles.xpLevel}
                >
                  Level {loadingProgression
                    ? '--'
                    : trainerLevel}
                </Text>

              </View>

            </View>


            {/* ==================================
                POKÉDEX + BADGES
                ================================== */}

            <View style={styles.footer}>

              {/* POKÉDEX */}

              <View
                style={styles.footerTitle}
              >

                <PokeBall small />

                <View>
                  <Text
                    style={styles.pokedexTitle}
                  >
                    POKÉDEX
                  </Text>

                  <Text
                    style={styles.pokedexSub}
                  >
                    {loadingPokedex
                      ? '--'
                      : pokedexCount}{' '}
                    / {pokedexTotal}
                  </Text>
                </View>

              </View>


              {/* ==================================
                  GYM BADGES HEADER
                  ================================== */}

              <View
                style={styles.gymBadgesHeader}
              >

                <View>
                  <Text
                    style={styles.gymBadgesTitle}
                  >
                    GYM BADGES
                  </Text>

                  <Text
                    style={styles.gymBadgesSub}
                  >
                    8 ELITE ACHIEVEMENTS
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    router.push(
                      '/pokemon/gym-badges'
                    )
                  }
                  style={({ pressed }) => [
                    styles.viewBadgesButton,
                    pressed &&
                      styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={styles.viewBadgesText}
                  >
                    VIEW ALL
                  </Text>
                </Pressable>

              </View>


              {/* ==================================
                  GYM BADGES GRID
                  ================================== */}

              <Pressable
                onPress={() =>
                  router.push(
                    '/pokemon/gym-badges'
                  )
                }
                style={({ pressed }) => [
                  styles.badgeGridPressable,
                  pressed &&
                    styles.badgeGridPressed,
                ]}
              >

                <View style={styles.badgeGrid}>

                  {loadingBadges ? (

                    Array.from({
                      length: 8,
                    }).map((_, index) => (

                      <View
                        key={index}
                        style={styles.badgeSlot}
                      >
                        <View
                          style={
                            styles.badgeLoading
                          }
                        />
                      </View>

                    ))

                  ) : (

                    profileBadges
                      .slice(0, 8)
                      .map((item) => (

                        <View
                          key={
                            item.badge.familyId
                          }
                          style={[
                            styles.badgeSlot,

                            item.earned &&
                              styles.badgeSlotEarned,

                            item.displayVariant ===
                              'gold' &&
                              styles.badgeSlotGold,
                          ]}
                        >

                          <GymBadgeIcon
                            normalAssetId={
                              item.badge.variant ===
                              'normal'
                                ? item.badge.assetId
                                : item.badge.assetId.replace(
                                    '_gold',
                                    ''
                                  )
                            }

                            goldAssetId={
                              item.badge.variant ===
                              'gold'
                                ? item.badge.assetId
                                : `${item.badge.assetId}_gold`
                            }

                            state={
                              item.displayVariant
                            }

                            size={64}
                          />

                        </View>

                      ))

                  )}

                </View>

              </Pressable>

            </View>

          </View>

        </View>


        {/* ====================================
            TRAINING LEVEL
            ==================================== */}

        <View style={styles.extraSection}>

          <Text
            style={styles.extraTitle}
          >
            TRAINING LEVEL
          </Text>

          <Text
            style={styles.extraValue}
          >
            {activityLevel}
          </Text>

        </View>


        {/* ====================================
            PROGRESSION
            ==================================== */}

        <View style={styles.progressionSection}>

          <Text
            style={styles.progressionTitle}
          >
            GYMATE PROGRESSION
          </Text>

          <View
            style={styles.progressionRow}
          >

            <Text
              style={styles.progressionLabel}
            >
              TOTAL XP
            </Text>

            <Text
              style={styles.progressionValue}
            >
              {totalXP}
            </Text>

          </View>

          <View
            style={styles.progressionRow}
          >

            <Text
              style={styles.progressionLabel}
            >
              TRAINER LEVEL
            </Text>

            <Text
              style={styles.progressionValue}
            >
              {trainerLevel}
            </Text>

          </View>

          <View
            style={styles.progressionRow}
          >

            <Text
              style={styles.progressionLabel}
            >
              XP THIS LEVEL
            </Text>

            <Text
              style={styles.progressionValue}
            >
              {currentXP} / 500
            </Text>

          </View>

          <View
            style={styles.progressionRow}
          >

            <Text
              style={styles.progressionLabel}
            >
              CURRENT STREAK
            </Text>

            <Text
              style={styles.progressionValue}
            >
              {currentStreak} DAYS
            </Text>

          </View>

          <View
            style={[
              styles.progressionRow,
              styles.progressionRowLast,
            ]}
          >

            <Text
              style={styles.progressionLabel}
            >
              LONGEST STREAK
            </Text>

            <Text
              style={styles.progressionValue}
            >
              {longestStreak} DAYS
            </Text>

          </View>

        </View>


        {/* ====================================
            EDIT PROFILE
            ==================================== */}

        <Pressable
          onPress={() =>
            router.push('/profile/setup')
          }
          style={({ pressed }) => [
            styles.button,
            pressed &&
              styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>
            EDIT PROFILE
          </Text>
        </Pressable>


        {/* ====================================
            AUDIO SETTINGS
            ==================================== */}

        <View style={styles.audioSection}>

          <Text
            style={styles.sectionTitle}
          >
            AUDIO
          </Text>


          {/* SOUND EFFECTS */}

          <View style={styles.audioCard}>

            <View style={styles.audioHeader}>

              <View
                style={styles.audioHeaderText}
              >

                <Text
                  style={styles.audioTitle}
                >
                  SOUND EFFECTS
                </Text>

                <Text
                  style={styles.audioSubtitle}
                >
                  Pokémon cries and game sounds
                </Text>

              </View>

              <Pressable
                onPress={() =>
                  setSoundEnabled(
                    !soundEnabled
                  )
                }
                style={[
                  styles.audioToggle,
                  soundEnabled &&
                    styles.audioToggleActive,
                ]}
              >

                <Text
                  style={[
                    styles.audioToggleText,
                    soundEnabled &&
                      styles.audioToggleTextActive,
                  ]}
                >
                  {soundEnabled
                    ? 'ON'
                    : 'OFF'}
                </Text>

              </Pressable>

            </View>


            {soundEnabled && (
              <View
                style={styles.volumeContainer}
              >

                <View
                  style={styles.volumeHeader}
                >

                  <Text
                    style={styles.volumeLabel}
                  >
                    VOLUME
                  </Text>

                  <Text
                    style={styles.volumeValue}
                  >
                    {Math.round(
                      soundVolume * 100
                    )}
                    %
                  </Text>

                </View>

                <View
                  style={styles.volumeTrack}
                >

                  <View
                    style={[
                      styles.volumeFill,
                      {
                        width: `${
                          soundVolume * 100
                        }%`,
                      },
                    ]}
                  />

                </View>

                <View
                  style={styles.volumeButtons}
                >

                  <Pressable
                    onPress={() =>
                      setSoundVolume(
                        Math.max(
                          0,
                          soundVolume - 0.1
                        )
                      )
                    }
                    style={styles.volumeButton}
                  >
                    <Text
                      style={
                        styles.volumeButtonText
                      }
                    >
                      −
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      setSoundVolume(
                        Math.min(
                          1,
                          soundVolume + 0.1
                        )
                      )
                    }
                    style={styles.volumeButton}
                  >
                    <Text
                      style={
                        styles.volumeButtonText
                      }
                    >
                      +
                    </Text>
                  </Pressable>

                </View>

              </View>
            )}

          </View>


          {/* MUSIC */}

          <View style={styles.audioCard}>

            <View style={styles.audioHeader}>

              <View
                style={styles.audioHeaderText}
              >

                <Text
                  style={styles.audioTitle}
                >
                  MUSIC
                </Text>

                <Text
                  style={styles.audioSubtitle}
                >
                  Pokémon background music
                </Text>

              </View>

              <Pressable
                onPress={() =>
                  setMusicEnabled(
                    !musicEnabled
                  )
                }
                style={[
                  styles.audioToggle,
                  musicEnabled &&
                    styles.audioToggleActive,
                ]}
              >

                <Text
                  style={[
                    styles.audioToggleText,
                    musicEnabled &&
                      styles.audioToggleTextActive,
                  ]}
                >
                  {musicEnabled
                    ? 'ON'
                    : 'OFF'}
                </Text>

              </Pressable>

            </View>


            <View
              style={styles.volumeContainer}
            >

              <View
                style={styles.volumeHeader}
              >

                <Text
                  style={styles.volumeLabel}
                >
                  VOLUME
                </Text>

                <Text
                  style={styles.volumeValue}
                >
                  {Math.round(
                    musicVolume * 100
                  )}
                  %
                </Text>

              </View>

              <View
                style={styles.volumeTrack}
              >

                <View
                  style={[
                    styles.volumeFill,
                    {
                      width: `${
                        musicVolume * 100
                      }%`,
                    },
                  ]}
                />

              </View>

              <View
                style={styles.volumeButtons}
              >

                <Pressable
                  onPress={() =>
                    setMusicVolume(
                      Math.max(
                        0,
                        musicVolume - 0.1
                      )
                    )
                  }
                  style={styles.volumeButton}
                >
                  <Text
                    style={
                      styles.volumeButtonText
                    }
                  >
                    −
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    setMusicVolume(
                      Math.min(
                        1,
                        musicVolume + 0.1
                      )
                    )
                  }
                  style={styles.volumeButton}
                >
                  <Text
                    style={
                      styles.volumeButtonText
                    }
                  >
                    +
                  </Text>
                </Pressable>

              </View>

            </View>

          </View>

        </View>


        {/* ====================================
            LOG OUT
            ==================================== */}

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed &&
              styles.buttonPressed,
          ]}
        >
          <Text style={styles.logoutText}>
            LOG OUT
          </Text>
        </Pressable>

            <Pressable
  onPress={() =>
    router.push('/profile/data-transfer')
  }
  style={({ pressed }) => [
    styles.button,
    pressed &&
      styles.buttonPressed,
  ]}
>
  <Text style={styles.buttonText}>
    DATA TRANSFER
  </Text>
</Pressable>
        

      </ScrollView>


      {/* ====================================
          TRAINER SELECTOR MODAL
          ==================================== */}

      <Modal
        visible={showTrainerSelector}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowTrainerSelector(false)
        }
      >

        <View
          style={
            styles.trainerModalOverlay
          }
        >

          <TrainerSelector
            selectedTrainerId={
              selectedTrainerId
            }
            onSelect={
              handleTrainerSelect
            }
            onCancel={() =>
              setShowTrainerSelector(false)
            }
          />

        </View>

      </Modal>
    </>
  );
}


/*
 * ========================================
 * STYLES
 * ========================================
 */

const styles = StyleSheet.create({

  /*
   * ======================================
   * CONTAINER
   * ======================================
   */

  container: {
    flex: 1,
    backgroundColor:
      colors.background,
  },

  content: {
    paddingHorizontal:
      spacing.sm,
    paddingTop:
      spacing.xl,
    paddingBottom: 140,
  },


  /*
   * ======================================
   * CARD
   * ======================================
   */

  card: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    backgroundColor:
      colors.background,
    padding: 4,
    borderWidth: 2,
    borderColor:
      colors.text,
  },

  cardInner: {
    borderWidth: 2,
    borderColor:
      colors.text,
    padding:
      spacing.sm,
    backgroundColor:
      colors.background,
    minWidth: 0,
  },


  /*
   * ======================================
   * HEADER
   * ======================================
   */

  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent:
      'space-between',
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor:
      colors.border,
    padding:
      spacing.sm,
    marginBottom:
      spacing.sm,
    rowGap:
      spacing.xs,
    columnGap:
      spacing.sm,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
    gap:
      spacing.xs,
  },

  title: {
    fontFamily:
      'PressStart2P',
    fontSize: 11,
    lineHeight: 16,
    color:
      colors.text,
    flexShrink: 1,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: 4,
  },

  headerTagline: {
    fontFamily:
      'VT323',
    fontSize: 13,
    lineHeight: 14,
    color:
      colors.textSecondary,
    textAlign: 'center',
  },

  sparkle: {
    fontSize: 11,
    color:
      colors.textSecondary,
  },


  /*
   * ======================================
   * POKÉBALL
   * ======================================
   */

  pokeBall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor:
      colors.text,
    position: 'relative',
    backgroundColor:
      colors.background,
  },

  pokeBallSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },

  pokeBallTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor:
      colors.primary,
  },

  pokeBallTopSmall: {
    height: '50%',
  },

  pokeBallLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 2,
    backgroundColor:
      colors.text,
  },

  pokeBallLineSmall: {
    height: 2,
  },

  pokeBallButton: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor:
      colors.text,
    left: '50%',
    top: '50%',
    marginLeft: -6,
    marginTop: -6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pokeBallButtonSmall: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: -5,
    marginTop: -5,
  },

  pokeBallButtonInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor:
      colors.background,
  },

  pokeBallButtonInnerSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },


  /*
   * ======================================
   * TRAINER
   * ======================================
   */

  trainerSection: {
    flexDirection: 'row',
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor:
      colors.border,
    marginBottom:
      spacing.sm,
    minHeight: 170,
  },

  trainerPhotoContainer: {
    width: '42%',
    minHeight: 170,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      colors.background,
    borderRightWidth: 1,
    borderRightColor:
      colors.border,
    overflow: 'hidden',
  },

  trainerImage: {
    width: '100%',
    height: 150,
  },

  trainerPlaceholder: {
    width: 110,
    height: 140,
    borderWidth: 2,
    borderColor:
      colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  trainerPlaceholderText: {
    fontFamily:
      'PressStart2P',
    fontSize: 7,
    color:
      colors.textMuted,
  },

  trainerInfo: {
    flex: 1,
    padding:
      spacing.sm,
    justifyContent:
      'center',
  },

  trainerLabel: {
    fontFamily:
      'PressStart2P',
    fontSize: 7,
    color:
      colors.textMuted,
    marginBottom:
      spacing.xs,
  },

  trainerName: {
    fontFamily:
      'PressStart2P',
    fontSize: 11,
    lineHeight: 17,
    color:
      colors.text,
    marginBottom:
      spacing.md,
  },

  trainerButton: {
    borderWidth: 1,
    borderColor:
      colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  trainerButtonText: {
    fontFamily:
      'PressStart2P',
    fontSize: 6,
    color:
      colors.primary,
  },


  /*
   * ======================================
   * INFO
   * ======================================
   */

  infoSection: {
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor:
      colors.border,
    padding:
      spacing.sm,
    marginBottom:
      spacing.sm,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 38,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },

  icon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },

  iconText: {
    fontFamily:
      'VT323',
    fontSize: 18,
    color:
      colors.primary,
  },

  infoLabel: {
    fontFamily:
      'PressStart2P',
    fontSize: 6,
    color:
      colors.textMuted,
    width: 76,
  },

  infoValueContainer: {
    flex: 1,
    alignItems: 'flex-end',
    minWidth: 0,
  },

  infoValue: {
    fontFamily:
      'VT323',
    fontSize: 17,
    color:
      colors.text,
    textAlign: 'right',
  },


  /*
   * ======================================
   * XP
   * ======================================
   */

  xpSection: {
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor:
      colors.border,
    marginBottom:
      spacing.sm,
  },

  xpHeader: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    padding:
      spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },

  xpTitle: {
    fontFamily:
      'PressStart2P',
    fontSize: 7,
    color:
      colors.text,
  },

  xpLevelTop: {
    fontFamily:
      'PressStart2P',
    fontSize: 7,
    color:
      colors.primary,
  },

  xpBody: {
    padding:
      spacing.sm,
  },

  xpNumber: {
    fontFamily:
      'VT323',
    fontSize: 22,
    color:
      colors.text,
    marginBottom:
      spacing.xs,
  },

  xpOf: {
    fontFamily:
      'VT323',
    fontSize: 15,
    color:
      colors.textMuted,
  },

  barTrack: {
    width: '100%',
    height: 9,
    backgroundColor:
      colors.background,
    borderWidth: 1,
    borderColor:
      colors.border,
    overflow: 'hidden',
  },

  barFill: {
    height: '100%',
    backgroundColor:
      colors.primary,
  },

  xpLevel: {
    fontFamily:
      'VT323',
    fontSize: 14,
    color:
      colors.textMuted,
    marginTop: 4,
  },


  /*
   * ======================================
   * FOOTER
   * ======================================
   */

  footer: {
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor:
      colors.border,
    padding:
      spacing.sm,
  },

  footerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 76,
    flexShrink: 0,
    marginBottom:
      spacing.sm,
  },

  pokedexTitle: {
    fontFamily:
      'VT323',
    fontSize: 14,
    lineHeight: 16,
    color:
      colors.text,
  },

  pokedexSub: {
    fontFamily:
      'VT323',
    fontSize: 12,
    lineHeight: 14,
    color:
      colors.textMuted,
    marginTop: 1,
  },


  /*
   * ======================================
   * GYM BADGES HEADER
   * ======================================
   */

  gymBadgesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    paddingBottom:
      spacing.xs,
    marginBottom:
      spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },

  gymBadgesTitle: {
    fontFamily:
      'PressStart2P',
    fontSize: 9,
    color:
      colors.text,
  },

  gymBadgesSub: {
    fontFamily:
      'VT323',
    fontSize: 13,
    color:
      colors.textMuted,
    marginTop: 2,
  },

  viewBadgesButton: {
    borderWidth: 1,
    borderColor:
      colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  viewBadgesText: {
    fontFamily:
      'PressStart2P',
    fontSize: 6,
    color:
      colors.primary,
  },


  /*
   * ======================================
   * BADGES
   * ======================================
   */

  badgeGridPressable: {
    width: '100%',
  },

  badgeGridPressed: {
    opacity: 0.7,
  },

  badgeGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  badgeSlot: {
    width: '23%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor:
      colors.border,
    backgroundColor:
      colors.background,
    justifyContent:
      'center',
    alignItems:
      'center',
    overflow: 'hidden',
  },

  badgeSlotEarned: {
    borderColor:
      colors.text,
  },

  badgeSlotGold: {
    borderColor:
      colors.primary,
    borderWidth: 2,
  },

  badgeLoading: {
    width: '60%',
    height: '60%',
    backgroundColor:
      colors.border,
    opacity: 0.35,
  },


  /*
   * ======================================
   * EXTRA PROFILE
   * ======================================
   */

  extraSection: {
    backgroundColor:
      colors.surface,
    borderWidth: 2,
    borderColor:
      colors.border,
    padding:
      spacing.md,
    marginTop:
      spacing.lg,
    marginBottom:
      spacing.md,
  },

  extraTitle: {
    fontFamily:
      'PressStart2P',
    fontSize: 8,
    color:
      colors.primary,
    marginBottom:
      spacing.xs,
  },

  extraValue: {
    fontFamily:
      'VT323',
    fontSize: 18,
    color:
      colors.text,
  },


  /*
   * ======================================
   * PROGRESSION
   * ======================================
   */

  progressionSection: {
    backgroundColor:
      colors.surface,
    borderWidth: 2,
    borderColor:
      colors.border,
    padding:
      spacing.md,
    marginBottom:
      spacing.md,
  },

  progressionTitle: {
    fontFamily:
      'PressStart2P',
    fontSize: 8,
    color:
      colors.primary,
    marginBottom:
      spacing.sm,
  },

  progressionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    paddingVertical:
      spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },

  progressionRowLast: {
    borderBottomWidth: 0,
  },

  progressionLabel: {
    fontFamily:
      'VT323',
    fontSize: 14,
    color:
      colors.textMuted,
  },

  progressionValue: {
    fontFamily:
      'VT323',
    fontSize: 16,
    fontWeight: '700',
    color:
      colors.text,
  },


  /*
   * ======================================
   * BUTTONS
   * ======================================
   */

  button: {
    minHeight: 52,
    backgroundColor:
      colors.primary,
    borderWidth: 2,
    borderColor:
      colors.primary,
    alignItems:
      'center',
    justifyContent:
      'center',
    marginBottom:
      spacing.md,
  },

  buttonText: {
    fontFamily:
      'PressStart2P',
    fontSize: 9,
    color:
      colors.background,
  },

  logoutButton: {
    minHeight: 48,
    borderWidth: 2,
    borderColor:
      colors.border,
    alignItems:
      'center',
    justifyContent:
      'center',
  },

  logoutText: {
    fontFamily:
      'PressStart2P',
    fontSize: 9,
    color:
      colors.textSecondary,
  },

  buttonPressed: {
    opacity: 0.65,
    transform: [
      {
        translateY: 2,
      },
    ],
  },


  /*
   * ======================================
   * AUDIO
   * ======================================
   */

  audioSection: {
    marginTop: 24,
  },

  sectionTitle: {
    fontFamily:
      'PressStart2P',
    fontSize: 11,
    color:
      '#B8FF00',
    marginBottom: 12,
  },

  audioCard: {
    borderWidth: 1,
    borderColor:
      '#333',
    backgroundColor:
      '#111',
    padding: 14,
    marginBottom: 10,
  },

  audioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  audioHeaderText: {
    flex: 1,
    paddingRight: 12,
  },

  audioTitle: {
    fontFamily:
      'PressStart2P',
    fontSize: 9,
    color:
      '#FFFFFF',
  },

  audioSubtitle: {
    fontFamily:
      'PressStart2P',
    fontSize: 6,
    color:
      '#777',
    marginTop: 8,
  },

  audioToggle: {
    borderWidth: 1,
    borderColor:
      '#555555',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },

  audioToggleActive: {
    borderColor:
      '#B8FF00',
    backgroundColor:
      '#151D00',
  },

  audioToggleText: {
    fontFamily:
      'PressStart2P',
    fontSize: 7,
    color:
      '#666666',
  },

  audioToggleTextActive: {
    color:
      '#B8FF00',
  },

  volumeContainer: {
    marginTop: 18,
  },

  volumeHeader: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  volumeLabel: {
    fontFamily:
      'PressStart2P',
    fontSize: 7,
    color:
      '#777',
  },

  volumeValue: {
    fontFamily:
      'PressStart2P',
    fontSize: 7,
    color:
      '#B8FF00',
  },

  volumeTrack: {
    height: 8,
    backgroundColor:
      '#292929',
    borderWidth: 1,
    borderColor:
      '#444',
    overflow: 'hidden',
  },

  volumeFill: {
    height: '100%',
    backgroundColor:
      '#B8FF00',
  },

  volumeButtons: {
    flexDirection: 'row',
    justifyContent:
      'flex-end',
    gap: 8,
    marginTop: 10,
  },

  volumeButton: {
    width: 32,
    height: 28,
    borderWidth: 1,
    borderColor:
      '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },

  volumeButtonText: {
    fontFamily:
      'PressStart2P',
    fontSize: 10,
    color:
      '#B8FF00',
  },


  /*
   * ======================================
   * TRAINER MODAL
   * ======================================
   */

  trainerModalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding:
      spacing.md,
  },

});