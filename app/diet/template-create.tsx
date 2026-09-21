import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import {
  createDietTemplate,
  deleteDietTemplateFood,
  getDietTemplateById,
  updateDietTemplate,
} from '../../database/dietRepository';

import { useProfile } from '../../context/ProfileContext';

import type {
  DietTemplate,
  DietTemplateFood,
} from '../../types/diet';


const ACCENT = '#A8FF3E';
const NAME_MAX_LENGTH = 40;


export default function DietTemplateCreateScreen() {
  const router = useRouter();

  const params =
    useLocalSearchParams<{
      templateId?: string;
    }>();

  const templateId =
    params.templateId;


  const {
    profile,
    isLoading: profileLoading,
  } = useProfile();

  const profileId =
    profile?.id ?? null;


  const [template, setTemplate] =
    useState<DietTemplate | null>(
      null
    );

  const [name, setName] =
    useState('');

  const [loading, setLoading] =
    useState(Boolean(templateId));

  const [saving, setSaving] =
    useState(false);

  const hasLoadedRef =
    useRef(false);


  const isEditing =
    Boolean(templateId);


  const loadTemplate =
    useCallback(
      async () => {
        if (
          !templateId ||
          !profileId
        ) {
          return;
        }

        try {
          setLoading(true);

          const result =
            await getDietTemplateById(
              profileId,
              templateId
            );

          if (!result) {
            Alert.alert(
              'ERROR',
              'Template not found.'
            );

            router.back();
            return;
          }

          setTemplate(result);
          setName(result.name);

          hasLoadedRef.current =
            true;
        } catch (error) {
          console.error(
            'Failed to load template:',
            error
          );

          Alert.alert(
            'ERROR',
            'Could not load template.'
          );
        } finally {
          setLoading(false);
        }
      },
      [
        router,
        templateId,
        profileId,
      ]
    );


  useEffect(() => {
    if (
      !profileLoading &&
      profileId
    ) {
      loadTemplate();
    }
  }, [
    profileLoading,
    profileId,
    loadTemplate,
  ]);


  /*
   * When you come back from "Add Food" this
   * screen is still mounted, so the food list
   * has to be refreshed. This is a silent
   * refresh — it never touches the name field,
   * so unsaved edits to the name are kept.
   */
  useFocusEffect(
    useCallback(() => {
      if (
        !hasLoadedRef.current ||
        !templateId ||
        !profileId
      ) {
        return;
      }

      let active = true;

      getDietTemplateById(
        profileId,
        templateId
      )
        .then((result) => {
          if (active && result) {
            setTemplate(result);
          }
        })
        .catch((error) => {
          console.error(
            'Failed to refresh template:',
            error
          );
        });

      return () => {
        active = false;
      };
    }, [templateId, profileId])
  );


  const totals =
    useMemo(() => {
      return (
        template?.foods.reduce(
          (
            result,
            food
          ) => ({
            calories:
              result.calories +
              food.calories,

            protein:
              result.protein +
              food.protein,

            carbs:
              result.carbs +
              food.carbs,

            fat:
              result.fat +
              food.fat,
          }),
          {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
          }
        ) ?? {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        }
      );
    }, [template]);


  async function handleSave() {
    if (!profileId) {
      Alert.alert(
        'PROFILE',
        'No active profile found.'
      );
      return;
    }

    const trimmedName =
      name.trim();

    if (!trimmedName) {
      Alert.alert(
        'TEMPLATE NAME',
        'Enter a name for this template.'
      );
      return;
    }


    try {
      setSaving(true);

      if (!isEditing) {
        const created =
          await createDietTemplate(
            profileId,
            trimmedName
          );

        router.replace({
          pathname:
            '/diet/template-create',

          params: {
            templateId:
              created.id,
          },
        });

        return;
      }


      if (!templateId) {
        return;
      }


      const updated =
        await updateDietTemplate(
          profileId,
          templateId,
          trimmedName
        );

      if (updated) {
        setTemplate(updated);
        setName(updated.name);
      }

      router.back();
    } catch (error) {
      console.error(
        'Failed to save template:',
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : '';

      if (
        message ===
        'DIET_TEMPLATE_ALREADY_EXISTS'
      ) {
        Alert.alert(
          'ALREADY EXISTS',
          'A template with this name already exists.'
        );
      } else {
        Alert.alert(
          'ERROR',
          'Could not save template.'
        );
      }
    } finally {
      setSaving(false);
    }
  }


  async function handleDeleteFood(
    food: DietTemplateFood
  ) {
    if (
      !profileId ||
      !template
    ) {
      return;
    }

    Alert.alert(
      'REMOVE FOOD',
      `Remove ${food.foodName}?`,
      [
        {
          text: 'CANCEL',
          style: 'cancel',
        },

        {
          text: 'REMOVE',
          style: 'destructive',

          onPress: async () => {
            try {
              await deleteDietTemplateFood(
                profileId,
                food.id
              );

              const refreshed =
                await getDietTemplateById(
                  profileId,
                  template.id
                );

              setTemplate(
                refreshed
              );
            } catch (error) {
              console.error(
                'Failed to remove food:',
                error
              );

              Alert.alert(
                'ERROR',
                'Could not remove the food.'
              );
            }
          },
        },
      ]
    );
  }


  function renderFood({
    item,
  }: {
    item: DietTemplateFood;
  }) {
    return (
      <View
        style={styles.foodCard}
      >
        <View
          style={styles.foodMain}
        >
          <Text
            numberOfLines={1}
            style={styles.foodName}
          >
            {item.foodName}
          </Text>

          <Text
            style={styles.foodQuantity}
          >
            {item.quantity} {item.unit}
          </Text>
        </View>


        <View
          style={styles.foodNutrition}
        >
          <View
            style={styles.foodStat}
          >
            <Text
              style={styles.foodStatValue}
            >
              {Math.round(
                item.calories
              )}
            </Text>

            <Text
              style={styles.foodStatLabel}
            >
              KCAL
            </Text>
          </View>


          <View
            style={styles.foodStat}
          >
            <Text
              style={styles.foodStatValue}
            >
              {item.protein.toFixed(1)}
              g
            </Text>

            <Text
              style={styles.foodStatLabel}
            >
              PROTEIN
            </Text>
          </View>


          <View
            style={styles.foodStat}
          >
            <Text
              style={styles.foodStatValue}
            >
              {item.carbs.toFixed(1)}
              g
            </Text>

            <Text
              style={styles.foodStatLabel}
            >
              CARBS
            </Text>
          </View>


          <View
            style={styles.foodStat}
          >
            <Text
              style={styles.foodStatValue}
            >
              {item.fat.toFixed(1)}
              g
            </Text>

            <Text
              style={styles.foodStatLabel}
            >
              FAT
            </Text>
          </View>


          <Pressable
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${item.foodName}`}
            onPress={() =>
              handleDeleteFood(
                item
              )
            }
            style={({ pressed }) => [
              styles.foodDelete,
              pressed &&
                styles.foodDeletePressed,
            ]}
          >
            <Text
              style={
                styles.foodDeleteText
              }
            >
              ×
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }


  if (
    profileLoading ||
    loading
  ) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={styles.loading}
        >
          <ActivityIndicator
            size="large"
            color={ACCENT}
          />
        </View>
      </SafeAreaView>
    );
  }


  if (!profileId) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={styles.loading}
        >
          <Text
            style={styles.loadingText}
          >
            NO ACTIVE PROFILE
          </Text>
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <View
          style={styles.header}
        >
          <Pressable
            onPress={() =>
              router.back()
            }
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [
              styles.backButton,
              pressed &&
                styles.pressed,
            ]}
          >
            <Text
              style={styles.backText}
            >
              ←
            </Text>
          </Pressable>


          <View
            style={styles.headerCenter}
          >
            <Text
              style={styles.eyebrow}
            >
              DIET
            </Text>

            <Text
              style={styles.title}
            >
              {isEditing
                ? 'EDIT TEMPLATE'
                : 'NEW TEMPLATE'}
            </Text>
          </View>
        </View>


        <View
          style={styles.nameSection}
        >
          <View
            style={styles.nameLabelRow}
          >
            <Text
              style={styles.sectionLabel}
            >
              TEMPLATE NAME
            </Text>

            <Text
              style={styles.counter}
            >
              {name.length}/
              {NAME_MAX_LENGTH}
            </Text>
          </View>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. CUTTING DAY"
            placeholderTextColor="#5A635C"
            style={styles.nameInput}
            maxLength={NAME_MAX_LENGTH}
            autoCapitalize="characters"
            returnKeyType="done"
          />
        </View>


        {isEditing ? (
          <>
            <View
              style={styles.summaryCard}
            >
              <View
                style={styles.summaryTop}
              >
                <View>
                  <Text
                    style={
                      styles.summaryLabel
                    }
                  >
                    DAILY TOTAL
                  </Text>

                  <Text
                    style={
                      styles.summaryCalories
                    }
                  >
                    {Math.round(
                      totals.calories
                    )}{' '}
                    KCAL
                  </Text>
                </View>


                <View
                  style={
                    styles.summaryRight
                  }
                >
                  <Text
                    style={
                      styles.summaryProtein
                    }
                  >
                    {totals.protein.toFixed(
                      1
                    )}
                    g
                  </Text>

                  <Text
                    style={
                      styles.summaryLabel
                    }
                  >
                    PROTEIN
                  </Text>
                </View>
              </View>


              <View
                style={
                  styles.summaryBottom
                }
              >
                <View
                  style={
                    styles.summaryMini
                  }
                >
                  <Text
                    style={
                      styles.summaryMiniValue
                    }
                  >
                    {totals.carbs.toFixed(
                      1
                    )}
                    g
                  </Text>

                  <Text
                    style={
                      styles.summaryLabel
                    }
                  >
                    CARBS
                  </Text>
                </View>

                <View
                  style={
                    styles.summaryMini
                  }
                >
                  <Text
                    style={
                      styles.summaryMiniValue
                    }
                  >
                    {totals.fat.toFixed(
                      1
                    )}
                    g
                  </Text>

                  <Text
                    style={
                      styles.summaryLabel
                    }
                  >
                    FAT
                  </Text>
                </View>

                <View
                  style={
                    styles.summaryMini
                  }
                >
                  <Text
                    style={
                      styles.summaryMiniValue
                    }
                  >
                    {template?.foods
                      .length ?? 0}
                  </Text>

                  <Text
                    style={
                      styles.summaryLabel
                    }
                  >
                    ITEMS
                  </Text>
                </View>
              </View>
            </View>


            <View
              style={styles.foodHeader}
            >
              <Text
                style={styles.sectionTitle}
              >
                FOODS
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add a food to this template"
                style={({ pressed }) => [
                  styles.addFoodButton,
                  pressed &&
                    styles.pressed,
                ]}
                onPress={() =>
                  router.push({
                    pathname:
                      '/diet/template-food',

                    params: {
                      templateId:
                        templateId,
                    },
                  })
                }
              >
                <Text
                  style={
                    styles.addFoodText
                  }
                >
                  + ADD FOOD
                </Text>
              </Pressable>
            </View>


            {template &&
            template.foods.length > 0 ? (
              <FlatList
                data={template.foods}
                keyExtractor={(
                  item
                ) => item.id}
                renderItem={
                  renderFood
                }
                contentContainerStyle={
                  styles.foodList
                }
                showsVerticalScrollIndicator={
                  false
                }
                keyboardShouldPersistTaps="handled"
              />
            ) : (
              <View
                style={
                  styles.noFoodContainer
                }
              >
                <Text
                  style={
                    styles.noFoodTitle
                  }
                >
                  NO FOODS YET
                </Text>

                <Text
                  style={
                    styles.noFoodText
                  }
                >
                  Add everything you
                  normally eat in a day.
                </Text>
              </View>
            )}
          </>
        ) : (
          <View
            style={
              styles.createInfo
            }
          >
            <Text
              style={
                styles.createInfoTitle
              }
            >
              BUILD YOUR DAILY PLAN
            </Text>

            <Text
              style={
                styles.createInfoText
              }
            >
              Give this template a name,
              then we'll add your foods
              one by one.
            </Text>
          </View>
        )}


        <View
          style={styles.bottomBar}
        >
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              saving &&
                styles.disabled,
              pressed &&
                !saving &&
                styles.pressed,
            ]}
            disabled={saving}
            accessibilityRole="button"
            onPress={handleSave}
          >
            {saving ? (
              <ActivityIndicator
                color="#080A09"
              />
            ) : (
              <Text
                style={styles.saveButtonText}
              >
                {isEditing
                  ? 'SAVE CHANGES'
                  : 'CREATE TEMPLATE'}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080A09',
  },

  pressed: {
    opacity: 0.7,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 7,
    backgroundColor: '#111512',
    borderWidth: 1,
    borderColor: '#252B27',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    color: '#F4F7F2',
    fontSize: 23,
  },

  headerCenter: {
    marginLeft: 12,
  },

  eyebrow: {
    color: ACCENT,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },

  title: {
    color: '#F4F7F2',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 0.7,
    marginTop: 2,
  },

  nameSection: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },

  nameLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  sectionLabel: {
    color: '#8A938C',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  counter: {
    color: '#68716B',
    fontSize: 10,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },

  nameInput: {
    height: 48,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#29302B',
    backgroundColor: '#111512',
    color: '#F4F7F2',
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '800',
  },

  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 18,
    padding: 16,
    backgroundColor: '#111512',
    borderWidth: 1,
    borderColor: '#252B27',
    borderRadius: 9,
  },

  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  summaryBottom: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#252B27',
  },

  summaryMini: {
    flex: 1,
  },

  summaryMiniValue: {
    color: '#DDE4DD',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 3,
    fontVariant: ['tabular-nums'],
  },

  summaryLabel: {
    color: '#8A938C',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  summaryCalories: {
    color: '#F4F7F2',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },

  summaryRight: {
    alignItems: 'flex-end',
  },

  summaryProtein: {
    color: ACCENT,
    fontSize: 22,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },

  foodHeader: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  sectionTitle: {
    color: '#F4F7F2',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },

  addFoodButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 5,
    backgroundColor: ACCENT,
  },

  addFoodText: {
    color: '#080A09',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  foodList: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },

  foodCard: {
    backgroundColor: '#111512',
    borderWidth: 1,
    borderColor: '#252B27',
    borderRadius: 8,
    padding: 14,
    marginBottom: 9,
  },

  foodMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  foodName: {
    flex: 1,
    color: '#F4F7F2',
    fontSize: 14,
    fontWeight: '900',
  },

  foodQuantity: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 10,
  },

  foodNutrition: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#252B27',
    flexDirection: 'row',
    alignItems: 'center',
  },

  foodStat: {
    marginRight: 18,
  },

  foodStatValue: {
    color: '#DDE4DD',
    fontSize: 11,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },

  foodStatLabel: {
    color: '#79847C',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },

  foodDelete: {
    marginLeft: 'auto',
    width: 30,
    height: 30,
    borderRadius: 5,
    backgroundColor: '#1B211D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  foodDeletePressed: {
    backgroundColor: '#2A1F1F',
  },

  foodDeleteText: {
    color: '#FF6B6B',
    fontSize: 21,
  },

  noFoodContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingTop: 45,
  },

  noFoodTitle: {
    color: '#F4F7F2',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },

  noFoodText: {
    color: '#7D877F',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 7,
  },

  createInfo: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 18,
    borderRadius: 9,
    backgroundColor: '#111512',
    borderWidth: 1,
    borderColor: '#252B27',
  },

  createInfoTitle: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },

  createInfoText: {
    color: '#8A938C',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
  },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#080A09',
    borderTopWidth: 1,
    borderTopColor: '#1D231F',
  },

  saveButton: {
    height: 48,
    backgroundColor: ACCENT,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonText: {
    color: '#080A09',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  disabled: {
    opacity: 0.6,
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: '#8A938C',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});