import {
  useCallback,
  useEffect,
  useRef,
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

import {
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';

import {
  useProfile,
} from '../../context/ProfileContext';

import {
  useSoundSettings,
} from '../../context/SoundContext';

import {
  useMusic,
} from '../../context/MusicContext';

import PixelCard from '../../components/PixelCard';
import PixelButton from '../../components/PixelButton';
import PokemonSprite from '../../components/pokemon/PokemonSprite';
import PokemonCry from '../../components/pokemon/PokemonCry';
import PokeballOpeningAnimation from '../../components/pokemon/PokeballOpeningAnimation';

import {
  getPokeballIconSource,
} from '../../assets/pokemon/registry';

import {
  colors,
  spacing,
} from '../../constants/theme';

import {
  getShopState,
  buyPokeball,
  openPokeball,
} from '../../services/pokemonService';

import {
  getAllPokeballConfigs,
} from '../../services/pokemonDataService';

import {
  PokeballConfig,
  PokeballType,
  PokemonInventoryItem,
  PokemonSpecies,
} from '../../types/pokemon';

const SHARD_ICON =
  require('../../assets/pokemon/ui/shard.png');


/*
 * ========================================
 * REVEAL STATE
 * ========================================
 */

type RevealState =
  | {
      status: 'idle';
    }
  | {
      status: 'opening';
      ballType: PokeballType;
    }
  | {
      status: 'success';
      species: PokemonSpecies;
    }
  | {
      status: 'failed';
      reason: string;
    };


/*
 * ========================================
 * SHOP SCREEN
 * ========================================
 *
 * Buy balls with Pokéball Shards, then
 * open owned balls to catch Pokémon.
 *
 * Opening flow:
 *
 * OPEN
 *   ↓
 * backend opens ball
 *   ↓
 * pending Pokémon stored
 *   ↓
 * Poké Ball animation
 *   ↓
 * Pkmn get sound
 *   ↓
 * BGM pauses
 *   ↓
 * Pokémon revealed
 *   ↓
 * Pokémon cry
 *   ↓
 * Pkmn get sound finishes
 *   ↓
 * BGM resumes
 *
 * ========================================
 */

export default function PokemonShopScreen() {
  const { profile } =
    useProfile();


  /*
   * ========================================
   * SOUND SETTINGS
   * ========================================
   */

  const {
    soundEnabled,
    soundVolume,
  } = useSoundSettings();


  /*
   * ========================================
   * MUSIC
   * ========================================
   *
   * pauseMusic() returns true if the BGM
   * was actually playing.
   *
   * That lets us restore the exact previous
   * state after Pkmn get.ogg finishes.
   */

  const {
    pauseMusic,
    resumeMusic,
  } = useMusic();


  /*
   * ========================================
   * POKÉMON GET SOUND
   * ========================================
   */

  const pokemonGetSound =
    useAudioPlayer(
      require('../../assets/audio/Pkmn get.ogg')
    );


  /*
   * Track the Pokémon obtain sound.
   *
   * didJustFinish becomes true when
   * Pkmn get.ogg reaches the end.
   */

  const pokemonGetStatus =
    useAudioPlayerStatus(
      pokemonGetSound
    );


  /*
   * Remember whether BGM was playing
   * before the Pokémon obtain sound started.
   *
   * IMPORTANT:
   *
   * false = BGM was already off/paused
   * true  = BGM was playing
   */

  const musicWasPlaying =
    useRef(false);


  /*
   * ========================================
   * RESUME BGM AFTER POKÉMON GET SOUND
   * ========================================
   */

  useEffect(() => {
    if (
      !pokemonGetStatus.didJustFinish
    ) {
      return;
    }


    /*
     * Only resume music if it was
     * actually playing before the
     * Pokémon obtain sound started.
     */

    if (
      musicWasPlaying.current
    ) {
      musicWasPlaying.current =
        false;

      resumeMusic();
    }
  }, [
    pokemonGetStatus.didJustFinish,
    resumeMusic,
  ]);


  /*
   * ========================================
   * STATE
   * ========================================
   */

  const [isLoading, setIsLoading] =
    useState(true);

  const [shardBalance, setShardBalance] =
    useState(0);

  const [inventory, setInventory] =
    useState<PokemonInventoryItem[]>([]);

  const [busyBallType, setBusyBallType] =
    useState<PokeballType | null>(null);

  const [reveal, setReveal] =
    useState<RevealState>({
      status: 'idle',
    });


  /*
   * Pokémon returned by the backend
   * but not revealed yet.
   *
   * This waits for the Poké Ball
   * animation to finish.
   */

  const [pendingSpecies, setPendingSpecies] =
    useState<PokemonSpecies | null>(null);


  /*
   * ========================================
   * PLAY POKÉMON GET SOUND
   * ========================================
   */

  function playPokemonGetSound() {
    /*
     * If sound effects are disabled,
     * don't play anything and don't
     * touch the BGM.
     */

    if (
      !soundEnabled ||
      soundVolume <= 0
    ) {
      return;
    }


    /*
     * Remember whether BGM is currently
     * playing BEFORE pausing it.
     *
     * pauseMusic() returns:
     *
     * true  → BGM was playing
     * false → BGM was already paused/off
     */

    musicWasPlaying.current =
      pauseMusic();


    /*
     * Set Pokémon obtain sound volume.
     */

    pokemonGetSound.volume =
      soundVolume;


    /*
     * Restart the obtain sound from
     * the beginning.
     */

    pokemonGetSound.seekTo(0);


    /*
     * Play obtain sound.
     */

    pokemonGetSound.play();
  }


  /*
   * ========================================
   * BALL CONFIGS
   * ========================================
   */

  const ballConfigs =
    getAllPokeballConfigs().filter(
      (config) =>
        config.catchRule !==
        'mega_evolution'
    );


  /*
   * ========================================
   * LOAD SHOP
   * ========================================
   */

  const loadShop =
    useCallback(
      async () => {
        if (!profile?.id) {
          return;
        }

        setIsLoading(true);

        try {
          const state =
            await getShopState(
              profile.id
            );

          setShardBalance(
            state.shardBalance
          );

          setInventory(
            state.inventory
          );
        } catch (error) {
          console.error(
            '[POKEMON] Failed to load shop:',
            error
          );
        } finally {
          setIsLoading(false);
        }
      },
      [profile?.id]
    );


  /*
   * ========================================
   * REFRESH WHEN SCREEN FOCUSES
   * ========================================
   */

  useFocusEffect(
    useCallback(() => {
      loadShop();
    }, [loadShop])
  );


  /*
   * ========================================
   * GET OWNED BALL COUNT
   * ========================================
   */

  function getOwnedCount(
    ballType: PokeballType
  ): number {
    return (
      inventory.find(
        (item) =>
          item.ballType ===
          ballType
      )?.count ?? 0
    );
  }


  /*
   * ========================================
   * BUY BALL
   * ========================================
   */

  async function handleBuy(
    config: PokeballConfig
  ) {
    if (
      !profile?.id ||
      busyBallType
    ) {
      return;
    }

    setBusyBallType(
      config.type
    );

    try {
      const result =
        await buyPokeball(
          profile.id,
          config.type
        );

      if (result.success) {
        await loadShop();
      }
    } catch (error) {
      console.error(
        '[POKEMON] Failed to buy ball:',
        error
      );
    } finally {
      setBusyBallType(null);
    }
  }


  /*
   * ========================================
   * OPEN BALL
   * ========================================
   */

  async function handleOpen(
    ballType: PokeballType
  ) {
    if (
      !profile?.id ||
      busyBallType
    ) {
      return;
    }

    setBusyBallType(
      ballType
    );


    /*
     * Clear previous Pokémon.
     */

    setPendingSpecies(null);


    /*
     * Immediately switch to
     * opening screen.
     */

    setReveal({
      status: 'opening',
      ballType,
    });


    try {
      const result =
        await openPokeball(
          profile.id,
          ballType
        );


      /*
       * ======================================
       * SUCCESSFUL CATCH
       * ======================================
       *
       * DON'T reveal the Pokémon yet.
       *
       * Store it temporarily and let the
       * Poké Ball animation reveal it.
       */

      if (
        result.success &&
        result.species
      ) {
        setPendingSpecies(
          result.species
        );
      } else {

        /*
         * Opening failed.
         */

        setPendingSpecies(null);

        setReveal({
          status: 'failed',
          reason:
            result.reason ??
            'SOMETHING WENT WRONG',
        });
      }


      /*
       * Refresh inventory/shards.
       */

      await loadShop();

    } catch (error) {

      console.error(
        '[POKEMON] Failed to open ball:',
        error
      );

      setPendingSpecies(null);

      setReveal({
        status: 'failed',
        reason:
          'SOMETHING WENT WRONG',
      });

    } finally {
      setBusyBallType(null);
    }
  }


  /*
   * ========================================
   * CLOSE REVEAL
   * ========================================
   */

  function closeReveal() {
    setPendingSpecies(null);

    setReveal({
      status: 'idle',
    });
  }


  /*
   * ========================================
   * REVEAL SCREEN
   * ========================================
   */

  if (
    reveal.status === 'opening' ||
    reveal.status === 'success' ||
    reveal.status === 'failed'
  ) {
    return (
      <View
        style={
          styles.container
        }
      >

        <View
          style={
            styles.revealScreen
          }
        >

          {/* ==================================
              OPENING
          ================================== */}

          {reveal.status ===
            'opening' && (
            <>
              {pendingSpecies ? (

                /*
                 * Backend has returned
                 * the Pokémon.
                 *
                 * Now play the Poké Ball
                 * animation.
                 */

                <PokeballOpeningAnimation
                  ballType={
                    reveal.ballType
                  }

                  onComplete={() => {

                    if (
                      !pendingSpecies
                    ) {
                      return;
                    }


                    /*
                     * Play the Pokémon
                     * obtained sound.
                     *
                     * This automatically
                     * pauses BGM first.
                     */

                    playPokemonGetSound();


                    /*
                     * Now reveal the Pokémon.
                     */

                    setReveal({
                      status: 'success',
                      species:
                        pendingSpecies,
                    });


                    setPendingSpecies(
                      null
                    );
                  }}

                  size={192}
                />

              ) : (

                /*
                 * Backend is still opening
                 * the ball.
                 */

                <>
                  <ActivityIndicator
                    size="large"
                    color={
                      colors.primary
                    }
                  />

                  <Text
                    style={
                      styles.revealLabel
                    }
                  >
                    OPENING...
                  </Text>
                </>
              )}
            </>
          )}


          {/* ==================================
              SUCCESS
          ================================== */}

          {reveal.status ===
            'success' && (
            <>

              <Text
                style={
                  styles.revealLabel
                }
              >
                YOU CAUGHT
              </Text>


              <PokemonSprite
                spriteAssetId={
                  reveal.species
                    .spriteAssetId
                }

                iconAssetId={
                  reveal.species
                    .iconAssetId
                }

                name={
                  reveal.species.name
                }

                rarity={
                  reveal.species.rarity
                }

                size="sprite"
              />


              {/* ==================================
                  POKÉMON CRY
              ================================== */}

              <PokemonCry
                cryAssetId={
                  reveal.species
                    .cryAssetId
                }

                autoPlay

                showButton={false}
              />


              <Text
                style={
                  styles.revealName
                }
              >
                {
                  reveal.species.name
                }
              </Text>


              <Text
                style={
                  styles.revealTypes
                }
              >
                {reveal.species.types
                  .join(' / ')
                  .toUpperCase()}
              </Text>


              <PixelButton
                title="NICE!"
                onPress={
                  closeReveal
                }
                style={
                  styles.revealButton
                }
              />

            </>
          )}


          {/* ==================================
              FAILED
          ================================== */}

          {reveal.status ===
            'failed' && (
            <>

              <Text
                style={
                  styles.revealLabel
                }
              >
                {reveal.reason ===
                'ALL_SPECIES_OWNED_FOR_THIS_BALL'
                  ? 'YOU ALREADY OWN EVERY\nPOKÉMON THIS BALL CAN\nFIND — SHARDS REFUNDED'

                  : reveal.reason ===
                    'NO_BALLS_OWNED'
                  ? "YOU DON'T OWN THIS BALL"

                  : reveal.reason.replace(
                      /_/g,
                      ' '
                    )}
              </Text>


              <PixelButton
                title="OK"
                onPress={
                  closeReveal
                }
                style={
                  styles.revealButton
                }
              />

            </>
          )}

        </View>
      </View>
    );
  }


  /*
   * ========================================
   * SHOP
   * ========================================
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
          SHOP
        </Text>


        {/* SHARD BALANCE */}

        <View
          style={
            styles.shardPill
          }
        >

          <Image
            source={
              SHARD_ICON
            }

            style={
              styles.shardIcon
            }

            resizeMode="contain"
          />


          <Text
            style={
              styles.shardPillText
            }
          >
            {shardBalance}
          </Text>

        </View>

      </View>


      {/* ==================================
          LOADING
      ================================== */}

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
          contentContainerStyle={
            styles.list
          }

          showsVerticalScrollIndicator={
            false
          }
        >

          {ballConfigs.map(
            (config) => {

              const owned =
                getOwnedCount(
                  config.type
                );

              const canAfford =
                shardBalance >=
                config.shardCost;

              const isBusy =
                busyBallType ===
                config.type;

              const ballIcon =
                getPokeballIconSource(
                  config.type
                );


              return (
                <PixelCard
                  key={
                    config.type
                  }

                  style={
                    styles.ballCard
                  }
                >

                  {/* ==========================
                      BALL HEADER
                  ========================== */}

                  <View
                    style={
                      styles.ballCardHeader
                    }
                  >

                    <View
                      style={
                        styles.ballNameRow
                    }>

                      {ballIcon && (
                        <Image
                          source={
                            ballIcon
                          }

                          style={
                            styles.ballIcon
                          }

                          resizeMode="contain"
                        />
                      )}


                      <Text
                        style={
                          styles.ballName
                        }
                      >
                        {
                          config.displayName
                        }
                      </Text>

                    </View>


                    <Text
                      style={
                        styles.ballOwned
                      }
                    >
                      OWNED: {owned}
                    </Text>

                  </View>


                  {/* ==========================
                      DESCRIPTION
                  ========================== */}

                  <Text
                    style={
                      styles.ballDescription
                    }
                  >
                    {describeCatchRule(
                      config.catchRule
                    )}
                  </Text>


                  {/* ==========================
                      ACTIONS
                  ========================== */}

                  <View
                    style={
                      styles.ballActions
                    }
                  >

                    {/* BUY */}

                    <PixelButton
                      title={`BUY · ${config.shardCost}`}
                      variant="secondary"
                      icon={
                        SHARD_ICON
                      }
                      iconSize={18}
                      iconPosition="right"

                      disabled={
                        !canAfford ||
                        isBusy
                      }

                      onPress={() =>
                        handleBuy(
                          config
                        )
                      }

                      style={
                        styles.ballActionButton
                      }
                    />


                    {/* OPEN */}

                    <PixelButton
                      title="OPEN"

                      disabled={
                        owned === 0 ||
                        isBusy
                      }

                      onPress={() =>
                        handleOpen(
                          config.type
                        )
                      }

                      style={
                        styles.ballActionButton
                      }
                    />

                  </View>

                </PixelCard>
              );
            }
          )}

        </ScrollView>
      )}

    </View>
  );
}


/*
 * ========================================
 * CATCH RULE DESCRIPTION
 * ========================================
 */

function describeCatchRule(
  catchRule:
    PokeballConfig['catchRule']
): string {

  switch (
    catchRule
  ) {

    case 'basic_form':
      return 'FINDS A BASIC-STAGE POKÉMON.';

    case 'short_final_form':
      return "FINDS A SHORT-LINE POKÉMON'S FINAL FORM.";

    case 'mid_evolution_form':
      return 'FINDS A MID-EVOLUTION POKÉMON.';

    case 'legendary':
      return 'FINDS A LEGENDARY POKÉMON.';

    default:
      return '';
  }
}


/*
 * ========================================
 * STYLES
 * ========================================
 */

const styles =
  StyleSheet.create({

    /*
     * ==============================
     * CONTAINER
     * ==============================
     */

    container: {
      flex: 1,
      backgroundColor:
        colors.background,
    },


    /*
     * ==============================
     * HEADER
     * ==============================
     */

    header: {
      flexDirection: 'row',
      alignItems: 'center',
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
      fontFamily: 'VT323',
      fontSize: 20,
      color:
        colors.primary,
    },


    title: {
      fontFamily:
        'PressStart2P',

      fontSize: 14,

      color:
        colors.text,
    },


    /*
     * ==============================
     * SHARD BALANCE
     * ==============================
     */

    shardPill: {
      flexDirection: 'row',

      alignItems: 'center',

      backgroundColor:
        colors.surfaceLight,

      borderWidth: 2,

      borderColor:
        colors.borderStrong,

      paddingHorizontal:
        spacing.sm,

      paddingVertical:
        spacing.xs,
    },


    shardIcon: {
      width: 28,
      height: 28,

      marginRight:
        spacing.xs,
    },


    shardPillText: {
      fontFamily: 'VT323',
      fontSize: 20,

      color:
        colors.primary,
    },


    /*
     * ==============================
     * LOADING
     * ==============================
     */

    loadingScreen: {
      flex: 1,

      alignItems: 'center',

      justifyContent:
        'center',
    },


    /*
     * ==============================
     * SHOP LIST
     * ==============================
     */

    list: {
      padding:
        spacing.lg,

      paddingBottom:
        spacing.xxxl,

      gap:
        spacing.md,
    },


    /*
     * ==============================
     * BALL CARD
     * ==============================
     */

    ballCard: {
      marginBottom:
        spacing.md,
    },


    ballCardHeader: {
      flexDirection: 'row',

      justifyContent:
        'space-between',

      alignItems: 'center',
    },


    ballNameRow: {
      flexDirection: 'row',

      alignItems: 'center',

      flex: 1,
    },


    ballIcon: {
      width: 44,
      height: 44,

      marginRight:
        spacing.sm,
    },


    ballName: {
      fontFamily:
        'PressStart2P',

      fontSize: 12,

      color:
        colors.text,

      flexShrink: 1,
    },


    ballOwned: {
      fontFamily: 'VT323',

      fontSize: 16,

      color:
        colors.textSecondary,

      marginLeft:
        spacing.sm,
    },


    ballDescription: {
      fontFamily: 'VT323',

      fontSize: 16,

      color:
        colors.textSecondary,

      marginTop:
        spacing.sm,
    },


    /*
     * ==============================
     * ACTIONS
     * ==============================
     */

    ballActions: {
      flexDirection: 'row',

      alignItems: 'center',

      gap:
        spacing.sm,

      marginTop:
        spacing.md,
    },


    ballActionButton: {
      flex: 1,
    },


    /*
     * ==============================
     * REVEAL
     * ==============================
     */

    revealScreen: {
      flex: 1,

      alignItems: 'center',

      justifyContent:
        'center',

      padding:
        spacing.xl,
    },


    revealLabel: {
      fontFamily:
        'PressStart2P',

      fontSize: 12,

      color:
        colors.textSecondary,

      textAlign: 'center',

      marginTop:
        spacing.lg,

      lineHeight: 20,
    },


    revealName: {
      fontFamily:
        'PressStart2P',

      fontSize: 18,

      color:
        colors.primary,

      marginTop:
        spacing.lg,
    },


    revealTypes: {
      fontFamily: 'VT323',

      fontSize: 18,

      color:
        colors.textSecondary,

      marginTop:
        spacing.sm,
    },


    revealButton: {
      marginTop:
        spacing.xxl,

      minWidth: 200,
    },

  });