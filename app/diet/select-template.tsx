import React, {
  useCallback,
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
  useFocusEffect,
  useRouter,
} from 'expo-router';

import { useProfile } from '../../context/ProfileContext';

import {
  getDietTemplates,
} from '../../database/dietRepository';

import {
  applyTemplateToDay,
  getOrCreateTodayNutrition,
} from '../../services/dietService';

import type {
  DietTemplate,
  DailyNutrition,
} from '../../types/diet';


const ACCENT = '#B8FF3D';


function getTodayDate(): string {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}


function getTemplateTotals(
  template: DietTemplate
) {
  return template.foods.reduce(
    (total, food) => ({
      calories:
        total.calories + food.calories,
      protein:
        total.protein + food.protein,
      carbs:
        total.carbs + food.carbs,
      fat:
        total.fat + food.fat,
    }),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    }
  );
}


function getFoodPreview(
  template: DietTemplate
): string {
  const names =
    template.foods.map(
      (food) => food.foodName
    );

  if (names.length === 0) {
    return 'No foods in this template';
  }

  const shown =
    names.slice(0, 3).join(', ');

  const extra =
    names.length - 3;

  return extra > 0
    ? `${shown} +${extra} more`
    : shown;
}


export default function SelectTemplateScreen() {
  const router = useRouter();

  const {
    profile,
    isLoading: profileLoading,
  } = useProfile();

  const profileId =
    profile?.id ?? null;

  const [templates, setTemplates] =
    useState<DietTemplate[]>([]);

  const [todayNutrition, setTodayNutrition] =
    useState<DailyNutrition | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [applyingId, setApplyingId] =
    useState<string | null>(null);


  const loadData =
    useCallback(async () => {
      if (!profileId) {
        setLoading(false);
        return;
      }

      try {
        const [
          loadedTemplates,
          nutrition,
        ] = await Promise.all([
          getDietTemplates(
            profileId
          ),
          getOrCreateTodayNutrition(
            profileId
          ),
        ]);

        setTemplates(
          loadedTemplates
        );

        setTodayNutrition(
          nutrition
        );
      } catch (error) {
        console.error(
          'Failed to load diet templates:',
          error
        );

        Alert.alert(
          'Diet',
          'Unable to load templates.'
        );
      } finally {
        setLoading(false);
      }
    }, [profileId]);


  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );


  async function applyTemplate(
    template: DietTemplate
  ) {
    if (
      !profileId ||
      !todayNutrition ||
      applyingId
    ) {
      return;
    }

    if (
      todayNutrition.foods.length > 0
    ) {
      Alert.alert(
        'Replace today\'s food?',
        'Using this template will replace the foods currently added today. Your water intake will be kept.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Apply Template',
            onPress: () =>
              performApply(
                template
              ),
          },
        ]
      );

      return;
    }

    await performApply(
      template
    );
  }


  async function performApply(
    template: DietTemplate
  ) {
    if (
      !profileId ||
      !todayNutrition
    ) {
      return;
    }

    try {
      setApplyingId(
        template.id
      );

      await applyTemplateToDay(
        profileId,
        template.id,
        getTodayDate(),
        todayNutrition.calorieGoal,
        todayNutrition.proteinGoal,
        todayNutrition.waterGoal
      );

      router.back();
    } catch (error) {
      console.error(
        'Failed to apply diet template:',
        error
      );

      Alert.alert(
        'Template',
        'Unable to apply this template.'
      );
    } finally {
      setApplyingId(null);
    }
  }


  if (
    profileLoading ||
    loading
  ) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={ACCENT}
        />
      </View>
    );
  }


  const existingCount =
    todayNutrition?.foods.length ?? 0;


  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >

        <View style={styles.header}>
          <Pressable
            onPress={() =>
              router.back()
            }
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.backText}>
              ‹
            </Text>
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              DAILY NUTRITION
            </Text>

            <Text style={styles.title}>
              USE TEMPLATE
            </Text>
          </View>

          <Pressable
            onPress={() =>
              router.push(
                '/diet/template-create'
              )
            }
            accessibilityRole="button"
            accessibilityLabel="Create a new template"
            style={({ pressed }) => [
              styles.newButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.newButtonText}>
              + NEW
            </Text>
          </Pressable>
        </View>


        {templates.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>
              ▣
            </Text>

            <Text style={styles.emptyTitle}>
              NO TEMPLATES
            </Text>

            <Text style={styles.emptyText}>
              Create a diet template first,
              then you can apply it to any
              day.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              onPress={() =>
                router.push(
                  '/diet/template-create'
                )
              }
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                CREATE TEMPLATE
              </Text>
            </Pressable>

            <Pressable
              hitSlop={10}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.linkButton,
                pressed && styles.pressed,
              ]}
              onPress={() =>
                router.push(
                  '/diet/templates'
                )
              }
            >
              <Text style={styles.linkText}>
                MANAGE TEMPLATES
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Select a template to replace
              today&apos;s food plan.
            </Text>


            {existingCount > 0 && (
              <View style={styles.warning}>
                <Text style={styles.warningTitle}>
                  TODAY ALREADY HAS{' '}
                  {existingCount}{' '}
                  ITEM
                  {existingCount === 1
                    ? ''
                    : 'S'}
                </Text>

                <Text style={styles.warningText}>
                  Applying a template
                  replaces them. Water intake
                  is kept.
                </Text>
              </View>
            )}


            {templates.map(
              (template) => {
                const totals =
                  getTemplateTotals(
                    template
                  );

                const applying =
                  applyingId ===
                  template.id;

                return (
                  <Pressable
                    key={template.id}
                    disabled={
                      applyingId !== null
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Use template ${template.name}`}
                    onPress={() =>
                      applyTemplate(
                        template
                      )
                    }
                    style={({ pressed }) => [
                      styles.templateCard,
                      applying &&
                        styles.templateCardDisabled,
                      pressed &&
                        !applying &&
                        styles.templateCardPressed,
                    ]}
                  >
                    <View
                      style={
                        styles.cardTop
                      }
                    >
                      <View
                        style={
                          styles.templateInfo
                        }
                      >
                        <Text
                          numberOfLines={1}
                          style={
                            styles.templateName
                          }
                        >
                          {template.name}
                        </Text>

                        <Text
                          numberOfLines={1}
                          style={
                            styles.templatePreview
                          }
                        >
                          {getFoodPreview(
                            template
                          )}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.useChip,
                          applying &&
                            styles.useChipBusy,
                        ]}
                      >
                        {applying ? (
                          <ActivityIndicator
                            size="small"
                            color="#090909"
                          />
                        ) : (
                          <Text
                            style={
                              styles.applyText
                            }
                          >
                            USE
                          </Text>
                        )}
                      </View>
                    </View>


                    <View
                      style={
                        styles.statsRow
                      }
                    >
                      <View style={styles.stat}>
                        <Text
                          style={
                            styles.statValue
                          }
                        >
                          {Math.round(
                            totals.calories
                          )}
                        </Text>

                        <Text
                          style={
                            styles.statLabel
                          }
                        >
                          KCAL
                        </Text>
                      </View>

                      <View style={styles.stat}>
                        <Text
                          style={[
                            styles.statValue,
                            styles.statAccent,
                          ]}
                        >
                          {totals.protein.toFixed(
                            1
                          )}
                          g
                        </Text>

                        <Text
                          style={
                            styles.statLabel
                          }
                        >
                          PROTEIN
                        </Text>
                      </View>

                      <View style={styles.stat}>
                        <Text
                          style={
                            styles.statValue
                          }
                        >
                          {totals.carbs.toFixed(
                            1
                          )}
                          g
                        </Text>

                        <Text
                          style={
                            styles.statLabel
                          }
                        >
                          CARBS
                        </Text>
                      </View>

                      <View style={styles.stat}>
                        <Text
                          style={
                            styles.statValue
                          }
                        >
                          {totals.fat.toFixed(
                            1
                          )}
                          g
                        </Text>

                        <Text
                          style={
                            styles.statLabel
                          }
                        >
                          FAT
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              }
            )}


            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create a new template"
              style={({ pressed }) => [
                styles.createCard,
                pressed && styles.pressed,
              ]}
              onPress={() =>
                router.push(
                  '/diet/template-create'
                )
              }
            >
              <Text style={styles.createIcon}>
                +
              </Text>

              <Text style={styles.createText}>
                CREATE NEW TEMPLATE
              </Text>
            </Pressable>

            <Pressable
              hitSlop={10}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.linkButton,
                pressed && styles.pressed,
              ]}
              onPress={() =>
                router.push(
                  '/diet/templates'
                )
              }
            >
              <Text style={styles.linkText}>
                MANAGE TEMPLATES
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090909',
  },

  content: {
    padding: 18,
    paddingBottom: 50,
  },

  center: {
    flex: 1,
    backgroundColor: '#090909',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pressed: {
    opacity: 0.7,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#292929',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  backText: {
    color: ACCENT,
    fontSize: 28,
    lineHeight: 30,
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    color: '#7A7A7A',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  title: {
    color: '#F2F2F2',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },

  subtitle: {
    color: '#808080',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 15,
  },

  warning: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#202020',
    borderLeftWidth: 3,
    borderLeftColor: ACCENT,
    borderRadius: 8,
    padding: 13,
    marginBottom: 14,
  },

  warningTitle: {
    color: ACCENT,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  warningText: {
    color: '#808080',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  templateCard: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 9,
    padding: 15,
    marginBottom: 10,
  },

  templateCardPressed: {
    backgroundColor: '#161616',
    borderColor: '#343434',
  },

  templateCardDisabled: {
    opacity: 0.6,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  templateInfo: {
    flex: 1,
    marginRight: 12,
  },

  templateName: {
    color: '#F2F2F2',
    fontSize: 15,
    fontWeight: '900',
  },

  templatePreview: {
    color: '#7A7A7A',
    fontSize: 11,
    marginTop: 5,
  },

  useChip: {
    minWidth: 58,
    height: 32,
    borderRadius: 6,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  useChipBusy: {
    opacity: 0.85,
  },

  applyText: {
    color: '#090909',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  statsRow: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },

  stat: {
    flex: 1,
  },

  statValue: {
    color: '#DDD',
    fontSize: 12,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },

  statAccent: {
    color: ACCENT,
  },

  statLabel: {
    color: '#6E6E6E',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 3,
  },

  empty: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#242424',
    borderRadius: 9,
    padding: 28,
    alignItems: 'center',
    marginTop: 20,
  },

  emptyIcon: {
    color: ACCENT,
    fontSize: 30,
  },

  emptyTitle: {
    color: '#F2F2F2',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 9,
  },

  emptyText: {
    color: '#7A7A7A',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 7,
    marginBottom: 17,
  },

  newButton: {
    backgroundColor: ACCENT,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 6,
  },

  newButtonText: {
    color: '#090909',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  createCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    marginTop: 4,
    borderRadius: 9,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#3A4A1A',
    backgroundColor: '#0E110A',
  },

  createIcon: {
    color: ACCENT,
    fontSize: 20,
    fontWeight: '300',
    marginRight: 8,
  },

  createText: {
    color: ACCENT,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  linkButton: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 6,
  },

  linkText: {
    color: '#8A8A8A',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  primaryButton: {
    backgroundColor: ACCENT,
    paddingHorizontal: 17,
    paddingVertical: 12,
    borderRadius: 7,
  },

  primaryButtonText: {
    color: '#090909',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
});