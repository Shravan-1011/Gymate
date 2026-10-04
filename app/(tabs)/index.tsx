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

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProfile } from '../../context/ProfileContext';

import PixelCard from '../../components/PixelCard';
import ProgressBar from '../../components/ProgressBar';
import PokemonSprite from '../../components/pokemon/PokemonSprite';

import {
  colors,
  spacing,
} from '../../constants/theme';

import {
  getTeamWithDetails,
} from '../../services/pokemonService';

import {
  getPokemonXPPerLevel,
  getPokemonMaxLevel,
} from '../../services/pokemonDataService';

import {
  getXPTransactionsForDate,
} from '../../database/xpRepository';

import type {
  PokemonSpecies,
  UserPokemon,
} from '../../types/pokemon';


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

type DailyActivityStatus = {
  workout: boolean;
  diet: boolean;
  walking: boolean;
  running: boolean;
  todo: boolean;
};


/*
 * ========================================
 * DATE
 * ========================================
 */

function getTodayDate(): string {
  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1,
    ).padStart(2, '0');

  const day =
    String(
      now.getDate(),
    ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}


/*
 * ========================================
 * HOME SCREEN
 * ========================================
 */

export default function HomeScreen() {

  const {
    profile,
    isLoading: profileLoading,
  } = useProfile();


  const insets =
    useSafeAreaInsets();


  const profileId =
    profile?.id ?? null;


  const [isLoading, setIsLoading] =
    useState(true);


  const [activities, setActivities] =
    useState<DailyActivityStatus>({
      workout: false,
      diet: false,
      walking: false,
      running: false,
      todo: false,
    });


  const [team, setTeam] =
    useState<TeamEntry[]>([]);


  /*
   * ======================================
   * LOAD HOME DATA
   * ======================================
   */

  const loadHome = useCallback(
    async () => {

      if (!profileId) {

        setIsLoading(false);

        return;

      }


      try {

        setIsLoading(true);


        const today =
          getTodayDate();


        const [
          transactions,
          teamDetails,
        ] = await Promise.all([

          getXPTransactionsForDate(
            profileId,
            today,
          ),

          getTeamWithDetails(
            profileId,
          ),

        ]);


        /*
         * ----------------------------------
         * CHECK TODAY'S XP SOURCES
         * ----------------------------------
         */

        const hasSource = (
          source: string,
        ) =>
          transactions.some(
            transaction =>
              transaction.source ===
                source &&
              transaction.amount > 0,
          );


        setActivities({

          workout:
            hasSource(
              'WORKOUT_COMPLETED',
            ),

          diet:
            hasSource(
              'NUTRITION_COMPLETED',
            ),

          walking:
            hasSource(
              'STEPS_10K_COMPLETED',
            ),

          running:
            hasSource(
              'RUNNING_COMPLETED',
            ),

          todo:
            hasSource(
              'TODO_COMPLETED',
            ),

        });


        /*
         * ----------------------------------
         * CURRENT POKÉMON TEAM
         * ----------------------------------
         */

        setTeam(
          teamDetails,
        );

      } catch (error) {

        console.error(
          '[HOME] Failed to load Home data:',
          error,
        );


        setActivities({

          workout: false,
          diet: false,
          walking: false,
          running: false,
          todo: false,

        });


        setTeam([]);

      } finally {

        setIsLoading(false);

      }

    },
    [profileId],
  );


  /*
   * Reload Home whenever the screen
   * receives focus.
   */

  useFocusEffect(
    useCallback(() => {

      loadHome();

    }, [loadHome]),
  );


  /*
   * ======================================
   * LOADING
   * ======================================
   */

  if (
    profileLoading ||
    isLoading
  ) {

    return (

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

        <Text
          style={
            styles.loadingText
          }
        >
          LOADING GYMATE...
        </Text>

      </View>

    );

  }


  /*
   * ======================================
   * NO PROFILE
   * ======================================
   *
   * This is also a safety net.
   *
   * Normally app/index.tsx should redirect
   * here to /profile/create.
   *
   * But if the tab navigator opens directly,
   * the user can still create a profile.
   */

  if (!profileId) {

    return (

      <View
        style={
          styles.emptyScreen
        }
      >

        <Text
          style={
            styles.emptyLogo
          }
        >
          GYMATE
        </Text>


        <Text
          style={
            styles.emptyTitle
          }
        >
          PROFILE REQUIRED
        </Text>


        <Text
          style={
            styles.emptyText
          }
        >
          CREATE A PROFILE TO START
          YOUR GYMATE JOURNEY.
        </Text>


        <Pressable
          onPress={() =>
            router.replace(
              '/profile/create'
            )
          }
          style={({ pressed }) => [

            styles.createProfileButton,

            pressed &&
              styles.buttonPressed,

          ]}
        >

          <Text
            style={
              styles.createProfileButtonText
            }
          >
            CREATE PROFILE
          </Text>

        </Pressable>


        <Pressable
          onPress={() =>
            router.push(
              '/profile/login'
            )
          }
          style={({ pressed }) => [

            styles.loginButton,

            pressed &&
              styles.loginButtonPressed,

          ]}
        >

          <Text
            style={
              styles.loginButtonText
            }
          >
            LOGIN
          </Text>

        </Pressable>

      </View>

    );

  }


  /*
   * ======================================
   * TODAY'S PROGRESS
   * ======================================
   */

  const activityList = [

    {
      label: 'WORKOUT',
      completed:
        activities.workout,
    },

    {
      label: 'DIET',
      completed:
        activities.diet,
    },

    {
      label: 'WALKING',
      completed:
        activities.walking,
    },

    {
      label: 'RUNNING',
      completed:
        activities.running,
    },

    {
      label: 'TODO',
      completed:
        activities.todo,
    },

  ];


  const completedActivities =
    activityList.filter(
      activity =>
        activity.completed,
    ).length;


  const totalActivities =
    activityList.length;


  const progress =
    completedActivities /
    totalActivities;


  /*
   * ======================================
   * HOME PARTNER
   * ======================================
   */

  const partner =
    team.length > 0
      ? [...team].sort(
          (a, b) =>
            a.slot - b.slot,
        )[0]
      : null;


  let partnerProgress = 0;


  if (partner) {

    const xpPerLevel =
      getPokemonXPPerLevel();


    const maxLevel =
      getPokemonMaxLevel();


    partnerProgress =
      partner.userPokemon.level >=
      maxLevel

        ? 1

        : (
            partner.userPokemon.xp %
            xpPerLevel
          ) /
          xpPerLevel;

  }


  /*
   * ======================================
   * SCREEN
   * ======================================
   */

  return (

    <ScrollView
      style={
        styles.container
      }

      contentContainerStyle={[

        styles.content,

        {
          paddingTop:
            insets.top +
            spacing.lg,
        },

      ]}

      showsVerticalScrollIndicator={
        false
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

        <View>

          <Text
            style={
              styles.smallText
            }
          >
            GYMATE
          </Text>


          <Text
            style={
              styles.greeting
            }
          >
            WELCOME BACK
          </Text>

        </View>


        <View
          style={
            styles.headerRight
          }
        >

          <Pressable
            style={({ pressed }) => [

              styles.profileButton,

              pressed &&
                styles.buttonPressed,

            ]}

            onPress={() =>
              router.push(
                '/(tabs)/profile',
              )
            }
          >

            <Text
              style={
                styles.profileButtonText
              }
            >
              PROFILE
            </Text>

          </Pressable>

        </View>

      </View>


      {/* ==================================
          TODAY'S PROGRESS
          ================================== */}

      <PixelCard
        style={
          styles.progressCard
        }
      >

        <Text
          style={
            styles.sectionTitle
          }
        >
          TODAY'S PROGRESS
        </Text>


        <View
          style={
            styles.progressHeader
          }
        >

          <Text
            style={
              styles.progressPercentage
            }
          >
            {completedActivities}/
            {totalActivities}
          </Text>


          <Text
            style={
              styles.progressText
            }
          >
            ACTIVITIES
          </Text>

        </View>


        <ProgressBar
          progress={
            progress
          }
        />


        <View
          style={
            styles.activityList
          }
        >

          {activityList.map(
            activity => (

              <View
                key={
                  activity.label
                }

                style={
                  styles.activityRow
                }
              >

                <View
                  style={[
                    styles.activityIndicator,

                    activity.completed &&
                      styles.activityIndicatorDone,

                  ]}
                >

                  {activity.completed && (

                    <Text
                      style={
                        styles.checkmark
                      }
                    >
                      ✓
                    </Text>

                  )}

                </View>


                <Text
                  style={[

                    styles.activityLabel,

                    activity.completed &&
                      styles.activityLabelDone,

                  ]}
                >
                  {
                    activity.label
                  }
                </Text>


                <Text
                  style={[

                    styles.activityStatus,

                    activity.completed &&
                      styles.activityStatusDone,

                  ]}
                >

                  {activity.completed
                    ? 'COMPLETE'
                    : 'PENDING'}

                </Text>

              </View>

            ),
          )}

        </View>

      </PixelCard>


      {/* ==================================
          YOUR PARTNER
          ================================== */}

      <PixelCard
        style={
          styles.partnerCard
        }
      >

        <Text
          style={
            styles.sectionTitle
          }
        >
          YOUR PARTNER
        </Text>


        {partner &&
        partner.species ? (

          <View
            style={
              styles.partnerContent
            }
          >

            <PokemonSprite
              spriteAssetId={
                partner.species
                  .spriteAssetId
              }

              iconAssetId={
                partner.species
                  .iconAssetId
              }

              name={
                partner.species.name
              }

              rarity={
                partner.species.rarity
              }

              size="sprite"
            />


            <Text
              style={
                styles.partnerName
              }
            >
              {
                partner.species.name
                  .toUpperCase()
              }
            </Text>


            <Text
              style={
                styles.partnerLevel
              }
            >
              LEVEL{' '}
              {String(
                partner.userPokemon
                  .level,
              ).padStart(2, '0')}
            </Text>


            <View
              style={
                styles.partnerProgress
              }
            >

              <ProgressBar
                progress={
                  partnerProgress
                }
              />

            </View>


            <Text
              style={
                styles.xpText
              }
            >

              {
                partner.userPokemon.xp %
                getPokemonXPPerLevel()
              }

              {' / '}

              {
                getPokemonXPPerLevel()
              }

              {' XP'}

            </Text>

          </View>

        ) : (

          <View
            style={
              styles.noPartner
            }
          >

            <Text
              style={
                styles.noPartnerTitle
              }
            >
              NO PARTNER YET
            </Text>


            <Text
              style={
                styles.noPartnerText
              }
            >
              CHOOSE YOUR STARTER
              FROM THE POKÉMON TAB.
            </Text>

          </View>

        )}

      </PixelCard>

    </ScrollView>

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


    content: {
      padding:
        spacing.lg,

      paddingBottom:
        spacing.xxxl,
    },


    loadingScreen: {
      flex: 1,

      backgroundColor:
        colors.background,

      alignItems:
        'center',

      justifyContent:
        'center',
    },


    loadingText: {
      color:
        colors.textSecondary,

      fontFamily:
        'VT323',

      fontSize: 18,

      marginTop:
        spacing.sm,
    },


    /*
     * ==============================
     * NO PROFILE
     * ==============================
     */

    emptyScreen: {
      flex: 1,

      backgroundColor:
        colors.background,

      alignItems:
        'center',

      justifyContent:
        'center',

      padding:
        spacing.xl,
    },


    emptyLogo: {
      fontFamily:
        'PressStart2P',

      fontSize: 22,

      color:
        colors.primary,

      marginBottom:
        spacing.xl,
    },


    emptyTitle: {
      color:
        colors.text,

      fontFamily:
        'PressStart2P',

      fontSize: 14,

      textAlign:
        'center',
    },


    emptyText: {
      color:
        colors.textSecondary,

      fontFamily:
        'VT323',

      fontSize: 18,

      textAlign:
        'center',

      marginTop:
        spacing.md,

      lineHeight: 24,

      maxWidth: 300,
    },


    createProfileButton: {
      minHeight: 56,

      width: '100%',

      maxWidth: 300,

      backgroundColor:
        colors.primary,

      borderWidth: 2,

      borderColor:
        colors.primary,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginTop:
        spacing.xl,

      paddingHorizontal:
        spacing.lg,
    },


    createProfileButtonText: {
      fontFamily:
        'PressStart2P',

      fontSize: 10,

      color:
        colors.background,

      textAlign:
        'center',
    },


    loginButton: {
      minHeight: 52,

      width: '100%',

      maxWidth: 300,

      borderWidth: 2,

      borderColor:
        colors.primary,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginTop:
        spacing.md,

      paddingHorizontal:
        spacing.lg,
    },


    loginButtonText: {
      fontFamily:
        'PressStart2P',

      fontSize: 10,

      color:
        colors.primary,

      textAlign:
        'center',
    },


    buttonPressed: {
      opacity: 0.65,

      transform: [
        {
          translateY: 2,
        },
      ],
    },


    loginButtonPressed: {
      opacity: 0.65,

      transform: [
        {
          translateY: 2,
        },
      ],
    },


    /* ==============================
       HEADER
       ============================== */

    header: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'flex-start',

      marginBottom:
        spacing.xl,
    },


    headerRight: {
      alignItems:
        'flex-end',
    },


    smallText: {
      fontFamily:
        'PressStart2P',

      fontSize: 12,

      color:
        colors.primary,

      marginBottom:
        spacing.md,
    },


    greeting: {
      fontFamily:
        'VT323',

      fontSize: 22,

      color:
        colors.textSecondary,
    },


    profileButton: {
      borderWidth: 2,

      borderColor:
        colors.border,

      backgroundColor:
        colors.surface,

      paddingHorizontal:
        spacing.sm,

      paddingVertical:
        spacing.sm,
    },


    profileButtonText: {
      fontFamily:
        'PressStart2P',

      fontSize: 7,

      color:
        colors.primary,
    },


    /* ==============================
       SECTION
       ============================== */

    sectionTitle: {
      fontFamily:
        'PressStart2P',

      fontSize: 12,

      color:
        colors.text,

      marginBottom:
        spacing.lg,
    },


    /* ==============================
       TODAY'S PROGRESS
       ============================== */

    progressCard: {
      marginBottom:
        spacing.lg,
    },


    progressHeader: {
      flexDirection:
        'row',

      alignItems:
        'flex-end',

      justifyContent:
        'space-between',

      marginBottom:
        spacing.sm,
    },


    progressPercentage: {
      fontFamily:
        'PressStart2P',

      fontSize: 22,

      color:
        colors.primary,
    },


    progressText: {
      fontFamily:
        'VT323',

      fontSize: 20,

      color:
        colors.textSecondary,
    },


    activityList: {
      marginTop:
        spacing.lg,

      gap:
        spacing.sm,
    },


    activityRow: {
      minHeight: 42,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        spacing.sm,

      backgroundColor:
        colors.background,

      borderWidth: 1,

      borderColor:
        colors.border,
    },


    activityIndicator: {
      width: 22,

      height: 22,

      borderWidth: 2,

      borderColor:
        colors.borderStrong,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight:
        spacing.sm,
    },


    activityIndicatorDone: {
      backgroundColor:
        colors.primary,

      borderColor:
        colors.primary,
    },


    checkmark: {
      color:
        '#000',

      fontFamily:
        'VT323',

      fontSize: 20,

      lineHeight: 20,
    },


    activityLabel: {
      flex: 1,

      fontFamily:
        'PressStart2P',

      fontSize: 8,

      color:
        colors.textSecondary,
    },


    activityLabelDone: {
      color:
        colors.text,
    },


    activityStatus: {
      fontFamily:
        'VT323',

      fontSize: 15,

      color:
        colors.textMuted,
    },


    activityStatusDone: {
      color:
        colors.primary,
    },


    /* ==============================
       PARTNER
       ============================== */

    partnerCard: {
      marginBottom:
        spacing.lg,
    },


    partnerContent: {
      alignItems:
        'center',
    },


    partnerName: {
      fontFamily:
        'PressStart2P',

      fontSize: 14,

      color:
        colors.text,

      marginTop:
        spacing.md,
    },


    partnerLevel: {
      fontFamily:
        'VT323',

      fontSize: 20,

      color:
        colors.textSecondary,

      marginTop:
        spacing.sm,

      marginBottom:
        spacing.md,
    },


    partnerProgress: {
      width: '100%',
    },


    xpText: {
      fontFamily:
        'VT323',

      fontSize: 17,

      color:
        colors.textSecondary,

      marginTop:
        spacing.sm,
    },


    noPartner: {
      alignItems:
        'center',

      paddingVertical:
        spacing.xl,
    },


    noPartnerTitle: {
      fontFamily:
        'PressStart2P',

      fontSize: 11,

      color:
        colors.primary,
    },


    noPartnerText: {
      fontFamily:
        'VT323',

      fontSize: 17,

      color:
        colors.textSecondary,

      textAlign:
        'center',

      marginTop:
        spacing.sm,
    },

  });