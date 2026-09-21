import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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

import { useProfile } from '../../context/ProfileContext';

import {
  addDailyNutritionFood,
  getDailyNutritionFoods,
  updateDailyNutritionFood,
} from '../../database/dietRepository';

import {
  getOrCreateTodayNutrition,
} from '../../services/dietService';

import type {
  FoodUnit,
  DailyNutritionFood,
} from '../../types/diet';


const ACCENT = '#B8FF3D';

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
 * Accepts both "1.5" and "1,5" — some
 * keyboards/locales insert a comma.
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


export default function DailyFoodScreen() {
  const router = useRouter();

  const params =
    useLocalSearchParams<{
      foodId?: string;
    }>();

  const foodId =
    typeof params.foodId === 'string'
      ? params.foodId
      : undefined;

  const editing =
    Boolean(foodId);

  const {
    profile,
    isLoading: profileLoading,
  } = useProfile();

  const profileId =
    profile?.id ?? null;

  const [dailyNutritionId, setDailyNutritionId] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [foodName, setFoodName] =
    useState('');

  const [quantity, setQuantity] =
    useState('');

  const [unit, setUnit] =
    useState<FoodUnit>('g');

  const [calories, setCalories] =
    useState('');

  const [protein, setProtein] =
    useState('');

  const [carbs, setCarbs] =
    useState('');

  const [fat, setFat] =
    useState('');

  const quantityRef =
    useRef<TextInput>(null);


  useEffect(() => {
    async function load() {
      if (!profileId) {
        setLoading(false);
        return;
      }

      try {
        const nutrition =
          await getOrCreateTodayNutrition(
            profileId
          );

        setDailyNutritionId(
          nutrition.id
        );

        if (foodId) {
          const foods =
            await getDailyNutritionFoods(
              profileId,
              nutrition.id
            );

          const food =
            foods.find(
              (item) =>
                item.id === foodId
            );

          if (!food) {
            Alert.alert(
              'Food',
              'Food item not found.',
              [
                {
                  text: 'OK',
                  onPress: () =>
                    router.back(),
                },
              ]
            );

            return;
          }

          populateFood(food);
        }
      } catch (error) {
        console.error(
          'Failed to load daily food:',
          error
        );

        Alert.alert(
          'Diet',
          'Unable to load food.'
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [
    profileId,
    foodId,
  ]);


  function populateFood(
    food: DailyNutritionFood
  ) {
    setFoodName(
      food.foodName
    );

    setQuantity(
      String(food.quantity)
    );

    setUnit(
      food.unit
    );

    setCalories(
      String(food.calories)
    );

    setProtein(
      String(food.protein)
    );

    setCarbs(
      String(food.carbs)
    );

    setFat(
      String(food.fat)
    );
  }


  async function save() {
    if (
      !profileId ||
      !dailyNutritionId
    ) {
      return;
    }

    const trimmedName =
      foodName.trim();

    const parsedQuantity =
      numberValue(quantity);

    const parsedCalories =
      numberValue(calories);

    const parsedProtein =
      numberValue(protein);

    const parsedCarbs =
      numberValue(carbs);

    const parsedFat =
      numberValue(fat);


    if (!trimmedName) {
      Alert.alert(
        'Food',
        'Enter a food name.'
      );
      return;
    }


    if (
      parsedQuantity <= 0
    ) {
      Alert.alert(
        'Food',
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
        'Food',
        'Nutrition values cannot be negative.'
      );
      return;
    }


    try {
      setSaving(true);

      if (
        editing &&
        foodId
      ) {
        await updateDailyNutritionFood(
          profileId,
          foodId,
          {
            foodName: trimmedName,
            quantity: parsedQuantity,
            unit,
            calories: parsedCalories,
            protein: parsedProtein,
            carbs: parsedCarbs,
            fat: parsedFat,
          }
        );
      } else {
        await addDailyNutritionFood(
          profileId,
          dailyNutritionId,
          {
            foodName: trimmedName,
            quantity: parsedQuantity,
            unit,
            calories: parsedCalories,
            protein: parsedProtein,
            carbs: parsedCarbs,
            fat: parsedFat,
            sortOrder: 999,
          }
        );
      }

      router.back();
    } catch (error) {
      console.error(
        'Failed to save daily food:',
        error
      );

      Alert.alert(
        'Diet',
        'Unable to save this food.'
      );
    } finally {
      setSaving(false);
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
        keyboardDismissMode={
          Platform.OS === 'ios'
            ? 'interactive'
            : 'on-drag'
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

          <View>
            <Text style={styles.eyebrow}>
              TODAY
            </Text>

            <Text style={styles.title}>
              {editing
                ? 'EDIT FOOD'
                : 'ADD FOOD'}
            </Text>
          </View>
        </View>


        <Field
          label="FOOD NAME"
          value={foodName}
          onChangeText={setFoodName}
          placeholder="e.g. Chicken breast"
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() =>
            quantityRef.current?.focus()
          }
        />


        <Field
          label="QUANTITY"
          value={quantity}
          onChangeText={setQuantity}
          placeholder="150"
          keyboardType="decimal-pad"
          inputRef={quantityRef}
        />


        <Text style={styles.label}>
          UNIT
        </Text>

        <View style={styles.unitGrid}>
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
                  style={({ pressed }) => [
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


        <Text style={styles.sectionTitle}>
          NUTRITION
        </Text>


        <View style={styles.nutritionRow}>
          <Field
            label="CALORIES"
            value={calories}
            onChangeText={setCalories}
            placeholder="0"
            keyboardType="decimal-pad"
            suffix="kcal"
            style={styles.half}
          />

          <Field
            label="PROTEIN"
            value={protein}
            onChangeText={setProtein}
            placeholder="0"
            keyboardType="decimal-pad"
            suffix="g"
            style={styles.half}
          />
        </View>


        <View style={styles.nutritionRow}>
          <Field
            label="CARBS"
            value={carbs}
            onChangeText={setCarbs}
            placeholder="0"
            keyboardType="decimal-pad"
            suffix="g"
            style={styles.half}
          />

          <Field
            label="FAT"
            value={fat}
            onChangeText={setFat}
            placeholder="0"
            keyboardType="decimal-pad"
            suffix="g"
            style={styles.half}
          />
        </View>


        <View style={styles.note}>
          <Text style={styles.noteTitle}>
            SNAPSHOT
          </Text>

          <Text style={styles.noteText}>
            These values belong to today&apos;s
            food record. Editing them will not
            change any diet template.
          </Text>
        </View>

      </ScrollView>


      <View style={styles.bottomBar}>
        <Pressable
          disabled={saving}
          onPress={save}
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
            <Text style={styles.saveText}>
              {editing
                ? 'SAVE CHANGES'
                : 'ADD FOOD'}
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}


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
  returnKeyType?: 'next' | 'done';
  onSubmitEditing?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
  style?: object;
}) {
  return (
    <View
      style={[
        styles.field,
        style,
      ]}
    >
      <Text style={styles.label}>
        {label}
      </Text>

      <View style={styles.inputWrapper}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={
            onChangeText
          }
          placeholder={
            placeholder
          }
          placeholderTextColor="#5F5F5F"
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
          style={styles.input}
        />

        {suffix ? (
          <Text style={styles.suffix}>
            {suffix}
          </Text>
        ) : null}
      </View>
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
    paddingBottom: 120,
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
});