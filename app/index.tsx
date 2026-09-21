import { useEffect } from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { useProfile } from '../context/ProfileContext';

import {
  colors,
} from '../constants/theme';

/*
 * ========================================
 * GYMATE ENTRY SCREEN
 * ========================================
 *
 * This screen decides where the user should
 * go when the application starts.
 *
 * FLOW:
 *
 * No profile
 *     ↓
 * profile/create
 *
 * Profile exists but setup incomplete
 *     ↓
 * profile/setup
 *
 * Profile + profile details exist
 *     ↓
 * (tabs)
 *
 * ProfileContext has already restored the
 * active profile from AsyncStorage.
 * ========================================
 */

export default function IndexScreen() {
  const {
    profile,
    profileDetails,
    isLoading,
  } = useProfile();

  /*
   * ========================================
   * ROUTING
   * ========================================
   */

  useEffect(() => {
    /*
     * ProfileContext is still restoring
     * the active profile.
     *
     * Do nothing yet.
     */

    if (isLoading) {
      return;
    }

    /*
     * ======================================
     * NO PROFILE
     * ======================================
     */

    if (!profile) {
      router.replace('/profile/create');

      return;
    }

    /*
     * ======================================
     * PROFILE EXISTS
     * BUT SETUP IS INCOMPLETE
     * ======================================
     */

    if (!profileDetails) {
      router.replace('/profile/setup');

      return;
    }

    /*
     * ======================================
     * PROFILE FULLY SET UP
     * ======================================
     */

    router.replace('/(tabs)');
  }, [
    isLoading,
    profile,
    profileDetails,
  ]);

  /*
   * ========================================
   * LOADING SCREEN
   * ========================================
   */

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>
        GYMATE
      </Text>

      <ActivityIndicator
        size="small"
        color={colors.primary}
      />

      <Text style={styles.loadingText}>
        CHECKING PROFILE...
      </Text>
    </View>
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

    backgroundColor:
      colors.background,

    alignItems: 'center',

    justifyContent: 'center',
  },

  logo: {
    fontFamily:
      'PressStart2P',

    fontSize: 22,

    color:
      colors.primary,

    marginBottom: 24,
  },

  loadingText: {
    fontFamily:
      'VT323',

    fontSize: 20,

    color:
      colors.textSecondary,

    marginTop: 12,
  },
});