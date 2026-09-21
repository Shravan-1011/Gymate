import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { workoutSplits } from '../../data/workoutSplits';
import {
  colors,
  spacing,
} from '../../constants/theme';

export default function WorkoutSplitScreen() {
  /*
   * ========================================
   * SELECT SPLIT
   * ========================================
   *
   * Once the user chooses a split, we open
   * the existing workout screen for that split.
   */

  const handleSelectSplit = (
    splitId: string
  ) => {
    router.push({
      pathname: '/workout/[splitId]',
      params: {
        splitId,
      },
    });
  };

  /*
   * ========================================
   * BACK
   * ========================================
   */

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
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
            BACK
            ==================================== */}

        <Pressable
          style={styles.backRow}
          onPress={handleBack}
        >
          <Text style={styles.backArrow}>
            ‹
          </Text>

          <Text style={styles.backText}>
            BACK
          </Text>
        </Pressable>

        {/* ====================================
            HEADER
            ==================================== */}

        <View style={styles.header}>
          <Text style={styles.heading}>
            START WORKOUT
          </Text>

          <Text style={styles.subheading}>
            CHOOSE YOUR SPLIT
          </Text>

          <Text style={styles.description}>
            SELECT HOW YOU WANT TO TRAIN TODAY
          </Text>
        </View>

        {/* ====================================
            SPLITS
            ==================================== */}

        <View style={styles.splitSection}>
          <Text style={styles.sectionLabel}>
            AVAILABLE SPLITS
          </Text>

          <View style={styles.splitList}>
            {workoutSplits.map((split) => (
              <Pressable
                key={split.id}
                style={({ pressed }) => [
                  styles.splitCard,
                  pressed &&
                    styles.splitCardPressed,
                ]}
                onPress={() =>
                  handleSelectSplit(
                    split.id
                  )
                }
              >
                <View style={styles.splitInfo}>
                  <Text style={styles.splitName}>
                    {split.name}
                  </Text>

                  <Text
                    style={
                      styles.splitDescription
                    }
                  >
                    {split.shortDescription}
                  </Text>

                  {/* ====================================
                      TARGET MUSCLES
                      ==================================== */}

                  {split.targetMuscles &&
                    split.targetMuscles.length >
                      0 && (
                      <Text
                        style={
                          styles.targetMuscles
                        }
                      >
                        {split.targetMuscles
                          .map((muscle) =>
                            muscle
                              .replace(
                                '-',
                                ' '
                              )
                              .toUpperCase()
                          )
                          .join(' • ')}
                      </Text>
                    )}
                </View>

                <View
                  style={
                    styles.arrowContainer
                  }
                >
                  <Text style={styles.arrow}>
                    ›
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ====================================
            FOOTER
            ==================================== */}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            CHOOSE YOUR BATTLE.
          </Text>

          <Text style={styles.footerSubtext}>
            YOUR WORKOUT STARTS HERE.
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
     BACK
     ======================================== */

  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  backArrow: {
    fontFamily: 'VT323',
    fontSize: 36,
    color: colors.primary,
    marginRight: spacing.sm,
  },

  backText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: colors.textSecondary,
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
    marginBottom: spacing.md,
  },

  subheading: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: colors.text,
    marginBottom: spacing.sm,
  },

  description: {
    fontFamily: 'VT323',
    fontSize: 20,
    color: colors.textSecondary,
  },

  /* ========================================
     SPLITS
     ======================================== */

  splitSection: {
    marginBottom: spacing.xl,
  },

  sectionLabel: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },

  splitList: {
    gap: spacing.md,
  },

  splitCard: {
    minHeight: 100,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,

    backgroundColor: colors.surface,

    borderWidth: 2,
    borderColor: colors.border,
  },

  splitCardPressed: {
    opacity: 0.65,

    transform: [
      {
        translateX: 2,
      },
    ],
  },

  splitInfo: {
    flex: 1,
    paddingRight: spacing.md,
  },

  splitName: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: colors.text,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },

  splitDescription: {
    fontFamily: 'VT323',
    fontSize: 20,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 21,
  },

  targetMuscles: {
    fontFamily: 'VT323',
    fontSize: 16,
    color: colors.primary,
    lineHeight: 18,
  },

  /* ========================================
     ARROW
     ======================================== */

  arrowContainer: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrow: {
    fontFamily: 'VT323',
    fontSize: 36,
    color: colors.primary,
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
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },

  footerSubtext: {
    fontFamily: 'VT323',
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});