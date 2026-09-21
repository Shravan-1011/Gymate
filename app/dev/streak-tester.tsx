import React, {
  useMemo,
  useState,
} from 'react';

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  calculateNextStreak,
  getDateDifferenceInDays,
  type ProfileProgression,
} from '../../database/progressionRepository';

import {
  STREAK_SHARD_INTERVAL_DAYS,
  STREAK_SHARD_REWARD,
} from '../../data/pokemonConfig';

/*
 * ========================================
 * TEMPORARY DEVELOPER STREAK TESTER
 * ========================================
 *
 * This screen is intentionally isolated.
 *
 * IMPORTANT:
 *
 * It does NOT modify:
 *
 *   - profile_progression
 *   - XP transactions
 *   - Pokéball shards
 *   - real streak data
 *
 * It simulates the exact streak rules
 * using the real calculateNextStreak()
 * function and the real Pokémon config.
 *
 * Remove this file after streak testing
 * is complete.
 * ========================================
 */

type SimulationDay = {
  day: number;
  date: string;
  streak: number;
  streakXP: number;
  shards: number;
  active: boolean;
  milestone: boolean;
  note: string;
};

function formatDate(date: Date): string {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, '0');

  const day =
    String(
      date.getDate()
    ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function addDays(
  dateString: string,
  days: number
): string {
  const date =
    new Date(
      `${dateString}T00:00:00`
    );

  date.setDate(
    date.getDate() + days
  );

  return formatDate(date);
}

function getStreakXP(
  streak: number
): number {
  return Math.min(
    streak * 10,
    100
  );
}

function createInitialProgression(
  date: string
): ProfileProgression {
  return {
    profileId:
      'developer-test-profile',

    totalXP: 0,

    currentStreak: 0,

    longestStreak: 0,

    lastActivityDate:
      null,

    createdAt:
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString(),
  };
}

export default function StreakTesterScreen() {
  const initialDate =
    useMemo(
      () => formatDate(new Date()),
      []
    );

  const [simulationDate, setSimulationDate] =
    useState(initialDate);

  const [progression, setProgression] =
    useState<ProfileProgression>(
      () =>
        createInitialProgression(
          initialDate
        )
    );

  const [totalStreakXP, setTotalStreakXP] =
    useState(0);

  const [totalShards, setTotalShards] =
    useState(0);

  const [history, setHistory] =
    useState<SimulationDay[]>([]);

  /*
   * ========================================
   * CURRENT STREAK XP
   * ========================================
   */

  const currentStreakXP =
    getStreakXP(
      progression.currentStreak
    );

  /*
   * ========================================
   * MILESTONE STATUS
   * ========================================
   */

  const nextMilestone =
    progression.currentStreak <= 0
      ? STREAK_SHARD_INTERVAL_DAYS
      : (
          Math.floor(
            progression.currentStreak /
              STREAK_SHARD_INTERVAL_DAYS
          ) + 1
        ) *
        STREAK_SHARD_INTERVAL_DAYS;

  /*
   * ========================================
   * SIMULATE ACTIVE DAY
   * ========================================
   *
   * This represents:
   *
   *   qualifying activity
   *        ↓
   *   markDayActive()
   *        ↓
   *   awardDailyStreakXP()
   *
   * without touching the database.
   * ========================================
   */

  const simulateActiveDay = (
    date: string,
    label?: string
  ) => {
    setProgression(
      previous => {
        /*
         * Use the real production
         * calculateNextStreak()
         * function.
         */
        const nextStreak =
          calculateNextStreak(
            previous,
            date
          );

        const isSameDay =
          previous.lastActivityDate ===
          date;

        const difference =
          previous.lastActivityDate
            ? getDateDifferenceInDays(
                previous.lastActivityDate,
                date
              )
            : null;

        /*
         * Same-day activity:
         *
         * The streak must NOT increase.
         *
         * Also no additional streak XP.
         */
        if (isSameDay) {
          Alert.alert(
            'Same Day',
            'This day is already active. No additional streak XP is awarded.'
          );

          return previous;
        }

        const streakXP =
          getStreakXP(
            nextStreak
          );

        const milestone =
          nextStreak %
            STREAK_SHARD_INTERVAL_DAYS ===
          0;

        const shards =
          milestone
            ? STREAK_SHARD_REWARD
            : 0;

        const newTotalXP =
          totalStreakXP +
          streakXP;

        const newTotalShards =
          totalShards +
          shards;

        setTotalStreakXP(
          newTotalXP
        );

        setTotalShards(
          newTotalShards
        );

        setHistory(
          previousHistory => [
            ...previousHistory,
            {
              day:
                nextStreak,

              date,

              streak:
                nextStreak,

              streakXP,

              shards,

              active: true,

              milestone,

              note:
                label ??
                (
                  difference === null
                    ? 'First qualifying activity'
                    : difference === 1
                      ? 'Consecutive day'
                      : 'Streak reset after missed day'
                ),
            },
          ]
        );

        return {
          ...previous,

          currentStreak:
            nextStreak,

          longestStreak:
            Math.max(
              previous.longestStreak,
              nextStreak
            ),

          lastActivityDate:
            date,

          totalXP:
            previous.totalXP +
            streakXP,

          updatedAt:
            new Date().toISOString(),
        };
      }
    );

    setSimulationDate(
      date
    );
  };

  /*
   * ========================================
   * SIMULATE NEXT DAY
   * ========================================
   */

  const simulateNextDay = () => {
    const nextDate =
      addDays(
        simulationDate,
        1
      );

    simulateActiveDay(
      nextDate
    );
  };

  /*
   * ========================================
   * SIMULATE MISSED DAY
   * ========================================
   *
   * Move forward two days and perform
   * an activity.
   *
   * Example:
   *
   * Day 3
   * ↓
   * Day 4 missed
   * ↓
   * Day 5 activity
   * ↓
   * streak = 1
   * ========================================
   */

  const simulateMissedDay = () => {
    const missedDate =
      addDays(
        simulationDate,
        1
      );

    const activeDate =
      addDays(
        simulationDate,
        2
      );

    setSimulationDate(
      missedDate
    );

    simulateActiveDay(
      activeDate,
      'Missed one calendar day → streak reset'
    );
  };

  /*
   * ========================================
   * JUMP TO DAY 7
   * ========================================
   *
   * Useful for checking the shard
   * milestone quickly.
   * ========================================
   */

  const simulateToDay7 = () => {
    resetSimulation(false);

    let currentDate =
      initialDate;

    let simulatedProgression =
      createInitialProgression(
        initialDate
      );

    let simulatedXP = 0;
    let simulatedShards = 0;

    const generatedHistory: SimulationDay[] =
      [];

    for (
      let day = 1;
      day <= 7;
      day++
    ) {
      const nextDate =
        day === 1
          ? currentDate
          : addDays(
              currentDate,
              1
            );

      const nextStreak =
        calculateNextStreak(
          simulatedProgression,
          nextDate
        );

      const streakXP =
        getStreakXP(
          nextStreak
        );

      const milestone =
        nextStreak %
          STREAK_SHARD_INTERVAL_DAYS ===
        0;

      const shards =
        milestone
          ? STREAK_SHARD_REWARD
          : 0;

      simulatedXP +=
        streakXP;

      simulatedShards +=
        shards;

      generatedHistory.push({
        day:
          nextStreak,

        date:
          nextDate,

        streak:
          nextStreak,

        streakXP,

        shards,

        active: true,

        milestone,

        note:
          day === 1
            ? 'First qualifying activity'
            : 'Consecutive day',
      });

      simulatedProgression = {
        ...simulatedProgression,

        currentStreak:
          nextStreak,

        longestStreak:
          Math.max(
            simulatedProgression.longestStreak,
            nextStreak
          ),

        lastActivityDate:
          nextDate,

        totalXP:
          simulatedXP,

        updatedAt:
          new Date().toISOString(),
      };

      currentDate =
        nextDate;
    }

    setProgression(
      simulatedProgression
    );

    setSimulationDate(
      currentDate
    );

    setTotalStreakXP(
      simulatedXP
    );

    setTotalShards(
      simulatedShards
    );

    setHistory(
      generatedHistory
    );
  };

  /*
   * ========================================
   * JUMP TO DAY 10
   * ========================================
   */

  const simulateToDay10 = () => {
    resetSimulation(false);

    let currentDate =
      initialDate;

    let simulatedProgression =
      createInitialProgression(
        initialDate
      );

    let simulatedXP = 0;
    let simulatedShards = 0;

    const generatedHistory: SimulationDay[] =
      [];

    for (
      let day = 1;
      day <= 10;
      day++
    ) {
      const nextDate =
        day === 1
          ? currentDate
          : addDays(
              currentDate,
              1
            );

      const nextStreak =
        calculateNextStreak(
          simulatedProgression,
          nextDate
        );

      const streakXP =
        getStreakXP(
          nextStreak
        );

      const milestone =
        nextStreak %
          STREAK_SHARD_INTERVAL_DAYS ===
        0;

      const shards =
        milestone
          ? STREAK_SHARD_REWARD
          : 0;

      simulatedXP +=
        streakXP;

      simulatedShards +=
        shards;

      generatedHistory.push({
        day:
          nextStreak,

        date:
          nextDate,

        streak:
          nextStreak,

        streakXP,

        shards,

        active: true,

        milestone,

        note:
          day === 1
            ? 'First qualifying activity'
            : 'Consecutive day',
      });

      simulatedProgression = {
        ...simulatedProgression,

        currentStreak:
          nextStreak,

        longestStreak:
          Math.max(
            simulatedProgression.longestStreak,
            nextStreak
          ),

        lastActivityDate:
          nextDate,

        totalXP:
          simulatedXP,

        updatedAt:
          new Date().toISOString(),
      };

      currentDate =
        nextDate;
    }

    setProgression(
      simulatedProgression
    );

    setSimulationDate(
      currentDate
    );

    setTotalStreakXP(
      simulatedXP
    );

    setTotalShards(
      simulatedShards
    );

    setHistory(
      generatedHistory
    );
  };

  /*
   * ========================================
   * RESET
   * ========================================
   */

  const resetSimulation = (
    showAlert = true
  ) => {
    const resetProgression =
      createInitialProgression(
        initialDate
      );

    setSimulationDate(
      initialDate
    );

    setProgression(
      resetProgression
    );

    setTotalStreakXP(
      0
    );

    setTotalShards(
      0
    );

    setHistory(
      []
    );

    if (showAlert) {
      Alert.alert(
        'Reset',
        'Developer streak simulation has been reset.'
      );
    }
  };

  /*
   * ========================================
   * RUN FULL 20-DAY TEST
   * ========================================
   *
   * This is the main test.
   *
   * Expected:
   *
   * Day 1  → 10 XP
   * Day 2  → 20 XP
   * ...
   * Day 7  → 70 XP + 3 shards
   * ...
   * Day 10 → 100 XP
   * ...
   * Day 14 → 100 XP + 3 shards
   * Day 20 → 100 XP
   *
   * Total streak XP:
   *
   * 10+20+30+40+50+60+70
   * +80+90+100
   * +100×10
   *
   * = 1,350 XP
   *
   * Shards:
   *
   * Day 7 + Day 14
   * = 6 shards
   * ========================================
   */

  const simulate20Days = () => {
    resetSimulation(false);

    let currentDate =
      initialDate;

    let simulatedProgression =
      createInitialProgression(
        initialDate
      );

    let simulatedXP = 0;
    let simulatedShards = 0;

    const generatedHistory: SimulationDay[] =
      [];

    for (
      let day = 1;
      day <= 20;
      day++
    ) {
      const nextDate =
        day === 1
          ? currentDate
          : addDays(
              currentDate,
              1
            );

      const nextStreak =
        calculateNextStreak(
          simulatedProgression,
          nextDate
        );

      const streakXP =
        getStreakXP(
          nextStreak
        );

      const milestone =
        nextStreak %
          STREAK_SHARD_INTERVAL_DAYS ===
        0;

      const shards =
        milestone
          ? STREAK_SHARD_REWARD
          : 0;

      simulatedXP +=
        streakXP;

      simulatedShards +=
        shards;

      generatedHistory.push({
        day:
          nextStreak,

        date:
          nextDate,

        streak:
          nextStreak,

        streakXP,

        shards,

        active: true,

        milestone,

        note:
          day === 1
            ? 'First qualifying activity'
            : milestone
              ? 'Streak shard milestone'
              : 'Consecutive day',
      });

      simulatedProgression = {
        ...simulatedProgression,

        currentStreak:
          nextStreak,

        longestStreak:
          Math.max(
            simulatedProgression.longestStreak,
            nextStreak
          ),

        lastActivityDate:
          nextDate,

        totalXP:
          simulatedXP,

        updatedAt:
          new Date().toISOString(),
      };

      currentDate =
        nextDate;
    }

    setProgression(
      simulatedProgression
    );

    setSimulationDate(
      currentDate
    );

    setTotalStreakXP(
      simulatedXP
    );

    setTotalShards(
      simulatedShards
    );

    setHistory(
      generatedHistory
    );

    Alert.alert(
      '20-Day Test Complete',
      `Streak: ${simulatedProgression.currentStreak}\nXP: ${simulatedXP}\nShards: ${simulatedShards}`
    );
  };

  /*
   * ========================================
   * TEST SAME DAY
   * ========================================
   */

  const testSameDay = () => {
    if (
      !progression.lastActivityDate
    ) {
      Alert.alert(
        'Run Day 1 First',
        'Simulate at least one active day before testing same-day protection.'
      );

      return;
    }

    const beforeStreak =
      progression.currentStreak;

    const beforeXP =
      totalStreakXP;

    const beforeShards =
      totalShards;

    simulateActiveDay(
      progression.lastActivityDate,
      'Intentional same-day duplicate test'
    );

    setTimeout(() => {
      const stillCorrect =
        progression.currentStreak ===
          beforeStreak &&
        totalStreakXP ===
          beforeXP &&
        totalShards ===
          beforeShards;

      Alert.alert(
        stillCorrect
          ? 'PASS'
          : 'CHECK FAILED',
        stillCorrect
          ? 'Same-day activity did not increase the streak or award extra streak XP.'
          : 'The displayed values changed. Check the streak implementation.'
      );
    }, 50);
  };

  /*
   * ========================================
   * RENDER
   * ========================================
   */

  return (
    <ScrollView
      style={
        styles.container
      }
      contentContainerStyle={
        styles.content
      }
    >
      <Text
        style={
          styles.title
        }
      >
        STREAK TESTER
      </Text>

      <Text
        style={
          styles.warning
        }
      >
        TEMPORARY DEVELOPER TOOL
      </Text>

      <Text
        style={
          styles.description
        }
      >
        This simulation does not modify your
        real Gymate XP, streak, or Pokéball
        shard balance.
      </Text>

      {/* ================================= */}
      {/* CURRENT STATE */}
      {/* ================================= */}

      <View
        style={
          styles.card
        }
      >
        <Text
          style={
            styles.cardTitle
          }
        >
          CURRENT STATE
        </Text>

        <View
          style={
            styles.statRow
          }
        >
          <Text
            style={
              styles.statLabel
            }
          >
            Current streak
          </Text>

          <Text
            style={
              styles.statValue
            }
          >
            {progression.currentStreak}
          </Text>
        </View>

        <View
          style={
            styles.statRow
          }
        >
          <Text
            style={
              styles.statLabel
            }
          >
            Longest streak
          </Text>

          <Text
            style={
              styles.statValue
            }
          >
            {progression.longestStreak}
          </Text>
        </View>

        <View
          style={
            styles.statRow
          }
        >
          <Text
            style={
              styles.statLabel
            }
          >
            Last active date
          </Text>

          <Text
            style={
              styles.statValueSmall
            }
          >
            {progression.lastActivityDate ??
              'None'}
          </Text>
        </View>

        <View
          style={
            styles.statRow
          }
        >
          <Text
            style={
              styles.statLabel
            }
          >
            Current streak XP
          </Text>

          <Text
            style={
              styles.xpValue
            }
          >
            +{currentStreakXP} XP
          </Text>
        </View>

        <View
          style={
            styles.statRow
          }
        >
          <Text
            style={
              styles.statLabel
            }
          >
            Simulated streak XP
          </Text>

          <Text
            style={
              styles.xpValue
            }
          >
            {totalStreakXP} XP
          </Text>
        </View>

        <View
          style={
            styles.statRow
          }
        >
          <Text
            style={
              styles.statLabel
            }
          >
            Simulated shards
          </Text>

          <Text
            style={
              styles.shardValue
            }
          >
            {totalShards}
          </Text>
        </View>
      </View>

      {/* ================================= */}
      {/* CONFIG */}
      {/* ================================= */}

      <View
        style={
          styles.card
        }
      >
        <Text
          style={
            styles.cardTitle
          }
        >
          STREAK CONFIG
        </Text>

        <Text
          style={
            styles.configText
          }
        >
          Day 1 → 10 XP
        </Text>

        <Text
          style={
            styles.configText
          }
        >
          Day 2 → 20 XP
        </Text>

        <Text
          style={
            styles.configText
          }
        >
          Day 3 → 30 XP
        </Text>

        <Text
          style={
            styles.configText
          }
        >
          Day 10+ → 100 XP
        </Text>

        <Text
          style={
            styles.configText
          }
        >
          Every {STREAK_SHARD_INTERVAL_DAYS} days
          → +{STREAK_SHARD_REWARD} shards
        </Text>

        <Text
          style={
            styles.configText
          }
        >
          Next milestone → Day {nextMilestone}
        </Text>
      </View>

      {/* ================================= */}
      {/* CONTROLS */}
      {/* ================================= */}

      <View
        style={
          styles.card
        }
      >
        <Text
          style={
            styles.cardTitle
          }
        >
          SIMULATION
        </Text>

        <Pressable
          style={
            styles.button
          }
          onPress={() =>
            simulateActiveDay(
              simulationDate
            )
          }
        >
          <Text
            style={
              styles.buttonText
            }
          >
            SIMULATE TODAY
          </Text>
        </Pressable>

        <Pressable
          style={
            styles.button
          }
          onPress={
            simulateNextDay
          }
        >
          <Text
            style={
              styles.buttonText
            }
          >
            SIMULATE NEXT DAY
          </Text>
        </Pressable>

        <Pressable
          style={
            styles.button
          }
          onPress={
            simulateMissedDay
          }
        >
          <Text
            style={
              styles.buttonText
            }
          >
            MISS A DAY → NEXT ACTIVITY
          </Text>
        </Pressable>

        <Pressable
          style={
            styles.button
          }
          onPress={
            testSameDay
          }
        >
          <Text
            style={
              styles.buttonText
            }
          >
            TEST SAME-DAY DUPLICATE
          </Text>
        </Pressable>

        <Pressable
          style={
            styles.button
          }
          onPress={
            simulateToDay7
          }
        >
          <Text
            style={
              styles.buttonText
            }
          >
            JUMP TO DAY 7
          </Text>
        </Pressable>

        <Pressable
          style={
            styles.button
          }
          onPress={
            simulateToDay10
          }
        >
          <Text
            style={
              styles.buttonText
            }
          >
            JUMP TO DAY 10
          </Text>
        </Pressable>

        <Pressable
          style={
            styles.button
          }
          onPress={
            simulate20Days
          }
        >
          <Text
            style={
              styles.buttonText
            }
          >
            RUN FULL 20-DAY TEST
          </Text>
        </Pressable>

        <Pressable
          style={
            styles.resetButton
          }
          onPress={() =>
            resetSimulation()
          }
        >
          <Text
            style={
              styles.resetButtonText
            }
          >
            RESET SIMULATION
          </Text>
        </Pressable>
      </View>

      {/* ================================= */}
      {/* EXPECTED 20 DAY RESULT */}
      {/* ================================= */}

      <View
        style={
          styles.card
        }
      >
        <Text
          style={
            styles.cardTitle
          }
        >
          EXPECTED 20-DAY RESULT
        </Text>

        <Text
          style={
            styles.expectedText
          }
        >
          Day 1 → +10 XP
        </Text>

        <Text
          style={
            styles.expectedText
          }
        >
          Day 2 → +20 XP
        </Text>

        <Text
          style={
            styles.expectedText
          }
        >
          Day 3 → +30 XP
        </Text>

        <Text
          style={
            styles.expectedText
          }
        >
          Day 4 → +40 XP
        </Text>

        <Text
          style={
            styles.expectedText
          }
        >
          Day 5 → +50 XP
        </Text>

        <Text
          style={
            styles.expectedText
          }
        >
          Day 6 → +60 XP
        </Text>

        <Text
          style={
            styles.milestoneText
          }
        >
          Day 7 → +70 XP + 3 shards
        </Text>

        <Text
          style={
            styles.expectedText
          }
        >
          Day 8 → +80 XP
        </Text>

        <Text
          style={
            styles.expectedText
          }
        >
          Day 9 → +90 XP
        </Text>

        <Text
          style={
            styles.expectedText
          }
        >
          Day 10 → +100 XP
        </Text>

        <Text
          style={
            styles.expectedText
          }
        >
          Day 11 → +100 XP
        </Text>

        <Text
          style={
            styles.expectedText
          }
        >
          Day 12 → +100 XP
        </Text>

        <Text
          style={
            styles.expectedText
          }
        >
          Day 13 → +100 XP
        </Text>

        <Text
          style={
            styles.milestoneText
          }
        >
          Day 14 → +100 XP + 3 shards
        </Text>

        <Text
          style={
            styles.expectedText
          }
        >
          Day 15–20 → +100 XP/day
        </Text>

        <Text
          style={
            styles.resultText
          }
        >
          Expected 20-day streak XP: 1,350
        </Text>

        <Text
          style={
            styles.resultText
          }
        >
          Expected milestone shards: 6
        </Text>
      </View>

      {/* ================================= */}
      {/* HISTORY */}
      {/* ================================= */}

      <View
        style={
          styles.card
        }
      >
        <Text
          style={
            styles.cardTitle
          }
        >
          SIMULATION HISTORY
        </Text>

        {history.length === 0 ? (
          <Text
            style={
              styles.emptyText
            }
          >
            No simulated days yet.
          </Text>
        ) : (
          history
            .slice()
            .reverse()
            .map(
              entry => (
                <View
                  key={`${entry.date}-${entry.day}`}
                  style={
                    styles.historyRow
                  }
                >
                  <View
                    style={
                      styles.historyLeft
                    }
                  >
                    <Text
                      style={
                        styles.historyDay
                      }
                    >
                      DAY {entry.day}
                    </Text>

                    <Text
                      style={
                        styles.historyDate
                      }
                    >
                      {entry.date}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.historyRight
                    }
                  >
                    <Text
                      style={
                        styles.historyXP
                      }
                    >
                      +{entry.streakXP} XP
                    </Text>

                    {entry.shards > 0 && (
                      <Text
                        style={
                          styles.historyShard
                        }
                      >
                        +{entry.shards} shards
                      </Text>
                    )}

                    <Text
                      style={
                        styles.historyNote
                      }
                    >
                      {entry.note}
                    </Text>
                  </View>
                </View>
              )
            )
        )}
      </View>

      <Text
        style={
          styles.footer
        }
      >
        Remove this developer screen after
        streak verification is complete.
      </Text>
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
        '#090909',
    },

    content: {
      padding: 20,
      paddingBottom: 60,
    },

    title: {
      color: '#D8FF3E',
      fontSize: 28,
      fontWeight: '900',
      letterSpacing: 2,
      marginBottom: 6,
    },

    warning: {
      color: '#FFB020',
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: 12,
    },

    description: {
      color: '#999',
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 20,
    },

    card: {
      backgroundColor:
        '#121212',
      borderWidth: 1,
      borderColor:
        '#262626',
      padding: 16,
      marginBottom: 16,
    },

    cardTitle: {
      color: '#FFF',
      fontSize: 14,
      fontWeight: '900',
      letterSpacing: 1.2,
      marginBottom: 14,
    },

    statRow: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor:
        '#1E1E1E',
    },

    statLabel: {
      color: '#999',
      fontSize: 13,
    },

    statValue: {
      color: '#FFF',
      fontSize: 20,
      fontWeight: '900',
    },

    statValueSmall: {
      color: '#FFF',
      fontSize: 12,
      fontWeight: '700',
    },

    xpValue: {
      color: '#D8FF3E',
      fontSize: 16,
      fontWeight: '900',
    },

    shardValue: {
      color: '#FFD166',
      fontSize: 16,
      fontWeight: '900',
    },

    configText: {
      color: '#AAA',
      fontSize: 13,
      marginBottom: 8,
    },

    button: {
      backgroundColor:
        '#1C1C1C',
      borderWidth: 1,
      borderColor:
        '#343434',
      paddingVertical: 14,
      paddingHorizontal: 14,
      marginBottom: 10,
    },

    buttonText: {
      color: '#FFF',
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 0.8,
      textAlign: 'center',
    },

    resetButton: {
      backgroundColor:
        '#251414',
      borderWidth: 1,
      borderColor:
        '#5A2828',
      paddingVertical: 14,
      paddingHorizontal: 14,
      marginTop: 4,
    },

    resetButtonText: {
      color: '#FF7777',
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 0.8,
      textAlign: 'center',
    },

    expectedText: {
      color: '#AAA',
      fontSize: 13,
      marginBottom: 7,
    },

    milestoneText: {
      color: '#FFD166',
      fontSize: 13,
      fontWeight: '800',
      marginBottom: 7,
    },

    resultText: {
      color: '#D8FF3E',
      fontSize: 14,
      fontWeight: '900',
      marginTop: 10,
    },

    emptyText: {
      color: '#666',
      fontSize: 13,
    },

    historyRow: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      borderBottomWidth: 1,
      borderBottomColor:
        '#202020',
      paddingVertical: 11,
    },

    historyLeft: {
      flex: 1,
    },

    historyDay: {
      color: '#FFF',
      fontSize: 13,
      fontWeight: '900',
    },

    historyDate: {
      color: '#666',
      fontSize: 11,
      marginTop: 3,
    },

    historyRight: {
      alignItems: 'flex-end',
      flex: 1.5,
    },

    historyXP: {
      color: '#D8FF3E',
      fontSize: 13,
      fontWeight: '900',
    },

    historyShard: {
      color: '#FFD166',
      fontSize: 12,
      fontWeight: '800',
      marginTop: 2,
    },

    historyNote: {
      color: '#666',
      fontSize: 10,
      marginTop: 3,
      textAlign: 'right',
    },

    footer: {
      color: '#555',
      fontSize: 11,
      textAlign: 'center',
      marginTop: 8,
    },
  });