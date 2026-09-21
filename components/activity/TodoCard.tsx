import React, {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  createTodayTodo,
  editTodayTodo,
  evaluateTodayTodoXP,
  getTodayTodoSummary,
  type TodayTodoSummary,
} from '../../services/activityService';

import { colors } from '../../constants/theme';

type TodoCardProps = {
  profileId: string;
};

export default function TodoCard({
  profileId,
}: TodoCardProps) {
  const [summary, setSummary] =
    useState<TodayTodoSummary | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [claiming, setClaiming] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [modalVisible, setModalVisible] =
    useState(false);

  const [editingSlot, setEditingSlot] =
    useState<number | null>(null);

  const [taskText, setTaskText] =
    useState('');

  async function loadTodo() {
    try {
      setLoading(true);
      setError(null);

      const result =
        await getTodayTodoSummary(profileId);

      setSummary(result);
    } catch (err) {
      console.error(
        '[Gymate] Failed to load Todo:',
        err,
      );

      setError(
        'TODO UNAVAILABLE',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTodo();
  }, [profileId]);

  function openAddTask() {
    if (
      !summary ||
      summary.todos.length >=
        summary.requiredSlots
    ) {
      return;
    }

    setEditingSlot(null);
    setTaskText('');
    setModalVisible(true);
  }

  function openEditTask(
    slotNumber: number,
    title: string,
  ) {
    setEditingSlot(slotNumber);
    setTaskText(title);
    setModalVisible(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalVisible(false);
    setEditingSlot(null);
    setTaskText('');
  }

  async function saveTask() {
    const title = taskText.trim();

    if (!title) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingSlot !== null) {
        await editTodayTodo(
          profileId,
          editingSlot,
          {
            title,
          },
        );
      } else {
        await createTodayTodo(
          profileId,
          title,
        );
      }

      closeModal();

      await loadTodo();
    } catch (err) {
      console.error(
        '[Gymate] Failed to save Todo:',
        err,
      );

      setError(
        'FAILED TO SAVE TASK',
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(
    slotNumber: number,
    completed: boolean,
  ) {
    try {
      setError(null);

      await editTodayTodo(
        profileId,
        slotNumber,
        {
          completed: !completed,
        },
      );

      await loadTodo();
    } catch (err) {
      console.error(
        '[Gymate] Failed to update Todo:',
        err,
      );

      setError(
        'FAILED TO UPDATE TASK',
      );
    }
  }

  async function claimXP() {
    if (
      !summary ||
      !summary.canEvaluate ||
      claiming
    ) {
      return;
    }

    try {
      setClaiming(true);
      setError(null);

      const result =
        await evaluateTodayTodoXP(
          profileId,
        );

      await loadTodo();

      if (
        result.xpAwarded > 0
      ) {
        console.log(
          `[Gymate] Todo XP awarded: ${result.xpAwarded}`,
        );
      }
    } catch (err) {
      console.error(
        '[Gymate] Failed to claim Todo XP:',
        err,
      );

      setError(
        'FAILED TO CLAIM XP',
      );
    } finally {
      setClaiming(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator
          size="small"
          color={colors.primary}
        />

        <Text style={styles.loadingText}>
          LOADING TODO...
        </Text>
      </View>
    );
  }

  if (error && !summary) {
    return (
      <View style={styles.card}>
        <Text style={styles.errorText}>
          {error}
        </Text>

        <Pressable
          style={styles.retryButton}
          onPress={loadTodo}
        >
          <Text style={styles.retryText}>
            RETRY
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!summary) {
    return null;
  }

  const availableSlots =
    Math.max(
      0,
      summary.requiredSlots -
        summary.populated,
    );

  return (
    <>
      <View style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              TODAY'S TASKS
            </Text>

            <Text style={styles.subtitle}>
              {summary.completed}/
              {summary.requiredSlots}{' '}
              COMPLETE
            </Text>
          </View>

          <Text style={styles.xpBadge}>
            +{summary.xp} XP
          </Text>
        </View>

        {!summary.allSlotsPopulated && (
          <View style={styles.setupBox}>
            <Text
              style={styles.setupTitle}
            >
              ADD {availableSlots}{' '}
              MORE TASK
              {availableSlots !== 1
                ? 'S'
                : ''}
            </Text>

            <Text
              style={styles.setupText}
            >
              Fill all 5 slots to unlock
              today's XP reward.
            </Text>
          </View>
        )}

        <View style={styles.taskList}>
          {Array.from(
            {
              length:
                summary.requiredSlots,
            },
            (_, index) => {
              const slotNumber =
                index + 1;

              const task =
                summary.todos.find(
                  item =>
                    item.slotNumber ===
                    slotNumber,
                );

              const hasTask =
                !!task &&
                task.title.trim()
                  .length > 0;

              if (!hasTask) {
                return (
                  <Pressable
                    key={slotNumber}
                    style={
                      styles.emptyTask
                    }
                    onPress={
                      openAddTask
                    }
                  >
                    <View
                      style={
                        styles.emptyIcon
                      }
                    >
                      <Text
                        style={
                          styles.plus
                        }
                      >
                        +
                      </Text>
                    </View>

                    <View
                      style={
                        styles.emptyContent
                      }
                    >
                      <Text
                        style={
                          styles.addTaskText
                        }
                      >
                        ADD TASK
                      </Text>

                      <Text
                        style={
                          styles.slotText
                        }
                      >
                        SLOT {slotNumber}
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.arrow
                      }
                    >
                      →
                    </Text>
                  </Pressable>
                );
              }

              return (
                <View
                  key={slotNumber}
                  style={
                    styles.taskRow
                  }
                >
                  <Pressable
                    style={[
                      styles.checkbox,
                      task.completed &&
                        styles.checkboxDone,
                    ]}
                    onPress={() =>
                      toggleTask(
                        slotNumber,
                        task.completed,
                      )
                    }
                  >
                    {task.completed && (
                      <Text
                        style={
                          styles.checkmark
                        }
                      >
                        ✓
                      </Text>
                    )}
                  </Pressable>

                  <Pressable
                    style={
                      styles.taskContent
                    }
                    onPress={() =>
                      openEditTask(
                        slotNumber,
                        task.title,
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.taskTitle,
                        task.completed &&
                          styles.taskCompleted,
                      ]}
                      numberOfLines={2}
                    >
                      {task.title}
                    </Text>

                    <Text
                      style={
                        styles.editHint
                      }
                    >
                      TAP TO EDIT
                    </Text>
                  </Pressable>
                </View>
              );
            },
          )}
        </View>

        <View style={styles.progressSection}>
          <View
            style={
              styles.progressHeader
            }
          >
            <Text
              style={
                styles.progressLabel
              }
            >
              DAILY PROGRESS
            </Text>

            <Text
              style={
                styles.progressPercent
              }
            >
              {summary.completionPercent}%
            </Text>
          </View>

          <View
            style={styles.progressTrack}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    100,
                    summary.completionPercent,
                  )}%`,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.rules}>
          <Text style={styles.rulesTitle}>
            XP RULES
          </Text>

          <Text style={styles.rule}>
            3 TASKS  →  +50 XP
          </Text>

          <Text style={styles.rule}>
            4 TASKS  →  +50 XP
          </Text>

          <Text style={styles.rule}>
            5 TASKS  →  +100 XP
          </Text>
        </View>

        {summary.canEvaluate && (
          <Pressable
            style={[
              styles.claimButton,
              claiming &&
                styles.disabledButton,
            ]}
            onPress={claimXP}
            disabled={claiming}
          >
            {claiming ? (
              <ActivityIndicator
                size="small"
                color="#000"
              />
            ) : (
              <Text
                style={
                  styles.claimText
                }
              >
                CLAIM +{summary.xp} XP
              </Text>
            )}
          </Pressable>
        )}

        {summary.allSlotsPopulated &&
          summary.completed < 3 && (
            <Text
              style={
                styles.minimumText
              }
            >
              COMPLETE AT LEAST 3 TASKS
              TO EARN XP
            </Text>
          )}

        {error && (
          <Text
            style={styles.inlineError}
          >
            {error}
          </Text>
        )}
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={
          closeModal
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={styles.modalCard}
          >
            <Text
              style={styles.modalTitle}
            >
              {editingSlot !== null
                ? 'EDIT TASK'
                : 'ADD TASK'}
            </Text>

            <Text
              style={
                styles.modalSubtitle
              }
            >
              {editingSlot !== null
                ? `SLOT ${editingSlot}`
                : `SLOT ${
                    summary.populated + 1
                  }`}
            </Text>

            <TextInput
              value={taskText}
              onChangeText={
                setTaskText
              }
              placeholder="Task name..."
              placeholderTextColor="#666"
              autoFocus
              maxLength={80}
              style={
                styles.input
              }
              returnKeyType="done"
              onSubmitEditing={
                saveTask
              }
            />

            <View
              style={styles.modalButtons}
            >
              <Pressable
                style={
                  styles.cancelButton
                }
                onPress={
                  closeModal
                }
                disabled={saving}
              >
                <Text
                  style={
                    styles.cancelText
                  }
                >
                  CANCEL
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.saveButton,
                  (!taskText.trim() ||
                    saving) &&
                    styles.disabledButton,
                ]}
                onPress={
                  saveTask
                }
                disabled={
                  !taskText.trim() ||
                  saving
                }
              >
                {saving ? (
                  <ActivityIndicator
                    size="small"
                    color="#000"
                  />
                ) : (
                  <Text
                    style={
                      styles.saveText
                    }
                  >
                    SAVE
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#181818',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#292929',
    padding: 16,
  },

  header: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'flex-start',
  },

  title: {
    color: colors.text,
    fontFamily:
      'PressStart2P',
    fontSize: 13,
  },

  subtitle: {
    color:
      colors.textSecondary,
    fontFamily: 'VT323',
    fontSize: 17,
    marginTop: 7,
  },

  xpBadge: {
    color: colors.primary,
    fontFamily:
      'PressStart2P',
    fontSize: 10,
  },

  setupBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor:
      'rgba(190, 255, 0, 0.35)',
    backgroundColor:
      'rgba(190, 255, 0, 0.06)',
  },

  setupTitle: {
    color: colors.primary,
    fontFamily:
      'PressStart2P',
    fontSize: 9,
  },

  setupText: {
    color:
      colors.textSecondary,
    fontFamily: 'VT323',
    fontSize: 16,
    marginTop: 6,
  },

  taskList: {
    marginTop: 16,
    gap: 8,
  },

  taskRow: {
    minHeight: 64,
    backgroundColor: '#111111',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#292929',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxDone: {
    backgroundColor:
      colors.primary,
    borderColor:
      colors.primary,
  },

  checkmark: {
    color: '#000',
    fontFamily: 'VT323',
    fontSize: 24,
    lineHeight: 24,
  },

  taskContent: {
    flex: 1,
    marginLeft: 12,
    paddingVertical: 9,
  },

  taskTitle: {
    color: colors.text,
    fontFamily: 'VT323',
    fontSize: 21,
  },

  taskCompleted: {
    color: '#777',
    textDecorationLine:
      'line-through',
  },

  editHint: {
    color: '#555',
    fontFamily: 'VT323',
    fontSize: 12,
    marginTop: 1,
  },

  emptyTask: {
    minHeight: 64,
    backgroundColor: '#111111',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#292929',
    borderStyle: 'dashed',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  emptyIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 1,
    borderColor:
      colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  plus: {
    color: colors.primary,
    fontFamily: 'VT323',
    fontSize: 25,
    lineHeight: 25,
  },

  emptyContent: {
    flex: 1,
    marginLeft: 12,
  },

  addTaskText: {
    color: colors.primary,
    fontFamily:
      'PressStart2P',
    fontSize: 9,
  },

  slotText: {
    color: '#555',
    fontFamily: 'VT323',
    fontSize: 14,
    marginTop: 3,
  },

  arrow: {
    color: colors.primary,
    fontFamily: 'VT323',
    fontSize: 28,
  },

  progressSection: {
    marginTop: 18,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    marginBottom: 7,
  },

  progressLabel: {
    color:
      colors.textSecondary,
    fontFamily:
      'PressStart2P',
    fontSize: 8,
  },

  progressPercent: {
    color: colors.primary,
    fontFamily:
      'PressStart2P',
    fontSize: 9,
  },

  progressTrack: {
    height: 9,
    backgroundColor: '#2A2A2A',
    borderRadius: 5,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor:
      colors.primary,
  },

  rules: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#292929',
  },

  rulesTitle: {
    color:
      colors.textSecondary,
    fontFamily:
      'PressStart2P',
    fontSize: 8,
    marginBottom: 7,
  },

  rule: {
    color: '#777',
    fontFamily: 'VT323',
    fontSize: 15,
    lineHeight: 19,
  },

  claimButton: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor:
      colors.primary,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  claimText: {
    color: '#000',
    fontFamily:
      'PressStart2P',
    fontSize: 10,
  },

  disabledButton: {
    opacity: 0.5,
  },

  minimumText: {
    color: '#777',
    fontFamily: 'VT323',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
  },

  inlineError: {
    color: '#FF6B6B',
    fontFamily: 'VT323',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },

  loadingText: {
    color:
      colors.textSecondary,
    fontFamily: 'VT323',
    fontSize: 17,
    textAlign: 'center',
    marginTop: 8,
  },

  errorText: {
    color: '#FF6B6B',
    fontFamily:
      'PressStart2P',
    fontSize: 10,
    textAlign: 'center',
  },

  retryButton: {
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor:
      colors.primary,
    alignSelf: 'center',
  },

  retryText: {
    color: '#000',
    fontFamily:
      'PressStart2P',
    fontSize: 9,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.78)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  modalCard: {
    backgroundColor: '#181818',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#333',
    padding: 20,
  },

  modalTitle: {
    color: colors.text,
    fontFamily:
      'PressStart2P',
    fontSize: 14,
    textAlign: 'center',
  },

  modalSubtitle: {
    color:
      colors.textSecondary,
    fontFamily: 'VT323',
    fontSize: 17,
    textAlign: 'center',
    marginTop: 7,
    marginBottom: 18,
  },

  input: {
    minHeight: 52,
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 11,
    paddingHorizontal: 14,
    color: colors.text,
    fontFamily: 'VT323',
    fontSize: 20,
  },

  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },

  cancelButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent:
      'center',
  },

  cancelText: {
    color:
      colors.textSecondary,
    fontFamily:
      'PressStart2P',
    fontSize: 9,
  },

  saveButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 10,
    backgroundColor:
      colors.primary,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  saveText: {
    color: '#000',
    fontFamily:
      'PressStart2P',
    fontSize: 9,
  },
});