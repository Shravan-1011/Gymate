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

import {
  pickGymateBackupFile,
  getBackupPreview,
} from '../../services/backupFileService';

import type {
  GymateBackup,
} from '../../types/backup';


export default function CreateProfileScreen() {

  const {
    createProfile,
    restoreBackupAsNewProfile,
  } = useProfile();


  /*
   * ========================================
   * CREATE PROFILE STATE
   * ========================================
   */

  const [username, setUsername] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('');


  /*
   * ========================================
   * RESTORE STATE
   * ========================================
   */

  const [
    selectedBackup,
    setSelectedBackup,
  ] = useState<GymateBackup | null>(
    null
  );

  const [
    backupFilename,
    setBackupFilename,
  ] = useState('');

  const [
    backupRecordCount,
    setBackupRecordCount,
  ] = useState(0);

  const [
    backupCreatedAt,
    setBackupCreatedAt,
  ] = useState('');

  const [
    restorePassword,
    setRestorePassword,
  ] = useState('');

  const [
    restoreConfirmPassword,
    setRestoreConfirmPassword,
  ] = useState('');


  /*
   * ========================================
   * GENERAL STATE
   * ========================================
   */

  const [error, setError] =
    useState('');

  const [
    isCreating,
    setIsCreating,
  ] = useState(false);

  const [
    isPickingBackup,
    setIsPickingBackup,
  ] = useState(false);

  const [
    isRestoring,
    setIsRestoring,
  ] = useState(false);


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


      if (
        trimmedUsername.length < 3
      ) {

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

          switch (
            error.message
          ) {

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
   * SELECT BACKUP
   * ========================================
   */

  const handleSelectBackup =
    async () => {

      setError('');

      try {

        setIsPickingBackup(
          true
        );


        const result =
          await pickGymateBackupFile();


        const preview =
          getBackupPreview(
            result.backup
          );


        setSelectedBackup(
          result.backup
        );

        setBackupFilename(
          result.filename
        );

        setBackupRecordCount(
          preview.recordCount
        );

        setBackupCreatedAt(
          preview.createdAt
        );


        /*
         * Clear normal create fields.
         */

        setUsername('');

        setPassword('');

        setConfirmPassword('');

        setRestorePassword('');

        setRestoreConfirmPassword('');

      } catch (error) {

        console.error(
          'Failed to select Gymate backup:',
          error
        );


        if (
          error instanceof Error
        ) {

          switch (
            error.message
          ) {

            case 'BACKUP_PICKER_CANCELLED':

              break;


            case 'INVALID_BACKUP_FILE_TYPE':

              setError(
                'PLEASE SELECT A .GYMATE BACKUP FILE.'
              );

              break;


            case 'BACKUP_FILE_EMPTY':

              setError(
                'THE BACKUP FILE IS EMPTY.'
              );

              break;


            case 'INVALID_BACKUP_JSON':

              setError(
                'THE BACKUP FILE IS NOT VALID.'
              );

              break;


            case 'UNSUPPORTED_BACKUP_FORMAT':

              setError(
                'THIS IS NOT A VALID GYMATE BACKUP.'
              );

              break;


            case 'UNSUPPORTED_BACKUP_VERSION':

              setError(
                'THIS GYMATE BACKUP VERSION IS NOT SUPPORTED.'
              );

              break;


            default:

              setError(
                'COULD NOT READ THE BACKUP FILE.'
              );

          }

        } else {

          setError(
            'COULD NOT READ THE BACKUP FILE.'
          );

        }

      } finally {

        setIsPickingBackup(
          false
        );

      }
    };


  /*
   * ========================================
   * CANCEL BACKUP RESTORE
   * ========================================
   */

  const handleCancelBackup =
    () => {

      setSelectedBackup(
        null
      );

      setBackupFilename(
        ''
      );

      setBackupRecordCount(
        0
      );

      setBackupCreatedAt(
        ''
      );

      setRestorePassword(
        ''
      );

      setRestoreConfirmPassword(
        ''
      );

      setError('');
    };


  /*
   * ========================================
   * RESTORE BACKUP
   * ========================================
   */

  const handleRestoreBackup =
    async () => {

      setError('');


      if (!selectedBackup) {

        setError(
          'PLEASE SELECT A BACKUP FILE.'
        );

        return;
      }


      /*
       * Password
       */

      if (!restorePassword) {

        setError(
          'PLEASE ENTER A NEW PASSWORD.'
        );

        return;
      }


      if (
        restorePassword.length < 6
      ) {

        setError(
          'PASSWORD MUST BE AT LEAST 6 CHARACTERS.'
        );

        return;
      }


      if (
        restorePassword !==
        restoreConfirmPassword
      ) {

        setError(
          'PASSWORDS DO NOT MATCH.'
        );

        return;
      }


      try {

        setIsRestoring(
          true
        );


        await restoreBackupAsNewProfile(
          selectedBackup,
          restorePassword
        );


        /*
         * Backup restoration is complete.
         *
         * The profile is already
         * authenticated.
         *
         * Go directly into Gymate.
         */

        router.replace(
          '/(tabs)'
        );

      } catch (error) {

        console.error(
          'Failed to restore Gymate backup:',
          error
        );


        if (
          error instanceof Error
        ) {

          switch (
            error.message
          ) {

            case 'USERNAME_ALREADY_EXISTS':

              setError(
                'A PROFILE WITH THIS BACKUP USERNAME ALREADY EXISTS ON THIS DEVICE.'
              );

              break;


            case 'PASSWORD_REQUIRED':

              setError(
                'PLEASE ENTER A NEW PASSWORD.'
              );

              break;


            case 'PASSWORD_TOO_SHORT':

              setError(
                'PASSWORD MUST BE AT LEAST 6 CHARACTERS.'
              );

              break;


            case 'BACKUP_USERNAME_MISMATCH':

              setError(
                'THE BACKUP USERNAME COULD NOT BE VERIFIED.'
              );

              break;


            case 'PROFILE_NOT_FOUND':

              setError(
                'THE NEW PROFILE COULD NOT BE CREATED.'
              );

              break;


            default:

              setError(
                'COULD NOT RESTORE BACKUP. PLEASE TRY AGAIN.'
              );

          }

        } else {

          setError(
            'COULD NOT RESTORE BACKUP. PLEASE TRY AGAIN.'
          );

        }

      } finally {

        setIsRestoring(
          false
        );

      }
    };


  /*
   * ========================================
   * GO TO LOGIN
   * ========================================
   */

  const handleLogin = () => {

    router.push(
      '/profile/login'
    );
  };


  /*
   * ========================================
   * RESTORE MODE
   * ========================================
   */

  if (selectedBackup) {

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

          {/* HEADER */}

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
              RESTORE BACKUP
            </Text>

            <Text
              style={styles.subtitle}
            >
              RESTORE YOUR JOURNEY
            </Text>

          </View>


          {/* BACKUP CARD */}

          <View
            style={styles.card}
          >

            <Text
              style={styles.sectionTitle}
            >
              BACKUP FOUND
            </Text>


            <View
              style={styles.backupInfo}
            >

              <Text
                style={styles.backupLabel}
              >
                FILE
              </Text>

              <Text
                style={styles.backupValue}
              >
                {backupFilename}
              </Text>


              <Text
                style={styles.backupLabel}
              >
                TRAINER
              </Text>

              <Text
                style={styles.backupValue}
              >
                {selectedBackup.profile.username}
              </Text>


              <Text
                style={styles.backupLabel}
              >
                CREATED
              </Text>

              <Text
                style={styles.backupValue}
              >
                {new Date(
                  backupCreatedAt
                ).toLocaleString()}
              </Text>


              <Text
                style={styles.backupLabel}
              >
                RECORDS
              </Text>

              <Text
                style={styles.backupValue}
              >
                {backupRecordCount}
              </Text>

            </View>


            <View
              style={styles.warningBox}
            >

              <Text
                style={styles.warningTitle}
              >
                NEW DEVICE RESTORE
              </Text>

              <Text
                style={styles.warningText}
              >
                YOUR GYMATE DATA WILL BE
                RESTORED TO THIS DEVICE.
              </Text>

              <Text
                style={styles.warningText}
              >
                YOUR OLD PASSWORD IS NOT
                STORED IN THE BACKUP.
              </Text>

              <Text
                style={styles.warningText}
              >
                CREATE A NEW PASSWORD BELOW.
              </Text>

            </View>


            {/* PASSWORD */}

            <Text
              style={styles.label}
            >
              NEW PASSWORD
            </Text>

            <TextInput
              value={
                restorePassword
              }
              onChangeText={(value) => {

                setRestorePassword(
                  value
                );

                setError('');

              }}
              placeholder="ENTER NEW PASSWORD"
              placeholderTextColor={
                colors.textSecondary
              }
              style={styles.input}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={
                !isRestoring
              }
            />


            {/* CONFIRM PASSWORD */}

            <Text
              style={styles.label}
            >
              CONFIRM PASSWORD
            </Text>

            <TextInput
              value={
                restoreConfirmPassword
              }
              onChangeText={(value) => {

                setRestoreConfirmPassword(
                  value
                );

                setError('');

              }}
              placeholder="RE-ENTER NEW PASSWORD"
              placeholderTextColor={
                colors.textSecondary
              }
              style={styles.input}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={
                !isRestoring
              }
            />


            {/* ERROR */}

            {error ? (

              <View
                style={
                  styles.errorBox
                }
              >

                <Text
                  style={
                    styles.errorText
                  }
                >
                  {error}
                </Text>

              </View>

            ) : null}


            {/* RESTORE BUTTON */}

            <Pressable
              disabled={
                isRestoring
              }
              onPress={
                handleRestoreBackup
              }
              style={({ pressed }) => [

                styles.createButton,

                pressed &&
                  !isRestoring &&
                  styles.buttonPressed,

                isRestoring &&
                  styles.buttonDisabled,

              ]}
            >

              {isRestoring ? (

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
                    RESTORING...
                  </Text>

                </View>

              ) : (

                <Text
                  style={
                    styles.createButtonText
                  }
                >
                  RESTORE BACKUP
                </Text>

              )}

            </Pressable>


            {/* CANCEL */}

            <Pressable
              disabled={
                isRestoring
              }
              onPress={
                handleCancelBackup
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
                CANCEL
              </Text>

            </Pressable>

          </View>


          <View
            style={styles.infoBox}
          >

            <Text
              style={styles.infoTitle}
            >
              PHONE MIGRATION
            </Text>

            <Text
              style={styles.infoText}
            >
              YOUR OLD GYMATE PROFILE ID
              WILL BE MAPPED TO THIS DEVICE.
            </Text>

            <Text
              style={styles.infoText}
            >
              YOUR SAVED WORKOUTS, DIET,
              POKÉMON, XP AND ACTIVITY DATA
              WILL BE RESTORED.
            </Text>

          </View>

        </ScrollView>

      </KeyboardAvoidingView>

    );
  }


  /*
   * ========================================
   * NORMAL CREATE SCREEN
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

        {/* HEADER */}

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


        {/* PROFILE CARD */}

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


        {/* RESTORE */}

        <View
          style={
            styles.restoreSection
          }
        >

          <Text
            style={
              styles.restorePrompt
            }
          >
            MOVING FROM ANOTHER DEVICE?
          </Text>


          <Pressable
            disabled={
              isPickingBackup ||
              isCreating
            }
            onPress={
              handleSelectBackup
            }
            style={({ pressed }) => [

              styles.restoreButton,

              pressed &&
                styles.loginButtonPressed,

              isPickingBackup &&
                styles.buttonDisabled,

            ]}
          >

            {isPickingBackup ? (

              <View
                style={
                  styles.loadingRow
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
                    styles.restoreButtonText
                  }
                >
                  OPENING...
                </Text>

              </View>

            ) : (

              <Text
                style={
                  styles.restoreButtonText
                }
              >
                RESTORE BACKUP
              </Text>

            )}

          </Pressable>

        </View>


        {/* LOGIN */}

        <View
          style={styles.loginSection}
        >

          <Text
            style={styles.loginPrompt}
          >
            ALREADY HAVE AN ACCOUNT?
          </Text>


          <Pressable
            onPress={
              handleLogin
            }
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


        {/* INFO */}

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

const styles =
  StyleSheet.create({

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
      alignItems:
        'center',

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

      textAlign:
        'center',

      marginBottom:
        spacing.sm,
    },


    subtitle: {
      fontFamily:
        'VT323',

      fontSize: 22,

      color:
        colors.textSecondary,

      textAlign:
        'center',
    },


    /* CARD */

    card: {
      backgroundColor:
        colors.surface,

      borderWidth: 2,

      borderColor:
        colors.border,

      padding:
        spacing.lg,
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

      fontFamily:
        'VT323',

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

      padding:
        spacing.md,

      marginBottom:
        spacing.md,
    },


    errorText: {
      fontFamily:
        'VT323',

      fontSize: 19,

      color:
        colors.primary,

      textAlign:
        'center',
    },


    /* CREATE BUTTON */

    createButton: {
      minHeight: 56,

      backgroundColor:
        colors.primary,

      borderWidth: 2,

      borderColor:
        colors.primary,

      alignItems:
        'center',

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

      textAlign:
        'center',
    },


    loadingRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        spacing.sm,
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


    /* RESTORE */

    restoreSection: {
      alignItems:
        'center',

      marginTop:
        spacing.xl,
    },


    restorePrompt: {
      fontFamily:
        'VT323',

      fontSize: 20,

      color:
        colors.textSecondary,

      marginBottom:
        spacing.sm,

      textAlign:
        'center',
    },


    restoreButton: {
      minHeight: 52,

      minWidth: 190,

      borderWidth: 2,

      borderColor:
        colors.primary,

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        spacing.lg,
    },


    restoreButtonText: {
      fontFamily:
        'PressStart2P',

      fontSize: 9,

      color:
        colors.primary,

      textAlign:
        'center',
    },


    /* LOGIN */

    loginSection: {
      alignItems:
        'center',

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

      alignItems:
        'center',

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


    /* BACKUP INFO */

    backupInfo: {
      borderWidth: 2,

      borderColor:
        colors.border,

      padding:
        spacing.md,

      marginBottom:
        spacing.lg,
    },


    backupLabel: {
      fontFamily:
        'PressStart2P',

      fontSize: 8,

      color:
        colors.textSecondary,

      marginBottom:
        spacing.xs,
    },


    backupValue: {
      fontFamily:
        'VT323',

      fontSize: 19,

      color:
        colors.text,

      marginBottom:
        spacing.md,
    },


    warningBox: {
      borderWidth: 2,

      borderColor:
        colors.primary,

      padding:
        spacing.md,

      marginBottom:
        spacing.lg,
    },


    warningTitle: {
      fontFamily:
        'PressStart2P',

      fontSize: 9,

      color:
        colors.primary,

      marginBottom:
        spacing.sm,
    },


    warningText: {
      fontFamily:
        'VT323',

      fontSize: 18,

      color:
        colors.textSecondary,

      lineHeight: 21,

      marginBottom:
        spacing.xs,
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
      fontFamily:
        'VT323',

      fontSize: 18,

      color:
        colors.textSecondary,

      lineHeight: 21,

      marginBottom:
        spacing.xs,
    },

  });