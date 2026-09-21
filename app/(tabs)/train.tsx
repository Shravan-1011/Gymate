import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  colors,
  spacing,
} from '../../constants/theme';

export default function TrainScreen() {
  /*
   * ========================================
   * START WORKOUT
   * ========================================
   *
   * Opens the existing split-selection
   * screen.
   *
   * We keep the split selection logic inside
   * the workout route instead of duplicating
   * it here.
   */

  const handleStartWorkout = () => {
    router.push('/workout');
  };

  /*
   * ========================================
   * OPEN HISTORY
   * ========================================
   */

  const handleOpenHistory = () => {
    router.push('/workout/history');
  };

  /*
   * ========================================
   * OPEN PROGRESS
   * ========================================
   */

  const handleOpenProgress = () => {
    router.push('/progress');
  };

  /*
   * ========================================
   * SCREEN
   * ========================================
   */

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ====================================
            HEADER
            ==================================== */}

        <View style={styles.header}>
          <Text style={styles.heading}>
            TRAIN
          </Text>

          <Text style={styles.subheading}>
            BUILD STRENGTH. TRACK PROGRESS.
          </Text>
        </View>

        {/* ====================================
            MAIN ACTIONS
            ==================================== */}

        <View style={styles.actionSection}>
          <Text style={styles.sectionLabel}>
            WORKOUT
          </Text>

          {/* START WORKOUT */}

          <Pressable
            style={({ pressed }) => [
              styles.primaryCard,
              pressed && styles.cardPressed,
            ]}
            onPress={handleStartWorkout}
          >
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>
                ▶
              </Text>
            </View>

            <View style={styles.cardInfo}>
              <Text style={styles.primaryTitle}>
                START WORKOUT
              </Text>

              <Text style={styles.primaryDescription}>
                CHOOSE A SPLIT AND START TRAINING
              </Text>
            </View>

            <Text style={styles.arrow}>
              ›
            </Text>
          </Pressable>
        </View>

        {/* ====================================
            TRACKING
            ==================================== */}

        <View style={styles.trackingSection}>
          <Text style={styles.sectionLabel}>
            TRACK YOUR TRAINING
          </Text>

          {/* HISTORY */}

          <Pressable
            style={({ pressed }) => [
              styles.trackingCard,
              pressed && styles.cardPressed,
            ]}
            onPress={handleOpenHistory}
          >
            <View style={styles.cardIconContainer}>
              <Text style={styles.trackingIcon}>
                ◷
              </Text>
            </View>

            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>
                WORKOUT HISTORY
              </Text>

              <Text style={styles.cardDescription}>
                REVIEW YOUR PREVIOUS SESSIONS
              </Text>
            </View>

            <Text style={styles.arrow}>
              ›
            </Text>
          </Pressable>

          {/* PROGRESS */}

          <Pressable
            style={({ pressed }) => [
              styles.trackingCard,
              pressed && styles.cardPressed,
            ]}
            onPress={handleOpenProgress}
          >
            <View style={styles.cardIconContainer}>
              <Text style={styles.trackingIcon}>
                ↗
              </Text>
            </View>

            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>
                PROGRESS
              </Text>

              <Text style={styles.cardDescription}>
                SEE YOUR STATS AND PERFORMANCE
              </Text>
            </View>

            <Text style={styles.arrow}>
              ›
            </Text>
          </Pressable>
        </View>

        {/* ====================================
            FOOTER
            ==================================== */}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            EVERY WORKOUT COUNTS.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 140,
  },

  /* ========================================
     HEADER
     ======================================== */

  header: {
    marginBottom: spacing.xl,
  },

  heading: {
    fontFamily: 'PressStart2P',
    fontSize: 18,
    color: colors.primary,
    marginBottom: spacing.sm,
  },

  subheading: {
    fontFamily: 'VT323',
    fontSize: 21,
    color: colors.textSecondary,
  },

  /* ========================================
     SECTIONS
     ======================================== */

  actionSection: {
    marginBottom: spacing.xl,
  },

  trackingSection: {
    marginBottom: spacing.xl,
  },

  sectionLabel: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },

  /* ========================================
     PRIMARY START CARD
     ======================================== */

  primaryCard: {
    minHeight: 110,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,

    backgroundColor: colors.surface,

    borderWidth: 2,
    borderColor: colors.primary,
  },

  primaryTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: colors.primary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },

  primaryDescription: {
    fontFamily: 'VT323',
    fontSize: 19,
    color: colors.textSecondary,
    lineHeight: 21,
  },

  /* ========================================
     TRACKING CARDS
     ======================================== */

  trackingCard: {
    minHeight: 92,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,

    marginBottom: spacing.md,

    backgroundColor: colors.surface,

    borderWidth: 2,
    borderColor: colors.border,
  },

  cardInfo: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },

  cardTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 11,
    color: colors.text,
    marginBottom: spacing.sm,
    lineHeight: 17,
  },

  cardDescription: {
    fontFamily: 'VT323',
    fontSize: 19,
    color: colors.textSecondary,
    lineHeight: 21,
  },

  /* ========================================
     ICONS
     ======================================== */

  cardIconContainer: {
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardIcon: {
    fontFamily: 'VT323',
    fontSize: 30,
    color: colors.primary,
  },

  trackingIcon: {
    fontFamily: 'VT323',
    fontSize: 34,
    color: colors.primary,
  },

  /* ========================================
     ARROW
     ======================================== */

  arrow: {
    fontFamily: 'VT323',
    fontSize: 36,
    color: colors.primary,
  },

  /* ========================================
     PRESS
     ======================================== */

  cardPressed: {
    opacity: 0.65,

    transform: [
      {
        translateX: 2,
      },
    ],
  },

  /* ========================================
     FOOTER
     ======================================== */

  footer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },

  footerText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: colors.textSecondary,
    opacity: 0.6,
  },
});