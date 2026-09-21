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

export default function LoginProfileScreen() {
  const { login } = useProfile();

  const [username, setUsername] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [error, setError] =
    useState('');

  const [isLoggingIn, setIsLoggingIn] =
    useState(false);

  const handleLogin = async () => {
    setError('');

    const trimmedUsername =
      username.trim();

    if (!trimmedUsername) {
      setError(
        'PLEASE ENTER YOUR USERNAME.'
      );
      return;
    }

    if (!password) {
      setError(
        'PLEASE ENTER YOUR PASSWORD.'
      );
      return;
    }

    try {
      setIsLoggingIn(true);

      await login(
        trimmedUsername,
        password
      );

      router.replace('/(tabs)');
    } catch (error) {
      console.error(
        'Failed to login:',
        error
      );

      if (error instanceof Error) {
        switch (error.message) {
          case 'USERNAME_REQUIRED':
            setError(
              'PLEASE ENTER YOUR USERNAME.'
            );
            break;

          case 'PASSWORD_REQUIRED':
            setError(
              'PLEASE ENTER YOUR PASSWORD.'
            );
            break;

          case 'INVALID_CREDENTIALS':
            setError(
              'INVALID USERNAME OR PASSWORD.'
            );
            break;

          default:
            setError(
              'COULD NOT LOGIN. PLEASE TRY AGAIN.'
            );
        }
      } else {
        setError(
          'COULD NOT LOGIN. PLEASE TRY AGAIN.'
        );
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

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
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Text style={styles.logo}>
            GYMATE
          </Text>

          <Text style={styles.title}>
            WELCOME BACK
          </Text>

          <Text style={styles.subtitle}>
            CONTINUE YOUR JOURNEY
          </Text>
        </View>

        {/* LOGIN CARD */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            TRAINER LOGIN
          </Text>

          {/* USERNAME */}

          <Text style={styles.label}>
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
            editable={!isLoggingIn}
            maxLength={20}
          />

          {/* PASSWORD */}

          <Text style={styles.label}>
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
            editable={!isLoggingIn}
          />

          {/* ERROR */}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* LOGIN */}

          <Pressable
            disabled={isLoggingIn}
            onPress={handleLogin}
            style={({ pressed }) => [
              styles.loginButton,

              pressed &&
                !isLoggingIn &&
                styles.buttonPressed,

              isLoggingIn &&
                styles.buttonDisabled,
            ]}
          >
            {isLoggingIn ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator
                  size="small"
                  color={colors.background}
                />

                <Text
                  style={
                    styles.loginButtonText
                  }
                >
                  LOGGING IN...
                </Text>
              </View>
            ) : (
              <Text
                style={
                  styles.loginButtonText
                }
              >
                LOGIN
              </Text>
            )}
          </Pressable>

          {/* CREATE ACCOUNT */}

          <Pressable
            disabled={isLoggingIn}
            onPress={() =>
              router.push(
                '/profile/create'
              )
            }
            style={styles.createLink}
          >
            <Text style={styles.createLinkText}>
              NEW TRAINER? CREATE PROFILE
            </Text>
          </Pressable>
        </View>

        {/* INFO */}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>
            LOCAL LOGIN
          </Text>

          <Text style={styles.infoText}>
            YOUR PROFILE IS STORED LOCALLY
            ON THIS DEVICE.
          </Text>

          <Text style={styles.infoText}>
            NO ONLINE ACCOUNT IS REQUIRED.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl * 2,
    paddingBottom: 100,
    justifyContent: 'center',
  },

  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  logo: {
    fontFamily: 'PressStart2P',
    fontSize: 22,
    color: colors.primary,
    marginBottom: spacing.lg,
  },

  title: {
    fontFamily: 'PressStart2P',
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  subtitle: {
    fontFamily: 'VT323',
    fontSize: 22,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg,
  },

  sectionTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 11,
    color: colors.primary,
    marginBottom: spacing.xl,
  },

  label: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },

  input: {
    height: 52,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontFamily: 'VT323',
    fontSize: 21,
    color: colors.text,
    marginBottom: spacing.lg,
  },

  errorBox: {
    borderWidth: 2,
    borderColor: colors.primary,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  errorText: {
    fontFamily: 'VT323',
    fontSize: 19,
    color: colors.primary,
    textAlign: 'center',
  },

  loginButton: {
    minHeight: 56,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },

  loginButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: colors.background,
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

  createLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },

  createLinkText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  infoBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },

  infoTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: colors.primary,
    marginBottom: spacing.sm,
  },

  infoText: {
    fontFamily: 'VT323',
    fontSize: 18,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: spacing.xs,
  },
});