import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useState } from 'react';

import {
  colors,
  spacing,
} from '../../constants/theme';

import { workoutSplits } from '../../data/workoutSplits';

type ProgramType =
  | 'ppl'
  | 'upper-lower'
  | null;

export default function WorkoutSplitScreen() {
  const [expandedProgram, setExpandedProgram] =
    useState<ProgramType>(null);

  // ========================================
  // FIND SPLIT
  // ========================================

  const getSplit = (id: string) =>
    workoutSplits.find(
      (split) => split.id === id
    );

  // ========================================
  // OPEN ACTUAL WORKOUT SPLIT
  // ========================================

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

  // ========================================
  // TOGGLE PROGRAM
  // ========================================

  const toggleProgram = (
    program: ProgramType
  ) => {
    setExpandedProgram((current) =>
      current === program
        ? null
        : program
    );
  };

  // ========================================
  // BACK
  // ========================================

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  // ========================================
  // SPLIT CARD
  // ========================================

  const renderSplitCard = (
    splitId: string
  ) => {
    const split = getSplit(splitId);

    if (!split) {
      return null;
    }

    return (
      <Pressable
        key={split.id}
        style={({ pressed }) => [
          styles.splitCard,
          pressed &&
            styles.splitCardPressed,
        ]}
        onPress={() =>
          handleSelectSplit(split.id)
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

          {split.targetMuscles.length >
            0 && (
            <Text
              style={
                styles.targetMuscles
              }
            >
              {split.targetMuscles
                .map((muscle) =>
                  muscle
                    .replace(/-/g, ' ')
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
    );
  };

  // ========================================
  // PROGRAM CARD
  // ========================================

  const renderProgramCard = (
    type: 'ppl' | 'upper-lower',
    title: string,
    description: string,
    days: string[]
  ) => {
    const expanded =
      expandedProgram === type;

    return (
      <View
        key={type}
        style={styles.programWrapper}
      >
        <Pressable
          style={({ pressed }) => [
            styles.programCard,
            expanded &&
              styles.programCardExpanded,
            pressed &&
              styles.programCardPressed,
          ]}
          onPress={() =>
            toggleProgram(type)
          }
        >
          <View
            style={
              styles.programInfo
            }
          >
            <Text
              style={
                styles.programName
              }
            >
              {title}
            </Text>

            <Text
              style={
                styles.programDescription
              }
            >
              {description}
            </Text>

            <Text
              style={
                styles.programDays
              }
            >
              {days.join(' • ')}
            </Text>
          </View>

          <Text
            style={
              styles.programArrow
            }
          >
            {expanded ? '⌄' : '›'}
          </Text>
        </Pressable>

        {expanded && (
          <View
            style={
              styles.daySelection
            }
          >
            <Text
              style={
                styles.daySelectionLabel
              }
            >
              CHOOSE TODAY'S WORKOUT
            </Text>

            <View
              style={
                styles.dayList
              }
            >
              {days.map((day) => {
                const splitId =
                  day === 'PUSH'
                    ? 'push'
                    : day === 'PULL'
                      ? 'pull'
                      : day === 'LEGS'
                        ? 'legs'
                        : day ===
                            'UPPER BODY'
                          ? 'upper'
                          : 'lower';

                const split =
                  getSplit(splitId);

                if (!split) {
                  return null;
                }

                return (
                  <Pressable
                    key={splitId}
                    style={({
                      pressed,
                    }) => [
                      styles.dayCard,
                      pressed &&
                        styles.dayCardPressed,
                    ]}
                    onPress={() =>
                      handleSelectSplit(
                        splitId
                      )
                    }
                  >
                    <View>
                      <Text
                        style={
                          styles.dayName
                        }
                      >
                        {split.name}
                      </Text>

                      <Text
                        style={
                          styles.dayDescription
                        }
                      >
                        {
                          split.shortDescription
                        }
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.dayArrow
                      }
                    >
                      ›
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>
    );
  };

  // ========================================
  // SCREEN
  // ========================================

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* BACK */}

        <Pressable
          style={styles.backRow}
          onPress={handleBack}
        >
          <Text
            style={styles.backArrow}
          >
            ‹
          </Text>

          <Text
            style={styles.backText}
          >
            BACK
          </Text>
        </Pressable>

        {/* HEADER */}

        <View style={styles.header}>
          <Text style={styles.heading}>
            START WORKOUT
          </Text>

          <Text
            style={styles.subheading}
          >
            CHOOSE YOUR SPLIT
          </Text>

          <Text
            style={styles.description}
          >
            SELECT HOW YOU WANT TO
            TRAIN TODAY
          </Text>
        </View>

        {/* ==================================
            STANDARD
            ================================== */}

        <View
          style={styles.section}
        >
          <Text
            style={styles.sectionLabel}
          >
            STANDARD
          </Text>

          <View
            style={styles.cardList}
          >
            {renderProgramCard(
              'ppl',
              'PUSH / PULL / LEGS',
              'Classic 3-day training split',
              [
                'PUSH',
                'PULL',
                'LEGS',
              ]
            )}

            {renderProgramCard(
              'upper-lower',
              'UPPER / LOWER BODY',
              'Classic 2-day training split',
              [
                'UPPER BODY',
                'LOWER BODY',
              ]
            )}
          </View>
        </View>

        {/* ==================================
            BRO SPLITS
            ================================== */}

        <View
          style={styles.section}
        >
          <Text
            style={styles.sectionLabel}
          >
            BRO SPLITS
          </Text>

          <View
            style={styles.cardList}
          >
            {renderSplitCard(
              'chest-triceps'
            )}

            {renderSplitCard(
              'back-biceps'
            )}

            {renderSplitCard(
              'legs-shoulders'
            )}
          </View>
        </View>

        {/* ==================================
            INDIVIDUAL MUSCLE
            ================================== */}

        <View
          style={styles.section}
        >
          <Text
            style={styles.sectionLabel}
          >
            INDIVIDUAL MUSCLE
          </Text>

          <View
            style={styles.cardList}
          >
            {renderSplitCard('chest')}

            {renderSplitCard('back')}

            {renderSplitCard(
              'shoulders'
            )}

            {renderSplitCard('biceps')}

            {renderSplitCard(
              'triceps'
            )}

            {renderSplitCard(
              'forearms'
            )}

            {renderSplitCard('quads')}

            {renderSplitCard(
              'hamstrings'
            )}

            {renderSplitCard('glutes')}

            {renderSplitCard('calves')}

            {renderSplitCard('abs')}

            {renderSplitCard(
              'hip-flexors'
            )}
          </View>
        </View>

        {/* FOOTER */}

        <View style={styles.footer}>
          <Text
            style={styles.footerText}
          >
            CHOOSE YOUR BATTLE.
          </Text>

          <Text
            style={styles.footerSubtext}
          >
            YOUR WORKOUT STARTS HERE.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      colors.background,
  },

  content: {
    paddingHorizontal:
      spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 140,
  },

  // ======================================
  // BACK
  // ======================================

  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom:
      spacing.xl,
  },

  backArrow: {
    fontFamily: 'VT323',
    fontSize: 36,
    color: colors.primary,
    marginRight:
      spacing.sm,
  },

  backText: {
    fontFamily:
      'PressStart2P',
    fontSize: 10,
    color:
      colors.textSecondary,
  },

  // ======================================
  // HEADER
  // ======================================

  header: {
    marginBottom:
      spacing.xl,
  },

  heading: {
    fontFamily:
      'PressStart2P',
    fontSize: 18,
    color: colors.primary,
    marginBottom:
      spacing.md,
  },

  subheading: {
    fontFamily:
      'PressStart2P',
    fontSize: 12,
    color: colors.text,
    marginBottom:
      spacing.sm,
  },

  description: {
    fontFamily: 'VT323',
    fontSize: 20,
    color:
      colors.textSecondary,
    lineHeight: 22,
  },

  // ======================================
  // SECTION
  // ======================================

  section: {
    marginBottom:
      spacing.xl,
  },

  sectionLabel: {
    fontFamily:
      'PressStart2P',
    fontSize: 9,
    color:
      colors.textSecondary,
    marginBottom:
      spacing.md,
  },

  cardList: {
    gap: spacing.md,
  },

  // ======================================
  // PROGRAM CARD
  // ======================================

  programWrapper: {
    width: '100%',
  },

  programCard: {
    minHeight: 96,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',

    paddingHorizontal:
      spacing.md,
    paddingVertical:
      spacing.md,

    backgroundColor:
      colors.surface,

    borderWidth: 2,
    borderColor:
      colors.border,
  },

  programCardExpanded: {
    borderColor:
      colors.primary,
  },

  programCardPressed: {
    opacity: 0.65,

    transform: [
      {
        translateX: 2,
      },
    ],
  },

  programInfo: {
    flex: 1,
    paddingRight:
      spacing.md,
  },

  programName: {
    fontFamily:
      'PressStart2P',
    fontSize: 11,
    color: colors.text,
    marginBottom:
      spacing.sm,
    lineHeight: 17,
  },

  programDescription: {
    fontFamily: 'VT323',
    fontSize: 20,
    color:
      colors.textSecondary,
    marginBottom:
      spacing.sm,
  },

  programDays: {
    fontFamily: 'VT323',
    fontSize: 16,
    color: colors.primary,
  },

  programArrow: {
    fontFamily: 'VT323',
    fontSize: 32,
    color: colors.primary,
    width: 28,
    textAlign: 'center',
  },

  // ======================================
  // DAY SELECTION
  // ======================================

  daySelection: {
    marginTop: -2,

    paddingHorizontal:
      spacing.md,
    paddingVertical:
      spacing.md,

    backgroundColor:
      colors.background,

    borderWidth: 2,
    borderTopWidth: 0,
    borderColor:
      colors.primary,
  },

  daySelectionLabel: {
    fontFamily:
      'PressStart2P',
    fontSize: 8,
    color:
      colors.textSecondary,
    marginBottom:
      spacing.md,
  },

  dayList: {
    gap: spacing.sm,
  },

  dayCard: {
    minHeight: 64,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',

    paddingHorizontal:
      spacing.md,

    backgroundColor:
      colors.surface,

    borderWidth: 1,
    borderColor:
      colors.border,
  },

  dayCardPressed: {
    opacity: 0.65,
  },

  dayName: {
    fontFamily:
      'PressStart2P',
    fontSize: 10,
    color: colors.primary,
    marginBottom:
      spacing.xs,
  },

  dayDescription: {
    fontFamily: 'VT323',
    fontSize: 18,
    color:
      colors.textSecondary,
  },

  dayArrow: {
    fontFamily: 'VT323',
    fontSize: 30,
    color: colors.primary,
  },

  // ======================================
  // NORMAL SPLIT CARD
  // ======================================

  splitCard: {
    minHeight: 96,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',

    paddingHorizontal:
      spacing.md,
    paddingVertical:
      spacing.md,

    backgroundColor:
      colors.surface,

    borderWidth: 2,
    borderColor:
      colors.border,
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
    paddingRight:
      spacing.md,
  },

  splitName: {
    fontFamily:
      'PressStart2P',
    fontSize: 11,
    color: colors.text,
    marginBottom:
      spacing.sm,
    lineHeight: 17,
  },

  splitDescription: {
    fontFamily: 'VT323',
    fontSize: 20,
    color:
      colors.textSecondary,
    marginBottom:
      spacing.sm,
    lineHeight: 21,
  },

  targetMuscles: {
    fontFamily: 'VT323',
    fontSize: 16,
    color: colors.primary,
    lineHeight: 18,
  },

  arrowContainer: {
    width: 28,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  arrow: {
    fontFamily: 'VT323',
    fontSize: 32,
    color: colors.primary,
  },

  // ======================================
  // FOOTER
  // ======================================

  footer: {
    alignItems: 'center',
    paddingTop:
      spacing.md,
  },

  footerText: {
    fontFamily:
      'PressStart2P',
    fontSize: 9,
    color: colors.primary,
    marginBottom:
      spacing.sm,
  },

  footerSubtext: {
    fontFamily: 'VT323',
    fontSize: 18,
    color:
      colors.textSecondary,
  },
});