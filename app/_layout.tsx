import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';

import {
  PressStart2P_400Regular,
} from '@expo-google-fonts/press-start-2p';

import {
  VT323_400Regular,
} from '@expo-google-fonts/vt323';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import { WorkoutProvider } from '../context/WorkoutContext';
import { ProfileProvider } from '../context/ProfileContext';
import { SoundProvider } from '../context/SoundContext';
import { MusicProvider } from '../context/MusicContext';
import PokemonEvolutionHost from '../components/pokemon/PokemonEvolutionHost';

import '../tasks/runningLocationTask';

import {
  initializeDatabase,
} from '../database/database';

import {
  colors,
} from '../constants/theme';


export default function RootLayout() {

  /*
   * ========================================
   * FONTS
   * ========================================
   */

  const [fontsLoaded] = useFonts({

    PressStart2P:
      PressStart2P_400Regular,

    VT323:
      VT323_400Regular,

  });


  /*
   * ========================================
   * DATABASE STATE
   * ========================================
   */

  const [
    databaseInitialized,
    setDatabaseInitialized,
  ] = useState(false);


  const [
    databaseError,
    setDatabaseError,
  ] = useState(false);


  /*
   * ========================================
   * DATABASE INITIALIZATION
   * ========================================
   */

  useEffect(() => {

    const setupDatabase =
      async () => {

        try {

          await initializeDatabase();

          setDatabaseInitialized(
            true
          );

        } catch (error) {

          console.error(
            'Failed to initialize Gymate database:',
            error
          );

          setDatabaseError(
            true
          );

        }

      };


    setupDatabase();

  }, []);


  /*
   * ========================================
   * FONT LOADING
   * ========================================
   */

  if (!fontsLoaded) {

    return (

      <View
        style={
          styles.loadingScreen
        }
      >

        <Text
          style={
            styles.loadingTitle
          }
        >
          GYMATE
        </Text>


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
          LOADING...
        </Text>

      </View>

    );

  }


  /*
   * ========================================
   * DATABASE LOADING
   * ========================================
   */

  if (!databaseInitialized) {

    return (

      <View
        style={
          styles.loadingScreen
        }
      >

        {databaseError ? (

          <>

            <Text
              style={
                styles.errorTitle
              }
            >
              GYMATE
            </Text>


            <Text
              style={
                styles.errorText
              }
            >
              DATABASE ERROR
            </Text>


            <Text
              style={
                styles.errorSubtext
              }
            >
              PLEASE RESTART THE APP.
            </Text>

          </>

        ) : (

          <>

            <Text
              style={
                styles.loadingTitle
              }
            >
              GYMATE
            </Text>


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
              INITIALIZING DATABASE...
            </Text>

          </>

        )}

      </View>

    );

  }


  /*
   * ========================================
   * APPLICATION
   * ========================================
   *
   * IMPORTANT:
   *
   * app/index.tsx is intentionally the
   * entry route.
   *
   * It decides:
   *
   * No profile
   *      ↓
   * profile/create
   *
   * Profile but no details
   *      ↓
   * profile/setup
   *
   * Fully configured profile
   *      ↓
   * (tabs)
   *
   * We therefore do NOT manually make
   * (tabs) the initial route here.
   * ========================================
   */

  return (

    <SafeAreaProvider>

      <ProfileProvider>

        <WorkoutProvider>

          <SoundProvider>

            <MusicProvider>

              <Stack
                initialRouteName="index"
                screenOptions={{
                  headerShown: false,
                }}
              >

                {/* ==================================
                    ROOT ENTRY
                    ================================== */}

                <Stack.Screen
                  name="index"
                  options={{
                    headerShown: false,
                  }}
                />


                {/* ==================================
                    MAIN APPLICATION
                    ================================== */}

                <Stack.Screen
                  name="(tabs)"
                  options={{
                    headerShown: false,
                  }}
                />


                {/* ==================================
                    PROFILE
                    ================================== */}

                <Stack.Screen
                  name="profile/create"
                  options={{
                    headerShown: false,
                  }}
                />


                <Stack.Screen
                  name="profile/setup"
                  options={{
                    headerShown: false,
                  }}
                />


                <Stack.Screen
                  name="profile/login"
                  options={{
                    headerShown: false,
                  }}
                />


                <Stack.Screen
                  name="profile/index"
                  options={{
                    headerShown: false,
                  }}
                />


                {/* ==================================
                    WORKOUT
                    ================================== */}

                <Stack.Screen
                  name="workout/[splitId]"
                  options={{
                    headerShown: false,
                  }}
                />


                <Stack.Screen
                  name="workout/active"
                  options={{
                    headerShown: false,
                  }}
                />


                <Stack.Screen
                  name="workout/add-exercise/[splitId]"
                  options={{
                    headerShown: false,
                  }}
                />


                <Stack.Screen
                  name="workout/exercise"
                  options={{
                    headerShown: false,
                  }}
                />


                <Stack.Screen
                  name="workout/add-set"
                  options={{
                    headerShown: false,
                  }}
                />


                <Stack.Screen
                  name="workout/summary"
                  options={{
                    headerShown: false,
                  }}
                />


                <Stack.Screen
                  name="workout/history"
                  options={{
                    headerShown: false,
                  }}
                />


                <Stack.Screen
                  name="workout/history/[workoutId]"
                  options={{
                    headerShown: false,
                  }}
                />


                {/* ==================================
                    POKÉMON
                    ================================== */}

                <Stack.Screen
                  name="pokemon/pc"
                  options={{
                    headerShown: false,
                  }}
                />


                <Stack.Screen
                  name="pokemon/shop"
                  options={{
                    headerShown: false,
                  }}
                />


                <Stack.Screen
                  name="pokemon/detail/[userPokemonId]"
                  options={{
                    headerShown: false,
                  }}
                />


                <Stack.Screen
                  name="pokemon/achievements"
                  options={{
                    headerShown: false,
                  }}
                />


                <Stack.Screen
                  name="pokemon/badges"
                  options={{
                    headerShown: false,
                  }}
                />

              </Stack>

                  <PokemonEvolutionHost />
            </MusicProvider>

          </SoundProvider>

        </WorkoutProvider>

      </ProfileProvider>

    </SafeAreaProvider>

  );
}


/*
 * ========================================
 * STYLES
 * ========================================
 */

const styles =
  StyleSheet.create({

    loadingScreen: {
      flex: 1,

      backgroundColor:
        colors.background,

      alignItems:
        'center',

      justifyContent:
        'center',
    },


    loadingTitle: {
      fontFamily:
        'PressStart2P',

      fontSize: 20,

      color:
        colors.primary,

      marginBottom: 24,

      textAlign:
        'center',
    },


    loadingText: {
      fontFamily:
        'VT323',

      fontSize: 20,

      color:
        colors.textSecondary,

      marginTop: 12,

      textAlign:
        'center',
    },


    errorTitle: {
      fontFamily:
        'PressStart2P',

      fontSize: 20,

      color:
        colors.primary,

      marginBottom: 24,

      textAlign:
        'center',
    },


    errorText: {
      fontFamily:
        'PressStart2P',

      fontSize: 12,

      color:
        colors.text,

      marginBottom: 12,

      textAlign:
        'center',
    },


    errorSubtext: {
      fontFamily:
        'VT323',

      fontSize: 20,

      color:
        colors.textSecondary,

      textAlign:
        'center',
    },

  });