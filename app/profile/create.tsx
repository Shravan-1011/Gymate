import { useState } from 'react';

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { useProfile } from '../../context/ProfileContext';

import {
  colors,
  spacing,
} from '../../constants/theme';

export default function CreateProfileScreen() {
  const { createProfile } = useProfile();

  const [username, setUsername] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('');

  const [error, setError] =
    useState('');

  const [isCreating, setIsCreating] =
    useState(false);

  /*
   * ========================================
   * CREATE PROFILE
   * ========================================
   */

  const handleCreateProfile =
    async () => {
      setError('');

      const trimmedUsername =
        username.trim();

      /*
       * USERNAME
       */

      if (!trimmedUsername) {
        setError(
          'PLEASE ENTER A USERNAME.'
        );
        return;
      }

      if (trimmedUsername.length < 3) {
        setError(
          'USERNAME MUST BE AT LEAST 3 CHARACTERS.'
        );
        return;
      }

      /*
       * PASSWORD
       */

      if (!password) {
        setError(
          'PLEASE ENTER A PASSWORD.'
        );
        return;
      }

      if (password.length < 6) {
        setError(
          'PASSWORD MUST BE AT LEAST 6 CHARACTERS.'
        );
        return;
      }

      /*
       * CONFIRM PASSWORD
       */

      if (
        password !==
        confirmPassword
      ) {
        setError(
          'PASSWORDS DO NOT MATCH.'
        );
        return;
      }

      try {
        setIsCreating(true);

        await createProfile(
          trimmedUsername,
          password
        );

        /*
         * Profile created and
         * automatically authenticated.
         */

        router.replace(
          '/profile/setup'
        );
      } catch (error) {
        console.error(
          'Failed to create profile:',
          error
        );

        if (
          error instanceof Error
        ) {
          switch (error.message) {
            case 'USERNAME_ALREADY_EXISTS':
              setError(
                'THAT USERNAME IS ALREADY TAKEN.'
              );
              break;

            case 'USERNAME_REQUIRED':
              setError(
                'PLEASE ENTER A USERNAME.'
              );
              break;

            case 'PASSWORD_REQUIRED':
              setError(
                'PLEASE ENTER A PASSWORD.'
              );
              break;

            case 'PASSWORD_TOO_SHORT':
              setError(
                'PASSWORD MUST BE AT LEAST 6 CHARACTERS.'
              );
              break;

            default:
              setError(
                'COULD NOT CREATE PROFILE. PLEASE TRY AGAIN.'
              );
          }
        } else {
          setError(
            'COULD NOT CREATE PROFILE. PLEASE TRY AGAIN.'
          );
        }
      } finally {
        setIsCreating(false);
      }
    };

  /*
   * ========================================
   * GO TO LOGIN
   * ========================================
   */

  const handleLogin = () => {
    router.push('/profile/login');
  };

  /*
   * ========================================
   * SCREEN
   * ========================================
   */

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* ==================================
            HEADER
            ================================== */}

        <View
          style={styles.header}
        >
          <Text
            style={styles.logo}
          >
            GYMATE
          </Text>

          <Text
            style={styles.title}
          >
            CREATE PROFILE
          </Text>

          <Text
            style={styles.subtitle}
          >
            BEGIN YOUR JOURNEY
          </Text>
        </View>

        {/* ==================================
            PROFILE CARD
            ================================== */}

        <View
          style={styles.card}
        >
          <Text
            style={styles.sectionTitle}
          >
            TRAINER ID
          </Text>

          {/* USERNAME */}

          <Text
            style={styles.label}
          >
            USERNAME
          </Text>

          <TextInput
            value={username}
            onChangeText={(value) => {
              setUsername(value);
              setError('');
            }}
            placeholder="ENTER USERNAME"
            placeholderTextColor={
              colors.textSecondary
            }
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isCreating}
            maxLength={20}
          />

          {/* PASSWORD */}

          <Text
            style={styles.label}
          >
            PASSWORD
          </Text>

          <TextInput
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setError('');
            }}
            placeholder="ENTER PASSWORD"
            placeholderTextColor={
              colors.textSecondary
            }
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isCreating}
          />

          {/* CONFIRM PASSWORD */}

          <Text
            style={styles.label}
          >
            CONFIRM PASSWORD
          </Text>

          <TextInput
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              setError('');
            }}
            placeholder="RE-ENTER PASSWORD"
            placeholderTextColor={
              colors.textSecondary
            }
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isCreating}
          />

          {/* ERROR */}

          {error ? (
            <View
              style={styles.errorBox}
            >
              <Text
                style={styles.errorText}
              >
                {error}
              </Text>
            </View>
          ) : null}

          {/* CREATE BUTTON */}

          <Pressable
            disabled={isCreating}
            onPress={
              handleCreateProfile
            }
            style={({ pressed }) => [
              styles.createButton,

              pressed &&
                !isCreating &&
                styles.buttonPressed,

              isCreating &&
                styles.buttonDisabled,
            ]}
          >
            {isCreating ? (
              <View
                style={
                  styles.loadingRow
                }
              >
                <ActivityIndicator
                  size="small"
                  color={
                    colors.background
                  }
                />

                <Text
                  style={
                    styles.createButtonText
                  }
                >
                  CREATING...
                </Text>
              </View>
            ) : (
              <Text
                style={
                  styles.createButtonText
                }
              >
                CREATE PROFILE
              </Text>
            )}
          </Pressable>
        </View>

        {/* ==================================
            LOGIN
            ================================== */}

        <View
          style={styles.loginSection}
        >
          <Text
            style={styles.loginPrompt}
          >
            ALREADY HAVE AN ACCOUNT?
          </Text>

          <Pressable
            onPress={handleLogin}
            disabled={isCreating}
            style={({ pressed }) => [
              styles.loginButton,

              pressed &&
                styles.loginButtonPressed,
            ]}
          >
            <Text
              style={styles.loginButtonText}
            >
              LOGIN
            </Text>
          </Pressable>
        </View>

        {/* ==================================
            INFO
            ================================== */}

        <View
          style={styles.infoBox}
        >
          <Text
            style={styles.infoTitle}
          >
            LOCAL PROFILE
          </Text>

          <Text
            style={styles.infoText}
          >
            YOUR GYMATE PROFILE IS STORED
            LOCALLY ON THIS DEVICE.
          </Text>

          <Text
            style={styles.infoText}
          >
            NO ONLINE ACCOUNT IS REQUIRED.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  },

  content: {
    flexGrow: 1,

    paddingHorizontal:
      spacing.lg,

    paddingTop:
      spacing.xl * 2,

    paddingBottom: 100,

    justifyContent:
      'center',
  },

  /* HEADER */

  header: {
    alignItems: 'center',

    marginBottom:
      spacing.xl,
  },

  logo: {
    fontFamily:
      'PressStart2P',

    fontSize: 22,

    color:
      colors.primary,

    marginBottom:
      spacing.lg,
  },

  title: {
    fontFamily:
      'PressStart2P',

    fontSize: 16,

    color:
      colors.text,

    textAlign: 'center',

    marginBottom:
      spacing.sm,
  },

  subtitle: {
    fontFamily: 'VT323',

    fontSize: 22,

    color:
      colors.textSecondary,

    textAlign: 'center',
  },

  /* CARD */

  card: {
    backgroundColor:
      colors.surface,

    borderWidth: 2,

    borderColor:
      colors.border,

    padding: spacing.lg,
  },

  sectionTitle: {
    fontFamily:
      'PressStart2P',

    fontSize: 11,

    color:
      colors.primary,

    marginBottom:
      spacing.xl,
  },

  /* INPUTS */

  label: {
    fontFamily:
      'PressStart2P',

    fontSize: 9,

    color:
      colors.textSecondary,

    marginBottom:
      spacing.sm,
  },

  input: {
    height: 52,

    backgroundColor:
      colors.background,

    borderWidth: 2,

    borderColor:
      colors.border,

    paddingHorizontal:
      spacing.md,

    fontFamily: 'VT323',

    fontSize: 21,

    color:
      colors.text,

    marginBottom:
      spacing.lg,
  },

  /* ERROR */

  errorBox: {
    borderWidth: 2,

    borderColor:
      colors.primary,

    padding: spacing.md,

    marginBottom:
      spacing.md,
  },

  errorText: {
    fontFamily: 'VT323',

    fontSize: 19,

    color:
      colors.primary,

    textAlign: 'center',
  },

  /* CREATE BUTTON */

  createButton: {
    minHeight: 56,

    backgroundColor:
      colors.primary,

    borderWidth: 2,

    borderColor:
      colors.primary,

    alignItems: 'center',

    justifyContent:
      'center',

    paddingHorizontal:
      spacing.md,
  },

  createButtonText: {
    fontFamily:
      'PressStart2P',

    fontSize: 10,

    color:
      colors.background,

    textAlign: 'center',
  },

  loadingRow: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: spacing.sm,
  },

  buttonPressed: {
    opacity: 0.65,

    transform: [
      {
        translateY: 2,
      },
    ],
  },

  buttonDisabled: {
    opacity: 0.55,
  },

  /* ========================================
     LOGIN
     ======================================== */

  loginSection: {
    alignItems: 'center',

    marginTop:
      spacing.xl,
  },

  loginPrompt: {
    fontFamily:
      'VT323',

    fontSize: 20,

    color:
      colors.textSecondary,

    marginBottom:
      spacing.sm,
  },

  loginButton: {
    minHeight: 48,

    minWidth: 150,

    borderWidth: 2,

    borderColor:
      colors.primary,

    alignItems: 'center',

    justifyContent:
      'center',

    paddingHorizontal:
      spacing.lg,
  },

  loginButtonText: {
    fontFamily:
      'PressStart2P',

    fontSize: 10,

    color:
      colors.primary,
  },

  loginButtonPressed: {
    opacity: 0.65,

    transform: [
      {
        translateY: 2,
      },
    ],
  },

  /* INFO */

  infoBox: {
    marginTop:
      spacing.lg,

    padding:
      spacing.md,

    borderWidth: 2,

    borderColor:
      colors.border,
  },

  infoTitle: {
    fontFamily:
      'PressStart2P',

    fontSize: 9,

    color:
      colors.primary,

    marginBottom:
      spacing.sm,
  },

  infoText: {
    fontFamily: 'VT323',

    fontSize: 18,

    color:
      colors.textSecondary,

    lineHeight: 21,

    marginBottom:
      spacing.xs,
  },
});