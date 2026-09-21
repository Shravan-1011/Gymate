import React, {
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  router,
} from 'expo-router';

import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  useProfile,
} from '../../context/ProfileContext';

import {
  shareGymateBackup,
  importGymateBackupFile,
  restoreGymateBackup,
} from '../../services/backupFileService';

import type {
  GymateBackup,
} from '../../types/backup';

import {
  colors,
  spacing,
} from '../../constants/theme';

import PixelCard from '../../components/PixelCard';


/*
 * ========================================
 * DATA TRANSFER SCREEN
 * ========================================
 */

export default function DataTransferScreen() {

  const insets =
    useSafeAreaInsets();

  const {
    profile,
  } = useProfile();


  /*
   * ======================================
   * CURRENT PROFILE
   * ======================================
   */

  const profileId =
    profile?.id ?? null;


  /*
   * ======================================
   * STATE
   * ======================================
   */

  const [
    isExporting,
    setIsExporting,
  ] = useState(false);

  const [
    isImporting,
    setIsImporting,
  ] = useState(false);

  const [
    isRestoring,
    setIsRestoring,
  ] = useState(false);

  const [
    selectedBackup,
    setSelectedBackup,
  ] = useState<GymateBackup | null>(
    null
  );

  const [
    selectedFileName,
    setSelectedFileName,
  ] = useState<string | null>(
    null
  );

  const [
    backupRecordCount,
    setBackupRecordCount,
  ] = useState(0);

  const [
    backupCreatedAt,
    setBackupCreatedAt,
  ] = useState<string | null>(
    null
  );


  /*
   * ======================================
   * EXPORT
   * ======================================
   */

  const handleExport =
    async () => {

      if (!profileId) {
        Alert.alert(
          'PROFILE ERROR',
          'No active Gymate profile was found.'
        );

        return;
      }

      try {

        setIsExporting(true);

        await shareGymateBackup(
          profileId
        );

      } catch (error) {

        console.error(
          'Backup export failed:',
          error
        );

        const message =
          error instanceof Error
            ? error.message
            : 'Unable to export backup.';

        Alert.alert(
          'EXPORT FAILED',
          message
        );

      } finally {

        setIsExporting(false);

      }
    };


  /*
   * ======================================
   * IMPORT FILE
   * ======================================
   */

  const handleImport =
    async () => {

      if (!profileId) {
        Alert.alert(
          'PROFILE ERROR',
          'No active Gymate profile was found.'
        );

        return;
      }

      try {

        setIsImporting(true);

        const result =
          await importGymateBackupFile(
            profileId
          );


        setSelectedBackup(
          result.backup
        );

        setSelectedFileName(
          result.fileName
        );

        setBackupRecordCount(
          result.preview.recordCount
        );

        setBackupCreatedAt(
          result.preview.createdAt
        );

      } catch (error) {

        console.error(
          'Backup import failed:',
          error
        );

        const message =
          error instanceof Error
            ? error.message
            : 'Unable to import backup.';

        if (
          message ===
          'BACKUP_IMPORT_CANCELLED'
        ) {
          return;
        }

        Alert.alert(
          'IMPORT FAILED',
          message
        );

      } finally {

        setIsImporting(false);

      }
    };


  /*
   * ======================================
   * CANCEL PREVIEW
   * ======================================
   */

  const cancelRestore =
    () => {

      setSelectedBackup(
        null
      );

      setSelectedFileName(
        null
      );

      setBackupRecordCount(
        0
      );

      setBackupCreatedAt(
        null
      );
    };


  /*
   * ======================================
   * CONFIRM RESTORE
   * ======================================
   */

  const confirmRestore =
    () => {

      if (
        !selectedBackup ||
        !profileId
      ) {
        return;
      }

      Alert.alert(
        'RESTORE GYMATE DATA?',
        [
          'Your current Gymate data will be replaced by the selected backup.',
          '',
          'This includes:',
          '• Workouts',
          '• Diet history',
          '• XP',
          '• Pokémon',
          '• Pokédex',
          '• Gym Badges',
          '• Running history',
          '• Steps',
          '• Activity data',
          '',
          'Your login credentials will NOT be changed.',
        ].join('\n'),
        [
          {
            text: 'CANCEL',
            style: 'cancel',
          },
          {
            text: 'RESTORE',
            style: 'destructive',
            onPress:
              performRestore,
          },
        ]
      );
    };


  /*
   * ======================================
   * RESTORE
   * ======================================
   */

  const performRestore =
    async () => {

      if (
        !selectedBackup ||
        !profileId
      ) {
        return;
      }

      try {

        setIsRestoring(true);

        await restoreGymateBackup(
          profileId,
          selectedBackup
        );

        cancelRestore();

        Alert.alert(
          'RESTORE COMPLETE',
          'Your Gymate data has been restored successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.back();
              },
            },
          ]
        );

      } catch (error) {

        console.error(
          'Backup restore failed:',
          error
        );

        const message =
          error instanceof Error
            ? error.message
            : 'Unable to restore backup.';

        Alert.alert(
          'RESTORE FAILED',
          message
        );

      } finally {

        setIsRestoring(false);

      }
    };


  /*
   * ======================================
   * FORMAT DATE
   * ======================================
   */

  const formatDate =
    (
      value: string | null
    ) => {

      if (!value) {
        return 'UNKNOWN';
      }

      const date =
        new Date(value);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return value;
      }

      return date.toLocaleString();
    };


  /*
   * ======================================
   * NO PROFILE
   * ======================================
   */

  if (!profileId) {

    return (
      <View
        style={[
          styles.container,
          {
            paddingTop:
              insets.top,
          },
        ]}
      >

        <Text
          style={
            styles.profileError
          }
        >
          NO ACTIVE PROFILE
        </Text>

      </View>
    );
  }


  /*
   * ======================================
   * SCREEN
   * ======================================
   */

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop:
            insets.top,
        },
      ]}
    >

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom:
              insets.bottom +
              spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={
          false
        }
      >

        {/* HEADER */}

        <View
          style={
            styles.header
          }
        >

          <Pressable
            onPress={() =>
              router.back()
            }
            style={
              styles.backButton
            }
          >

            <Text
              style={
                styles.backText
              }
            >
              ← BACK
            </Text>

          </Pressable>

          <Text
            style={
              styles.title
            }
          >
            DATA TRANSFER
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            BACKUP & RESTORE
          </Text>

        </View>


        {/* INFO */}

        <PixelCard
          style={
            styles.infoCard
          }
        >

          <Text
            style={
              styles.cardTitle
            }
          >
            GYMATE BACKUP
          </Text>

          <Text
            style={
              styles.cardDescription
            }
          >
            Export your Gymate progress into
            a portable .gymate backup file.
          </Text>

          <Text
            style={
              styles.cardDescription
            }
          >
            Your password and login
            credentials are never included.
          </Text>

        </PixelCard>


        {/* EXPORT */}

        <PixelCard
          style={
            styles.actionCard
          }
        >

          <Text
            style={
              styles.actionIcon
            }
          >
            ↑
          </Text>

          <View
            style={
              styles.actionContent
            }
          >

            <Text
              style={
                styles.actionTitle
              }
            >
              EXPORT BACKUP
            </Text>

            <Text
              style={
                styles.actionDescription
              }
            >
              Create a complete backup of
              your Gymate data.
            </Text>

          </View>

          <Pressable
            disabled={
              isExporting ||
              isImporting ||
              isRestoring
            }
            onPress={
              handleExport
            }
            style={[
              styles.primaryButton,
              (
                isExporting ||
                isImporting ||
                isRestoring
              ) &&
                styles.disabledButton,
            ]}
          >

            {isExporting ? (

              <ActivityIndicator
                color={
                  colors.background
                }
              />

            ) : (

              <Text
                style={
                  styles.primaryButtonText
                }
              >
                EXPORT
              </Text>

            )}

          </Pressable>

        </PixelCard>


        {/* IMPORT */}

        <PixelCard
          style={
            styles.actionCard
          }
        >

          <Text
            style={
              styles.actionIcon
            }
          >
            ↓
          </Text>

          <View
            style={
              styles.actionContent
            }
          >

            <Text
              style={
                styles.actionTitle
              }
            >
              IMPORT BACKUP
            </Text>

            <Text
              style={
                styles.actionDescription
              }
            >
              Restore Gymate data from a
              previously exported backup.
            </Text>

          </View>

          <Pressable
            disabled={
              isExporting ||
              isImporting ||
              isRestoring
            }
            onPress={
              handleImport
            }
            style={[
              styles.secondaryButton,
              (
                isExporting ||
                isImporting ||
                isRestoring
              ) &&
                styles.disabledButton,
            ]}
          >

            {isImporting ? (

              <ActivityIndicator
                color={
                  colors.primary
                }
              />

            ) : (

              <Text
                style={
                  styles.secondaryButtonText
                }
              >
                SELECT FILE
              </Text>

            )}

          </Pressable>

        </PixelCard>


        {/* RESTORE PREVIEW */}

        {selectedBackup && (

          <PixelCard
            style={
              styles.previewCard
            }
          >

            <View
              style={
                styles.warningHeader
              }
            >

              <Text
                style={
                  styles.warningIcon
                }
              >
                !
              </Text>

              <Text
                style={
                  styles.warningTitle
                }
              >
                BACKUP READY
              </Text>

            </View>

            <View
              style={
                styles.divider
              }
            />

            <View
              style={
                styles.detailRow
              }>

              <Text
                style={
                  styles.detailLabel
                }
              >
                FILE
              </Text>

              <Text
                style={
                  styles.detailValue
                }
                numberOfLines={2}
              >
                {
                  selectedFileName ??
                  'UNKNOWN'
                }
              </Text>

            </View>

            <View
              style={
                styles.detailRow
              }>

              <Text
                style={
                  styles.detailLabel
                }
              >
                CREATED
              </Text>

              <Text
                style={
                  styles.detailValue
                }
              >
                {
                  formatDate(
                    backupCreatedAt
                  )
                }
              </Text>

            </View>

            <View
              style={
                styles.detailRow
              }>

              <Text
                style={
                  styles.detailLabel
                }
              >
                RECORDS
              </Text>

              <Text
                style={
                  styles.detailValue
                }
              >
                {
                  backupRecordCount
                }
              </Text>

            </View>

            <View
              style={
                styles.warningBox
              }
            >

              <Text
                style={
                  styles.warningText
                }
              >
                RESTORING THIS BACKUP WILL
                REPLACE YOUR CURRENT GYMATE
                DATA.
              </Text>

            </View>

            <View
              style={
                styles.previewButtons
              }
            >

              <Pressable
                disabled={
                  isRestoring
                }
                onPress={
                  cancelRestore
                }
                style={
                  styles.cancelButton
                }
              >

                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  CANCEL
                </Text>

              </Pressable>

              <Pressable
                disabled={
                  isRestoring
                }
                onPress={
                  confirmRestore
                }
                style={
                  styles.restoreButton
                }
              >

                {isRestoring ? (

                  <ActivityIndicator
                    color={
                      colors.background
                    }
                  />

                ) : (

                  <Text
                    style={
                      styles.restoreButtonText
                    }
                  >
                    RESTORE
                  </Text>

                )}

              </Pressable>

            </View>

          </PixelCard>

        )}


        {/* SAFETY NOTE */}

        <Text
          style={
            styles.footerText
          }
        >
          BACKUPS DO NOT CONTAIN YOUR
          PASSWORD OR LOGIN CREDENTIALS.
        </Text>

      </ScrollView>

    </View>
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
      gap:
        spacing.md,
    },

    header: {
      marginBottom:
        spacing.sm,
    },

    backButton: {
      alignSelf:
        'flex-start',
      marginBottom:
        spacing.md,
      paddingVertical:
        spacing.xs,
    },

    backText: {
      color:
        colors.primary,
      fontSize:
        12,
      fontWeight:
        '900',
      letterSpacing:
        1,
    },

    title: {
      color:
        colors.text,
      fontSize:
        24,
      fontWeight:
        '900',
      letterSpacing:
        1,
    },

    subtitle: {
      color:
        colors.primary,
      fontSize:
        12,
      fontWeight:
        '900',
      letterSpacing:
        1,
      marginTop:
        spacing.xs,
    },

    infoCard: {
      padding:
        spacing.lg,
    },

    cardTitle: {
      color:
        colors.primary,
      fontSize:
        15,
      fontWeight:
        '900',
      letterSpacing:
        1,
      marginBottom:
        spacing.sm,
    },

    cardDescription: {
      color:
        colors.textSecondary,
      fontSize:
        12,
      lineHeight:
        18,
      marginBottom:
        spacing.xs,
    },

    actionCard: {
      padding:
        spacing.lg,
    },

    actionIcon: {
      color:
        colors.primary,
      fontSize:
        32,
      fontWeight:
        '900',
      marginBottom:
        spacing.sm,
    },

    actionContent: {
      marginBottom:
        spacing.md,
    },

    actionTitle: {
      color:
        colors.text,
      fontSize:
        15,
      fontWeight:
        '900',
      letterSpacing:
        1,
      marginBottom:
        spacing.xs,
    },

    actionDescription: {
      color:
        colors.textSecondary,
      fontSize:
        12,
      lineHeight:
        18,
    },

    primaryButton: {
      minHeight:
        48,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        colors.primary,
      paddingHorizontal:
        spacing.lg,
      borderRadius:
        4,
    },

    primaryButtonText: {
      color:
        colors.background,
      fontSize:
        13,
      fontWeight:
        '900',
      letterSpacing:
        1,
    },

    secondaryButton: {
      minHeight:
        48,
      alignItems:
        'center',
      justifyContent:
        'center',
      borderWidth:
        2,
      borderColor:
        colors.primary,
      paddingHorizontal:
        spacing.lg,
      borderRadius:
        4,
    },

    secondaryButtonText: {
      color:
        colors.primary,
      fontSize:
        13,
      fontWeight:
        '900',
      letterSpacing:
        1,
    },

    disabledButton: {
      opacity:
        0.45,
    },

    previewCard: {
      padding:
        spacing.lg,
    },

    warningHeader: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap:
        spacing.sm,
    },

    warningIcon: {
      width:
        28,
      height:
        28,
      textAlign:
        'center',
      textAlignVertical:
        'center',
      color:
        colors.background,
      backgroundColor:
        colors.primary,
      fontSize:
        18,
      fontWeight:
        '900',
      borderRadius:
        2,
    },

    warningTitle: {
      color:
        colors.text,
      fontSize:
        15,
      fontWeight:
        '900',
      letterSpacing:
        1,
    },

    divider: {
      height:
        1,
      backgroundColor:
        colors.border,
      marginVertical:
        spacing.md,
    },

    detailRow: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      gap:
        spacing.md,
      marginBottom:
        spacing.md,
    },

    detailLabel: {
      color:
        colors.textSecondary,
      fontSize:
        10,
      fontWeight:
        '900',
      letterSpacing:
        1,
    },

    detailValue: {
      flex:
        1,
      textAlign:
        'right',
      color:
        colors.text,
      fontSize:
        11,
      fontWeight:
        '700',
    },

    warningBox: {
      borderWidth:
        1,
      borderColor:
        colors.primary,
      padding:
        spacing.md,
      marginBottom:
        spacing.md,
    },

    warningText: {
      color:
        colors.primary,
      fontSize:
        10,
      fontWeight:
        '900',
      lineHeight:
        16,
      textAlign:
        'center',
      letterSpacing:
        0.5,
    },

    previewButtons: {
      flexDirection:
        'row',
      gap:
        spacing.sm,
    },

    cancelButton: {
      flex:
        1,
      minHeight:
        48,
      alignItems:
        'center',
      justifyContent:
        'center',
      borderWidth:
        1,
      borderColor:
        colors.border,
      borderRadius:
        4,
    },

    cancelButtonText: {
      color:
        colors.textSecondary,
      fontSize:
        11,
      fontWeight:
        '900',
      letterSpacing:
        1,
    },

    restoreButton: {
      flex:
        1,
      minHeight:
        48,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        colors.primary,
      borderRadius:
        4,
    },

    restoreButtonText: {
      color:
        colors.background,
      fontSize:
        11,
      fontWeight:
        '900',
      letterSpacing:
        1,
    },

    footerText: {
      color:
        colors.textSecondary,
      fontSize:
        9,
      fontWeight:
        '700',
      lineHeight:
        14,
      textAlign:
        'center',
      marginTop:
        spacing.sm,
      opacity:
        0.7,
    },

    profileError: {
      color:
        colors.primary,
      fontSize:
        14,
      fontWeight:
        '900',
      textAlign:
        'center',
      marginTop:
        spacing.xl,
    },

  });