import {
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

import type {
  FoodUnit,
} from '../../types/diet';


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
function parseNumber(
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
    params.templateId;


  const {
    profile,
    isLoading: profileLoading,
  } = useProfile();

  const profileId =
    profile?.id ?? null;


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

  const [saving, setSaving] =
    useState(false);

  const quantityRef =
    useRef<TextInput>(null);


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

    if (!trimmedName) {
      Alert.alert(
        'FOOD NAME',
        'Enter the food name.'
      );

      return;
    }


    const parsedQuantity =
      parseNumber(quantity);

    if (
      parsedQuantity <= 0
    ) {
      Alert.alert(
        'QUANTITY',
        'Enter a valid quantity.'
      );

      return;
    }


    const parsedCalories =
      parseNumber(calories);

    const parsedProtein =
      parseNumber(protein);

    const parsedCarbs =
      parseNumber(carbs);

    const parsedFat =
      parseNumber(fat);


    if (
      parsedCalories < 0 ||
      parsedProtein < 0 ||
      parsedCarbs < 0 ||
      parsedFat < 0
    ) {
      Alert.alert(
        'NUTRITION',
        'Nutrition values cannot be negative.'
      );

      return;
    }


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
        'Failed to add food:',
        error
      );

      Alert.alert(
        'ERROR',
        'Could not add this food.'
      );
    } finally {
      setSaving(false);
    }
  }


  if (profileLoading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={styles.loading}
        >
          <ActivityIndicator
            color="#A8FF3E"
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
   * Live preview — starts as an example and
   * turns into what you're actually adding.
   */
  const hasInput =
    foodName.trim() !== '' ||
    quantity !== '' ||
    calories !== '' ||
    protein !== '';

  const previewText = hasInput
    ? `${foodName.trim() || 'Food'} · ${
        quantity || '0'
      } ${unit} · ${Math.round(
        parseNumber(calories)
      )} kcal · ${parseNumber(
        protein
      )}g protein`
    : 'Chicken · 150g · 250 kcal · 45g protein';


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
            style={styles.headerText}
          >
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


        <ScrollView
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === 'ios'
              ? 'interactive'
              : 'on-drag'
          }
        >
          <View
            style={styles.section}
          >
            <Text
              style={styles.sectionLabel}
            >
              FOOD
            </Text>

            <TextInput
              value={foodName}
              onChangeText={
                setFoodName
              }
              placeholder="Chicken breast"
              placeholderTextColor="#5A635C"
              style={styles.input}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() =>
                quantityRef.current?.focus()
              }
            />
          </View>


          <View
            style={styles.section}
          >
            <Text
              style={styles.sectionLabel}
            >
              QUANTITY
            </Text>

            <TextInput
              ref={quantityRef}
              value={quantity}
              onChangeText={
                setQuantity
              }
              placeholder="150"
              placeholderTextColor="#5A635C"
              style={styles.input}
              keyboardType="decimal-pad"
              selectTextOnFocus
            />
          </View>


          <View
            style={styles.section}
          >
            <Text
              style={styles.sectionLabel}
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
          </View>


          <View
            style={styles.section}
          >
            <Text
              style={styles.sectionLabel}
            >
              NUTRITION
            </Text>


            <NutritionInput
              label="CALORIES"
              value={calories}
              onChangeText={
                setCalories
              }
              placeholder="250"
              suffix="kcal"
            />


            <NutritionInput
              label="PROTEIN"
              value={protein}
              onChangeText={
                setProtein
              }
              placeholder="45"
              suffix="g"
            />


            <NutritionInput
              label="CARBS"
              value={carbs}
              onChangeText={
                setCarbs
              }
              placeholder="0"
              suffix="g"
            />


            <NutritionInput
              label="FAT"
              value={fat}
              onChangeText={
                setFat
              }
              placeholder="5"
              suffix="g"
            />
          </View>


          <View
            style={styles.exampleCard}
          >
            <Text
              style={
                styles.exampleTitle
              }
            >
              {hasInput
                ? 'PREVIEW'
                : 'EXAMPLE'}
            </Text>

            <Text
              style={[
                styles.exampleText,
                hasInput &&
                  styles.previewText,
              ]}
            >
              {previewText}
            </Text>
          </View>
        </ScrollView>


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
                style={
                  styles.saveButtonText
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
 * NUTRITION INPUT
 * ========================================
 */

type NutritionInputProps = {
  label: string;

  value: string;

  onChangeText:
    (value: string) => void;

  placeholder: string;

  suffix: string;
};


function NutritionInput({
  label,
  value,
  onChangeText,
  placeholder,
  suffix,
}: NutritionInputProps) {
  return (
    <View
      style={styles.nutritionRow}
    >
      <Text
        style={styles.nutritionLabel}
      >
        {label}
      </Text>


      <View
        style={
          styles.nutritionInputWrapper
        }
      >
        <TextInput
          value={value}
          onChangeText={
            onChangeText
          }
          placeholder={placeholder}
          placeholderTextColor="#5A635C"
          style={
            styles.nutritionInput
          }
          keyboardType="decimal-pad"
          selectTextOnFocus
        />

        <Text
          style={styles.suffix}
        >
          {suffix}
        </Text>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080A09',
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

  headerText: {
    marginLeft: 12,
  },

  eyebrow: {
    color: '#A8FF3E',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.7,
  },

  title: {
    color: '#F4F7F2',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 0.7,
    marginTop: 2,
  },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },

  section: {
    marginBottom: 20,
  },

  sectionLabel: {
    color: '#8A938C',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
  },

  input: {
    height: 48,
    backgroundColor: '#111512',
    borderWidth: 1,
    borderColor: '#29302B',
    borderRadius: 7,
    paddingHorizontal: 14,
    color: '#F4F7F2',
    fontSize: 14,
    fontWeight: '700',
  },

  unitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  unitButton: {
    minWidth: 70,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#29302B',
    backgroundColor: '#111512',
    alignItems: 'center',
  },

  unitButtonActive: {
    backgroundColor: '#A8FF3E',
    borderColor: '#A8FF3E',
  },

  unitText: {
    color: '#9AA39C',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  unitTextActive: {
    color: '#080A09',
  },

  nutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },

  nutritionLabel: {
    width: 90,
    color: '#AAB2AC',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  nutritionInputWrapper: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111512',
    borderWidth: 1,
    borderColor: '#29302B',
    borderRadius: 7,
  },

  nutritionInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 13,
    color: '#F4F7F2',
    fontSize: 13,
    fontWeight: '800',
  },

  suffix: {
    color: '#79847C',
    fontSize: 10,
    fontWeight: '900',
    paddingRight: 13,
  },

  exampleCard: {
    padding: 14,
    borderRadius: 7,
    backgroundColor: '#101411',
    borderWidth: 1,
    borderColor: '#252B27',
  },

  exampleTitle: {
    color: '#A8FF3E',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  exampleText: {
    color: '#8A938C',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  previewText: {
    color: '#DDE4DD',
    fontWeight: '700',
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
    backgroundColor: '#A8FF3E',
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

  pressed: {
    opacity: 0.7,
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  loadingText: {
    color: '#8A938C',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});