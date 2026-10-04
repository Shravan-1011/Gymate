import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAudioPlayer } from 'expo-audio';

import PokemonSprite from './PokemonSprite';
import PokemonCry from './PokemonCry';

import { pokemonSpecies } from '../../data/pokemonSpecies';

import type {
  PokemonEvolutionEvent,
} from '../../services/pokemonEvolutionEventService';

import {
  colors,
  spacing,
} from '../../constants/theme';

import PixelButton from '../PixelButton';

import {
  useSoundSettings,
} from '../../context/SoundContext';


// ============================================================
// EVOLUTION AUDIO
// ============================================================

const EVOLUTION_START_SOUND =
  require('../../assets/audio/pokemon/evolution-start.ogg');

const EVOLUTION_BGM =
  require('../../assets/audio/pokemon/evolution.ogg');

const EVOLUTION_SUCCESS_SOUND =
  require('../../assets/audio/pokemon/evolution-success.ogg');


// ============================================================
// TYPES
// ============================================================

type PokemonEvolutionOverlayProps = {
  event: PokemonEvolutionEvent | null;
  onComplete: () => void;
};

type AnimationPhase =
  | 'evolving'
  | 'revealing';


// ============================================================
// COMPONENT
// ============================================================

export default function PokemonEvolutionOverlay({
  event,
  onComplete,
}: PokemonEvolutionOverlayProps) {

  // ----------------------------------------------------------
  // Animation state
  // ----------------------------------------------------------

  const [phase, setPhase] =
    useState<AnimationPhase>('evolving');

  const [flash, setFlash] =
    useState(false);

  const [showCry, setShowCry] =
    useState(false);


  // ----------------------------------------------------------
  // Animation refs
  // ----------------------------------------------------------

  const opacity =
    useRef(
      new Animated.Value(1)
    ).current;

  const scale =
    useRef(
      new Animated.Value(1)
    ).current;

  const shake =
    useRef(
      new Animated.Value(0)
    ).current;

  const particleOpacity =
    useRef(
      new Animated.Value(0)
    ).current;


  // ----------------------------------------------------------
  // Timer refs
  // ----------------------------------------------------------

  const revealTimer =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const cryTimer =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );


  // ----------------------------------------------------------
  // Sound settings
  // ----------------------------------------------------------

  const {
    soundEnabled,
    soundVolume,
  } = useSoundSettings();


  // Keep the latest sound settings available to the
  // evolution animation without restarting the animation
  // whenever the user changes the volume/toggle.

  const soundEnabledRef =
    useRef(soundEnabled);

  const soundVolumeRef =
    useRef(soundVolume);


  useEffect(() => {
    soundEnabledRef.current =
      soundEnabled;

    soundVolumeRef.current =
      soundVolume;
  }, [
    soundEnabled,
    soundVolume,
  ]);


  // ----------------------------------------------------------
  // Audio players
  // ----------------------------------------------------------

  const evolutionStartPlayer =
    useAudioPlayer(
      EVOLUTION_START_SOUND
    );

  const evolutionBgmPlayer =
    useAudioPlayer(
      EVOLUTION_BGM
    );

  const evolutionSuccessPlayer =
    useAudioPlayer(
      EVOLUTION_SUCCESS_SOUND
    );


  // ==========================================================
  // KEEP AUDIO VOLUME IN SYNC WITH GLOBAL SOUND SETTINGS
  // ==========================================================

  useEffect(() => {

    const volume =
      soundEnabled
        ? soundVolume
        : 0;

    evolutionStartPlayer.volume =
      volume;

    evolutionBgmPlayer.volume =
      volume;

    evolutionSuccessPlayer.volume =
      volume;

  }, [
    soundEnabled,
    soundVolume,
    evolutionStartPlayer,
    evolutionBgmPlayer,
    evolutionSuccessPlayer,
  ]);


  // ==========================================================
  // EVOLUTION ANIMATION
  // ==========================================================

  useEffect(() => {

    if (!event) {
      return;
    }


    // --------------------------------------------------------
    // Reset state
    // --------------------------------------------------------

    setPhase('evolving');
    setFlash(false);
    setShowCry(false);


    // --------------------------------------------------------
    // Clear any previous timers
    // --------------------------------------------------------

    if (revealTimer.current) {
      clearTimeout(
        revealTimer.current
      );

      revealTimer.current = null;
    }

    if (cryTimer.current) {
      clearTimeout(
        cryTimer.current
      );

      cryTimer.current = null;
    }


    // --------------------------------------------------------
    // Reset animations
    // --------------------------------------------------------

    opacity.setValue(1);
    scale.setValue(1);
    shake.setValue(0);
    particleOpacity.setValue(0);


    // --------------------------------------------------------
    // Stop any audio from a previous evolution
    // --------------------------------------------------------

    evolutionStartPlayer.pause();
    evolutionBgmPlayer.pause();
    evolutionSuccessPlayer.pause();


    // ========================================================
    // START EVOLUTION AUDIO
    // ========================================================

    if (
      soundEnabledRef.current &&
      soundVolumeRef.current > 0
    ) {

      const volume =
        soundVolumeRef.current;


      // ------------------------------------------------------
      // Evolution start sound
      // ------------------------------------------------------

      evolutionStartPlayer.volume =
        volume;

      evolutionStartPlayer.seekTo(0);
      evolutionStartPlayer.play();


      // ------------------------------------------------------
      // Evolution BGM
      // ------------------------------------------------------

      evolutionBgmPlayer.volume =
        volume;

      evolutionBgmPlayer.loop = true;

      evolutionBgmPlayer.seekTo(0);
      evolutionBgmPlayer.play();
    }


    // ========================================================
    // PARTICLE ANIMATION
    // ========================================================

    const particleAnimation =
      Animated.sequence([
        Animated.timing(
          particleOpacity,
          {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }
        ),

        Animated.timing(
          particleOpacity,
          {
            toValue: 0.35,
            duration: 700,
            useNativeDriver: true,
          }
        ),
      ]);


    // ========================================================
    // SHAKE ANIMATION
    // ========================================================

    const shakeAnimation =
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            shake,
            {
              toValue: -5,
              duration: 70,
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            shake,
            {
              toValue: 5,
              duration: 70,
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            shake,
            {
              toValue: -4,
              duration: 60,
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            shake,
            {
              toValue: 4,
              duration: 60,
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            shake,
            {
              toValue: 0,
              duration: 60,
              useNativeDriver: true,
            }
          ),
        ])
      );


    particleAnimation.start();
    shakeAnimation.start();


    // ========================================================
    // EVOLUTION TRANSITION
    // ========================================================

    const evolveTimer =
      setTimeout(() => {

        shakeAnimation.stop();


        // ----------------------------------------------------
        // Fade out old Pokémon
        // ----------------------------------------------------

        Animated.parallel([

          Animated.timing(
            opacity,
            {
              toValue: 0,
              duration: 450,
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            scale,
            {
              toValue: 0.75,
              duration: 450,
              useNativeDriver: true,
            }
          ),

        ]).start(() => {

          // --------------------------------------------------
          // Stop evolution BGM
          // --------------------------------------------------

          evolutionBgmPlayer.pause();


          // --------------------------------------------------
          // Flash
          // --------------------------------------------------

          setFlash(true);


          // --------------------------------------------------
          // Reveal new Pokémon
          // --------------------------------------------------

          revealTimer.current =
            setTimeout(() => {

              setFlash(false);
              setPhase('revealing');

              opacity.setValue(0);
              scale.setValue(0.75);


              // ----------------------------------------------
              // Evolution success sound
              // ----------------------------------------------

              if (
                soundEnabledRef.current &&
                soundVolumeRef.current > 0
              ) {

                evolutionSuccessPlayer.volume =
                  soundVolumeRef.current;

                evolutionSuccessPlayer.seekTo(0);
                evolutionSuccessPlayer.play();
              }


              // ----------------------------------------------
              // Reveal animation
              // ----------------------------------------------

              Animated.parallel([

                Animated.timing(
                  opacity,
                  {
                    toValue: 1,
                    duration: 650,
                    useNativeDriver: true,
                  }
                ),

                Animated.spring(
                  scale,
                  {
                    toValue: 1,
                    friction: 7,
                    tension: 55,
                    useNativeDriver: true,
                  }
                ),

              ]).start();


              // ----------------------------------------------
              // Pokémon cry
              // ----------------------------------------------

              cryTimer.current =
                setTimeout(() => {

                  setShowCry(true);

                  cryTimer.current = null;

                }, 700);

            }, 180);

        });

      }, 1800);


    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {

      clearTimeout(
        evolveTimer
      );

      if (revealTimer.current) {
        clearTimeout(
          revealTimer.current
        );

        revealTimer.current = null;
      }

      if (cryTimer.current) {
        clearTimeout(
          cryTimer.current
        );

        cryTimer.current = null;
      }

      shakeAnimation.stop();
      particleAnimation.stop();

      evolutionStartPlayer.pause();
      evolutionBgmPlayer.pause();
      evolutionSuccessPlayer.pause();

    };

  }, [
    event,
    opacity,
    scale,
    shake,
    particleOpacity,
    evolutionStartPlayer,
    evolutionBgmPlayer,
    evolutionSuccessPlayer,
  ]);


  // ==========================================================
  // NO EVENT
  // ==========================================================

  if (!event) {
    return null;
  }


  // ==========================================================
  // SPECIES
  // ==========================================================

  const fromSpecies =
    pokemonSpecies.find(
      (species) =>
        species.id ===
        event.fromSpeciesId
    );


  const toSpecies =
    pokemonSpecies.find(
      (species) =>
        species.id ===
        event.toSpeciesId
    );


  if (!fromSpecies || !toSpecies) {
    return null;
  }


  // ==========================================================
  // PHASE
  // ==========================================================

  const isEvolving =
    phase === 'evolving';


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <View
      style={styles.overlay}
      pointerEvents="auto"
    >

      {/* ====================================================
          FLASH
      ==================================================== */}

      {flash && (
        <View
          style={styles.flash}
          pointerEvents="none"
        />
      )}


      {/* ====================================================
          CONTENT
      ==================================================== */}

      <View
        style={styles.content}
      >

        {isEvolving ? (

          <>
            {/* ==============================================
                EVOLUTION PHASE
            ============================================== */}

            <Text
              style={styles.topLabel}
            >
              YOUR POKÉMON
            </Text>


            <Text
              style={styles.title}
            >
              IS EVOLVING...
            </Text>


            {/* ----------------------------------------------
                OLD POKÉMON
            ---------------------------------------------- */}

            <Animated.View
              style={[
                styles.spriteContainer,
                {
                  opacity,

                  transform: [
                    {
                      translateX:
                        shake,
                    },
                    {
                      scale,
                    },
                  ],
                },
              ]}
            >

              <PokemonSprite
                spriteAssetId={
                  fromSpecies.spriteAssetId
                }

                iconAssetId={
                  fromSpecies.iconAssetId
                }

                name={
                  fromSpecies.name
                }

                rarity={
                  fromSpecies.rarity
                }

                size="sprite"
              />

            </Animated.View>


            {/* ----------------------------------------------
                PARTICLES
            ---------------------------------------------- */}

            <Animated.View
              style={[
                styles.particles,
                {
                  opacity:
                    particleOpacity,
                },
              ]}
              pointerEvents="none"
            >

              <Text
                style={styles.particle}
              >
                ✦
              </Text>


              <Text
                style={[
                  styles.particle,
                  styles.particleTwo,
                ]}
              >
                ✧
              </Text>


              <Text
                style={[
                  styles.particle,
                  styles.particleThree,
                ]}
              >
                ✦
              </Text>


              <Text
                style={[
                  styles.particle,
                  styles.particleFour,
                ]}
              >
                ✧
              </Text>


              <Text
                style={[
                  styles.particle,
                  styles.particleFive,
                ]}
              >
                ✦
              </Text>

            </Animated.View>


            {/* ----------------------------------------------
                HINT
            ---------------------------------------------- */}

            <Text
              style={styles.hint}
            >
              SOMETHING NEW IS ABOUT TO BEGIN
            </Text>

          </>

        ) : (

          <>
            {/* ==============================================
                REVEAL PHASE
            ============================================== */}

            <Text
              style={styles.evolvedLabel}
            >
              IT EVOLVED!
            </Text>


            {/* ----------------------------------------------
                NEW POKÉMON
            ---------------------------------------------- */}

            <Animated.View
              style={[
                styles.spriteContainer,
                {
                  opacity,

                  transform: [
                    {
                      scale,
                    },
                  ],
                },
              ]}
            >

              <PokemonSprite
                spriteAssetId={
                  toSpecies.spriteAssetId
                }

                iconAssetId={
                  toSpecies.iconAssetId
                }

                name={
                  toSpecies.name
                }

                rarity={
                  toSpecies.rarity
                }

                size="sprite"
              />

            </Animated.View>


            {/* ----------------------------------------------
                NEW NAME
            ---------------------------------------------- */}

            <Text
              style={styles.newName}
            >
              {toSpecies.name.toUpperCase()}
            </Text>


            {/* ----------------------------------------------
                DESCRIPTION
            ---------------------------------------------- */}

            <Text
              style={styles.evolutionText}
            >
              YOUR POKÉMON EVOLVED
              {'\n'}
              INTO A NEW FORM!
            </Text>


            {/* ----------------------------------------------
                POKÉMON CRY
            ---------------------------------------------- */}

            {showCry && (
              <PokemonCry
                cryAssetId={
                  toSpecies.cryAssetId
                }
                autoPlay
                showButton={false}
              />
            )}


            {/* ----------------------------------------------
                CONTINUE
            ---------------------------------------------- */}

            <PixelButton
              title="CONTINUE"
              onPress={onComplete}
              style={
                styles.continueButton
              }
            />

          </>

        )}

      </View>

    </View>
  );
}


// ============================================================
// STYLES
// ============================================================

const styles =
  StyleSheet.create({

    overlay: {
      position: 'absolute',

      top: 0,
      right: 0,
      bottom: 0,
      left: 0,

      backgroundColor:
        colors.background,

      zIndex: 9999,

      elevation: 9999,

      alignItems: 'center',

      justifyContent: 'center',

      paddingHorizontal:
        spacing.xl,
    },


    content: {
      width: '100%',

      alignItems: 'center',

      justifyContent: 'center',
    },


    topLabel: {
      fontFamily:
        'PressStart2P',

      fontSize: 11,

      color:
        colors.textSecondary,

      textAlign: 'center',

      marginBottom:
        spacing.md,
    },


    title: {
      fontFamily:
        'PressStart2P',

      fontSize: 16,

      color:
        colors.primary,

      textAlign: 'center',

      marginBottom:
        spacing.xxl,
    },


    evolvedLabel: {
      fontFamily:
        'PressStart2P',

      fontSize: 20,

      color:
        colors.primary,

      textAlign: 'center',

      marginBottom:
        spacing.xxl,
    },


    spriteContainer: {
      alignItems: 'center',

      justifyContent: 'center',

      minHeight: 110,
    },


    particles: {
      position: 'absolute',

      width: 180,

      height: 180,

      alignItems: 'center',

      justifyContent: 'center',
    },


    particle: {
      position: 'absolute',

      fontFamily:
        'PressStart2P',

      fontSize: 22,

      color:
        colors.primary,

      top: 5,

      left: 85,
    },


    particleTwo: {
      top: 35,

      left: 25,
    },


    particleThree: {
      top: 90,

      left: 20,
    },


    particleFour: {
      top: 125,

      left: 90,
    },


    particleFive: {
      top: 45,

      left: 140,
    },


    hint: {
      fontFamily:
        'VT323',

      fontSize: 18,

      color:
        colors.textSecondary,

      textAlign: 'center',

      marginTop:
        spacing.xxl,
    },


    newName: {
      fontFamily:
        'PressStart2P',

      fontSize: 18,

      color:
        colors.primary,

      textAlign: 'center',

      marginTop:
        spacing.xl,
    },


    evolutionText: {
      fontFamily:
        'VT323',

      fontSize: 20,

      color:
        colors.textSecondary,

      textAlign: 'center',

      lineHeight: 25,

      marginTop:
        spacing.md,

      maxWidth: 280,
    },


    continueButton: {
      minWidth: 180,

      marginTop:
        spacing.xxl,
    },


    flash: {
      position: 'absolute',

      top: 0,
      right: 0,
      bottom: 0,
      left: 0,

      backgroundColor:
        colors.primary,

      zIndex: 10,
    },

  });