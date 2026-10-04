
import React, {
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import {
  addDietTemplateFood,
} from '../../database/dietRepository';

import { useProfile } from '../../context/ProfileContext';

import {
  FOOD_DATABASE,
  type BuiltInFood,
} from '../../data/foodDatabase';

import {
  calculateFoodNutrition,
} from '../../utils/foodNutrition';

import type {
  FoodUnit,
} from '../../types/diet';


const ACCENT = '#A8FF3E';

const UNITS: FoodUnit[] = [
  'g',
  'ml',
  'piece',
  'scoop',
  'serving',
  'cup',
  'tbsp',
  'tsp',
];


/*
 * Accepts both "1.5" and "1,5".
 */
function numberValue(
  value: string
): number {
  const parsed =
    Number(
      value.replace(',', '.')
    );

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}


export default function DietTemplateFoodScreen() {
  const router = useRouter();

  const params =
    useLocalSearchParams<{
      templateId?: string;
    }>();

  const templateId =
    typeof params.templateId === 'string'
      ? params.templateId
      : undefined;


  const {
    profile,
    isLoading: profileLoading,
  } = useProfile();

  const profileId =
    profile?.id ?? null;


  /*
   * ========================================
   * FOOD DATA
   * ========================================
   */

  const [foodName, setFoodName] =
    useState('');

  const [quantity, setQuantity] =
    useState('');

  const [unit, setUnit] =
    useState<FoodUnit>('g');


  /*
   * ========================================
   * CUSTOM FOOD NUTRITION
   * ========================================
   */

  const [calories, setCalories] =
    useState('');

  const [protein, setProtein] =
    useState('');

  const [carbs, setCarbs] =
    useState('');

  const [fat, setFat] =
    useState('');


  /*
   * ========================================
   * BUILT-IN FOOD SELECTION
   * ========================================
   */

  const [selectedFood, setSelectedFood] =
    useState<BuiltInFood | null>(null);

  const [foodSearch, setFoodSearch] =
    useState('');

  const [showFoodPicker, setShowFoodPicker] =
    useState(true);

  const [customFood, setCustomFood] =
    useState(false);


  const [saving, setSaving] =
    useState(false);

  const quantityRef =
    useRef<TextInput>(null);


  /*
   * ========================================
   * FOOD SEARCH
   * ========================================
   */

  const filteredFoods =
    FOOD_DATABASE.filter(
      (food) => {
        const search =
          foodSearch
            .trim()
            .toLowerCase();

        if (!search) {
          return true;
        }

        return food.name
          .toLowerCase()
          .includes(search);
      }
    );


  /*
   * ========================================
   * CALCULATED NUTRITION
   * ========================================
   */

  const parsedFoodQuantity =
    numberValue(quantity);

  const calculatedNutrition =
    selectedFood && !customFood
      ? calculateFoodNutrition(
          selectedFood,
          parsedFoodQuantity
        )
      : null;


  /*
   * ========================================
   * SELECT BUILT-IN FOOD
   * ========================================
   */

  function selectBuiltInFood(
    food: BuiltInFood
  ) {
    setSelectedFood(food);

    setFoodName(
      food.name
    );

    setUnit(
      food.unit
    );

    setQuantity('');

    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');

    setFoodSearch('');
    setShowFoodPicker(false);
    setCustomFood(false);

    setTimeout(() => {
      quantityRef.current?.focus();
    }, 100);
  }


  /*
   * ========================================
   * CHANGE BUILT-IN FOOD
   * ========================================
   */

  function changeBuiltInFood() {
    setSelectedFood(null);
    setFoodSearch('');
    setShowFoodPicker(true);
    setCustomFood(false);
  }


  /*
   * ========================================
   * CUSTOM FOOD
   * ========================================
   */

  function switchToCustomFood() {
    setSelectedFood(null);
    setShowFoodPicker(false);
    setCustomFood(true);

    setFoodName('');
    setQuantity('');
    setUnit('g');

    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
  }


  /*
   * ========================================
   * SAVE
   * ========================================
   */

  async function handleSave() {
    if (profileLoading) {
      return;
    }

    if (!profileId) {
      Alert.alert(
        'PROFILE',
        'No active profile found.'
      );

      return;
    }

    if (!templateId) {
      Alert.alert(
        'ERROR',
        'Template ID is missing.'
      );

      return;
    }


    const trimmedName =
      foodName.trim();

    const parsedQuantity =
      numberValue(quantity);


    /*
     * Built-in food:
     * nutrition is calculated automatically.
     *
     * Custom food:
     * nutrition comes from manual inputs.
     */

    const nutrition =
      selectedFood && !customFood
        ? calculateFoodNutrition(
            selectedFood,
            parsedQuantity
          )
        : {
            calories:
              numberValue(calories),

            protein:
              numberValue(protein),

            carbs:
              numberValue(carbs),

            fat:
              numberValue(fat),
          };


    const parsedCalories =
      nutrition.calories;

    const parsedProtein =
      nutrition.protein;

    const parsedCarbs =
      nutrition.carbs;

    const parsedFat =
      nutrition.fat;


    /*
     * ========================================
     * VALIDATION
     * ========================================
     */

    if (!trimmedName) {
      Alert.alert(
        'FOOD',
        'Enter a food name.'
      );

      return;
    }


    if (
      parsedQuantity <= 0
    ) {
      Alert.alert(
        'FOOD',
        'Quantity must be greater than 0.'
      );

      return;
    }


    if (
      parsedCalories < 0 ||
      parsedProtein < 0 ||
      parsedCarbs < 0 ||
      parsedFat < 0
    ) {
      Alert.alert(
        'FOOD',
        'Nutrition values cannot be negative.'
      );

      return;
    }


    /*
     * ========================================
     * SAVE TO TEMPLATE
     * ========================================
     */

    try {
      setSaving(true);

      await addDietTemplateFood(
        profileId,
        templateId,
        {
          foodName:
            trimmedName,

          quantity:
            parsedQuantity,

          unit,

          calories:
            parsedCalories,

          protein:
            parsedProtein,

          carbs:
            parsedCarbs,

          fat:
            parsedFat,

          sortOrder: 0,
        }
      );

      router.back();
    } catch (error) {
      console.error(
        'Failed to add template food:',
        error
      );

      Alert.alert(
        'DIET TEMPLATE',
        'Unable to save this food.'
      );
    } finally {
      setSaving(false);
    }
  }


  /*
   * ========================================
   * LOADING
   * ========================================
   */

  if (profileLoading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={styles.loading}
        >
          <ActivityIndicator
            color={ACCENT}
          />

          <Text
            style={styles.loadingText}
          >
            LOADING PROFILE...
          </Text>
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


  /*
   * ========================================
   * PREVIEW
   * ========================================
   */

  const hasInput =
    foodName.trim() !== '' ||
    quantity !== '';

  const previewNutrition =
    selectedFood && !customFood
      ? calculatedNutrition
      : {
          calories:
            numberValue(calories),

          protein:
            numberValue(protein),

          carbs:
            numberValue(carbs),

          fat:
            numberValue(fat),
        };

  const previewText =
    hasInput
      ? `${foodName.trim() || 'Food'} · ${
          quantity || '0'
        } ${unit} · ${Math.round(
          previewNutrition?.calories ?? 0
        )} kcal · ${
          previewNutrition?.protein ?? 0
        }g protein`
      : 'Chicken · 150g · 248 kcal · 46.5g protein';


  /*
   * ========================================
   * UI
   * ========================================
   */

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
        <ScrollView
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === 'ios'
              ? 'interactive'
              : 'on-drag'
          }
          showsVerticalScrollIndicator={
            false
          }
        >

          {/* ========================================
              HEADER
          ======================================== */}

          <View style={styles.header}>
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
                ‹
              </Text>
            </Pressable>

            <View>
              <Text
                style={styles.eyebrow}
              >
                DIET TEMPLATE
              </Text>

              <Text
                style={styles.title}
              >
                ADD FOOD
              </Text>
            </View>
          </View>


          {/* ========================================
              BUILT-IN FOOD PICKER
          ======================================== */}

          {showFoodPicker ? (
            <View
              style={
                styles.foodPicker
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                SELECT FOOD
              </Text>


              <View
                style={
                  styles.searchWrapper
                }
              >
                <TextInput
                  value={
                    foodSearch
                  }
                  onChangeText={
                    setFoodSearch
                  }
                  placeholder={
                    'Search chicken, eggs, rice...'
                  }
                  placeholderTextColor={
                    '#5F5F5F'
                  }
                  autoCapitalize="none"
                  style={
                    styles.searchInput
                  }
                />
              </View>


              <View
                style={
                  styles.foodList
                }
              >
                {filteredFoods.map(
                  (food) => (
                    <Pressable
                      key={food.id}
                      onPress={() =>
                        selectBuiltInFood(
                          food
                        )
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${food.name}`}
                      style={({
                        pressed,
                      }) => [
                        styles.foodOption,
                        pressed &&
                          styles.pressed,
                      ]}
                    >
                      <View
                        style={
                          styles.foodOptionMain
                        }
                      >
                        <Text
                          style={
                            styles.foodOptionName
                          }
                        >
                          {food.name}
                        </Text>

                        <Text
                          style={
                            styles.foodOptionMeta
                          }
                        >
                          {food.category}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.foodOptionNutrition
                        }
                      >
                        <Text
                          style={
                            styles.foodOptionCalories
                          }
                        >
                          {food.calories}{' '}
                          kcal
                        </Text>

                        <Text
                          style={
                            styles.foodOptionProtein
                          }
                        >
                          {food.protein}g P
                        </Text>
                      </View>
                    </Pressable>
                  )
                )}
              </View>


              {filteredFoods.length ===
              0 ? (
                <View
                  style={
                    styles.noFoods
                  }
                >
                  <Text
                    style={
                      styles.noFoodsText
                    }
                  >
                    NO MATCHING FOOD
                  </Text>
                </View>
              ) : null}


              <Pressable
                onPress={
                  switchToCustomFood
                }
                style={({ pressed }) => [
                  styles.customFoodButton,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Text
                  style={
                    styles.customFoodText
                  }
                >
                  + CUSTOM FOOD
                </Text>
              </Pressable>
            </View>
          ) : null}


          {/* ========================================
              SELECTED BUILT-IN FOOD
          ======================================== */}

          {selectedFood &&
          !customFood ? (
            <View
              style={
                styles.selectedFood
              }
            >
              <View
                style={
                  styles.selectedFoodMain
                }
              >
                <Text
                  style={styles.label}
                >
                  FOOD
                </Text>

                <Text
                  style={
                    styles.selectedFoodName
                  }
                >
                  {selectedFood.name}
                </Text>
              </View>

              <Pressable
                onPress={
                  changeBuiltInFood
                }
                style={({ pressed }) => [
                  styles.changeFoodButton,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Text
                  style={
                    styles.changeFoodText
                  }
                >
                  CHANGE
                </Text>
              </Pressable>
            </View>
          ) : null}


          {/* ========================================
              CUSTOM FOOD NAME
          ======================================== */}

          {customFood ? (
            <Field
              label="FOOD NAME"
              value={foodName}
              onChangeText={
                setFoodName
              }
              placeholder="e.g. Homemade chicken"
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() =>
                quantityRef.current?.focus()
              }
            />
          ) : null}


          {/* ========================================
              QUANTITY
          ======================================== */}

          <Field
            label="QUANTITY"
            value={quantity}
            onChangeText={
              setQuantity
            }
            placeholder={
              selectedFood
                ? String(
                    selectedFood.baseQuantity
                  )
                : '150'
            }
            keyboardType="decimal-pad"
            inputRef={quantityRef}
            suffix={
              selectedFood
                ? selectedFood.unit
                : undefined
            }
          />


          {/* ========================================
              UNIT
          ======================================== */}

          <Text
            style={styles.label}
          >
            UNIT
          </Text>

          <View
            style={styles.unitGrid}
          >
            {UNITS.map(
              (item) => {
                const selected =
                  unit === item;

                return (
                  <Pressable
                    key={item}
                    onPress={() =>
                      setUnit(item)
                    }
                    accessibilityRole="button"
                    accessibilityState={{
                      selected,
                    }}
                    style={({
                      pressed,
                    }) => [
                      styles.unitButton,
                      selected &&
                        styles.unitButtonActive,
                      pressed &&
                        !selected &&
                        styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.unitText,
                        selected &&
                          styles.unitTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </View>


          {/* ========================================
              NUTRITION
          ======================================== */}

          <Text
            style={
              styles.sectionTitle
            }
          >
            NUTRITION
          </Text>


          {selectedFood &&
          !customFood ? (
            <View
              style={
                styles.calculatedNutrition
              }
            >
              <View
                style={
                  styles.calculatedItem
                }
              >
                <Text
                  style={
                    styles.calculatedValue
                  }
                >
                  {calculatedNutrition
                    ?.calories ?? 0}
                </Text>

                <Text
                  style={
                    styles.calculatedLabel
                  }
                >
                  KCAL
                </Text>
              </View>


              <View
                style={
                  styles.calculatedItem
                }
              >
                <Text
                  style={
                    styles.calculatedValue
                  }
                >
                  {calculatedNutrition
                    ?.protein ?? 0}
                </Text>

                <Text
                  style={
                    styles.calculatedLabel
                  }
                >
                  PROTEIN
                </Text>
              </View>


              <View
                style={
                  styles.calculatedItem
                }
              >
                <Text
                  style={
                    styles.calculatedValue
                  }
                >
                  {calculatedNutrition
                    ?.carbs ?? 0}
                </Text>

                <Text
                  style={
                    styles.calculatedLabel
                  }
                >
                  CARBS
                </Text>
              </View>


              <View
                style={
                  styles.calculatedItem
                }
              >
                <Text
                  style={
                    styles.calculatedValue
                  }
                >
                  {calculatedNutrition
                    ?.fat ?? 0}
                </Text>

                <Text
                  style={
                    styles.calculatedLabel
                  }
                >
                  FAT
                </Text>
              </View>
            </View>
          ) : (
            <>
              <View
                style={
                  styles.nutritionRow
                }
              >
                <Field
                  label="CALORIES"
                  value={calories}
                  onChangeText={
                    setCalories
                  }
                  placeholder="0"
                  keyboardType="decimal-pad"
                  suffix="kcal"
                  style={
                    styles.half
                  }
                />

                <Field
                  label="PROTEIN"
                  value={protein}
                  onChangeText={
                    setProtein
                  }
                  placeholder="0"
                  keyboardType="decimal-pad"
                  suffix="g"
                  style={
                    styles.half
                  }
                />
              </View>


              <View
                style={
                  styles.nutritionRow
                }
              >
                <Field
                  label="CARBS"
                  value={carbs}
                  onChangeText={
                    setCarbs
                  }
                  placeholder="0"
                  keyboardType="decimal-pad"
                  suffix="g"
                  style={
                    styles.half
                  }
                />

                <Field
                  label="FAT"
                  value={fat}
                  onChangeText={
                    setFat
                  }
                  placeholder="0"
                  keyboardType="decimal-pad"
                  suffix="g"
                  style={
                    styles.half
                  }
                />
              </View>
            </>
          )}


          {/* ========================================
              PREVIEW
          ======================================== */}

          <View
            style={styles.note}
          >
            <Text
              style={styles.noteTitle}
            >
              {hasInput
                ? 'PREVIEW'
                : 'EXAMPLE'}
            </Text>

            <Text
              style={[
                styles.noteText,
                hasInput &&
                  styles.previewText,
              ]}
            >
              {previewText}
            </Text>
          </View>


          {/* ========================================
              SNAPSHOT NOTE
          ======================================== */}

          <View
            style={styles.snapshotNote}
          >
            <Text
              style={styles.snapshotTitle}
            >
              TEMPLATE FOOD
            </Text>

            <Text
              style={styles.snapshotText}
            >
              The calculated nutrition is
              saved with this template food.
              Changing the built-in food
              database later will not change
              this template automatically.
            </Text>
          </View>

        </ScrollView>


        {/* ========================================
            SAVE BAR
        ======================================== */}

        <View
          style={styles.bottomBar}
        >
          <Pressable
            disabled={saving}
            onPress={handleSave}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.saveButton,

              saving &&
                styles.saveButtonDisabled,

              pressed &&
                !saving &&
                styles.pressed,
            ]}
          >
            {saving ? (
              <ActivityIndicator
                color="#090909"
              />
            ) : (
              <Text
                style={
                  styles.saveText
                }
              >
                ADD FOOD
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


/*
 * ========================================
 * FIELD COMPONENT
 * ========================================
 */

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  suffix,
  autoCapitalize,
  returnKeyType,
  onSubmitEditing,
  inputRef,
  style,
}: {
  label: string;

  value: string;

  onChangeText: (
    value: string
  ) => void;

  placeholder: string;

  keyboardType?:
    | 'default'
    | 'decimal-pad'
    | 'numeric';

  suffix?: string;

  autoCapitalize?:
    | 'none'
    | 'sentences'
    | 'words'
    | 'characters';

  returnKeyType?:
    | 'next'
    | 'done';

  onSubmitEditing?: () => void;

  inputRef?: React.RefObject<
    TextInput | null
  >;

  style?: object;
}) {
  return (
    <View
      style={[
        styles.field,
        style,
      ]}
    >
      <Text
        style={styles.label}
      >
        {label}
      </Text>

      <View
        style={
          styles.inputWrapper
        }
      >
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={
            onChangeText
          }
          placeholder={
            placeholder
          }
          placeholderTextColor={
            '#5F5F5F'
          }
          keyboardType={
            keyboardType
          }
          autoCapitalize={
            autoCapitalize
          }
          returnKeyType={
            returnKeyType
          }
          onSubmitEditing={
            onSubmitEditing
          }
          selectTextOnFocus
          style={
            styles.input
          }
        />

        {suffix ? (
          <Text
            style={
              styles.suffix
            }
          >
            {suffix}
          </Text>
        ) : null}
      </View>
    </View>
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
    backgroundColor: '#090909',
  },

  content: {
    padding: 18,
    paddingBottom: 140,
  },

  pressed: {
    opacity: 0.7,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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

  /*
   * ========================================
   * FOOD PICKER
   * ========================================
   */

  foodPicker: {
    marginBottom: 20,
  },

  searchWrapper: {
    height: 48,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#292929',
    borderRadius: 8,
    marginBottom: 10,
  },

  searchInput: {
    flex: 1,
    color: '#F2F2F2',
    paddingHorizontal: 13,
    fontSize: 14,
    fontWeight: '700',
  },

  foodList: {
    gap: 7,
  },

  foodOption: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#292929',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  foodOptionMain: {
    flex: 1,
    paddingRight: 10,
  },

  foodOptionName: {
    color: '#F2F2F2',
    fontSize: 13,
    fontWeight: '800',
  },

  foodOptionMeta: {
    color: '#666',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 4,
  },

  foodOptionNutrition: {
    alignItems: 'flex-end',
  },

  foodOptionCalories: {
    color: ACCENT,
    fontSize: 11,
    fontWeight: '900',
  },

  foodOptionProtein: {
    color: '#777',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 3,
  },

  noFoods: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#292929',
    borderRadius: 8,
    paddingVertical: 18,
    alignItems: 'center',
  },

  noFoodsText: {
    color: '#666',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  customFoodButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#292929',
    borderRadius: 8,
    marginTop: 9,
    backgroundColor: '#101010',
  },

  customFoodText: {
    color: '#999',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  /*
   * ========================================
   * SELECTED FOOD
   * ========================================
   */

  selectedFood: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 8,
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginBottom: 15,
  },

  selectedFoodMain: {
    flex: 1,
    paddingRight: 10,
  },

  selectedFoodName: {
    color: '#F2F2F2',
    fontSize: 14,
    fontWeight: '800',
  },

  changeFoodButton: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },

  changeFoodText: {
    color: ACCENT,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  /*
   * ========================================
   * FIELDS
   * ========================================
   */

  field: {
    marginBottom: 15,
  },

  half: {
    flex: 1,
  },

  label: {
    color: '#8A8A8A',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 7,
  },

  inputWrapper: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#292929',
    borderRadius: 8,
  },

  input: {
    flex: 1,
    height: '100%',
    color: '#F2F2F2',
    paddingHorizontal: 13,
    fontSize: 14,
    fontWeight: '700',
  },

  suffix: {
    color: '#6E6E6E',
    fontSize: 10,
    fontWeight: '900',
    paddingRight: 13,
  },

  /*
   * ========================================
   * UNIT
   * ========================================
   */

  unitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 26,
  },

  unitButton: {
    minWidth: 62,
    alignItems: 'center',
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#292929',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  unitButtonActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },

  unitText: {
    color: '#999',
    fontSize: 11,
    fontWeight: '800',
  },

  unitTextActive: {
    color: '#090909',
  },

  /*
   * ========================================
   * NUTRITION
   * ========================================
   */

  sectionTitle: {
    color: '#F2F2F2',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 13,
  },

  nutritionRow: {
    flexDirection: 'row',
    gap: 10,
  },

  calculatedNutrition: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#292929',
    borderRadius: 8,
    paddingVertical: 16,
    marginBottom: 15,
  },

  calculatedItem: {
    flex: 1,
    alignItems: 'center',
  },

  calculatedValue: {
    color: '#F2F2F2',
    fontSize: 16,
    fontWeight: '900',
  },

  calculatedLabel: {
    color: '#666',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: 4,
  },

  /*
   * ========================================
   * PREVIEW
   * ========================================
   */

  note: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#202020',
    borderRadius: 8,
    padding: 13,
    marginTop: 5,
  },

  noteTitle: {
    color: ACCENT,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  noteText: {
    color: '#7A7A7A',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  previewText: {
    color: '#DDE4DD',
    fontWeight: '700',
  },

  /*
   * ========================================
   * SNAPSHOT NOTE
   * ========================================
   */

  snapshotNote: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#202020',
    borderRadius: 8,
    padding: 13,
    marginTop: 10,
  },

  snapshotTitle: {
    color: ACCENT,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  snapshotText: {
    color: '#7A7A7A',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  /*
   * ========================================
   * BOTTOM BAR
   * ========================================
   */

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: '#090909',
    borderTopWidth: 1,
    borderTopColor: '#1C1C1C',
  },

  saveButton: {
    height: 50,
    backgroundColor: ACCENT,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveText: {
    color: '#090909',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  /*
   * ========================================
   * LOADING
   * ========================================
   */

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  loadingText: {
    color: '#8A8A8A',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
