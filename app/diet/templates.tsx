import {
  useCallback,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useFocusEffect,
  useRouter,
} from 'expo-router';

import {
  deleteDietTemplate,
  getDietTemplates,
} from '../../database/dietRepository';

import { useProfile } from '../../context/ProfileContext';

import type {
  DietTemplate,
} from '../../types/diet';


const ACCENT = '#A8FF3E';


export default function DietTemplatesScreen() {
  const router = useRouter();

  const {
    profile,
    isLoading: profileLoading,
  } = useProfile();

  const profileId =
    profile?.id ?? null;

  const [templates, setTemplates] =
    useState<DietTemplate[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  /*
   * Only the very first load shows the
   * full-screen spinner. Coming back to this
   * screen refreshes silently instead of
   * flashing "LOADING..." every time.
   */
  const hasLoadedRef =
    useRef(false);


  const loadTemplates =
    useCallback(
      async () => {
        if (!profileId) {
          setTemplates([]);
          setLoading(false);
          setRefreshing(false);
          return;
        }

        try {
          if (!hasLoadedRef.current) {
            setLoading(true);
          }

          const result =
            await getDietTemplates(
              profileId
            );

          setTemplates(result);

          hasLoadedRef.current =
            true;
        } catch (error) {
          console.error(
            'Failed to load diet templates:',
            error
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [profileId]
    );


  useFocusEffect(
    useCallback(() => {
      if (!profileLoading) {
        loadTemplates();
      }
    }, [
      profileLoading,
      loadTemplates,
    ])
  );


  async function handleRefresh() {
    setRefreshing(true);
    await loadTemplates();
  }


  function handleDelete(
    template: DietTemplate
  ) {
    if (!profileId) {
      return;
    }

    Alert.alert(
      'DELETE TEMPLATE',
      `Delete "${template.name}"?`,
      [
        {
          text: 'CANCEL',
          style: 'cancel',
        },

        {
          text: 'DELETE',
          style: 'destructive',

          onPress: async () => {
            try {
              await deleteDietTemplate(
                profileId,
                template.id
              );

              await loadTemplates();
            } catch (error) {
              console.error(
                'Failed to delete template:',
                error
              );

              Alert.alert(
                'ERROR',
                'Could not delete the template.'
              );
            }
          },
        },
      ]
    );
  }


  function renderTemplate({
    item,
  }: {
    item: DietTemplate;
  }) {
    const totals =
      item.foods.reduce(
        (sum, food) => ({
          calories:
            sum.calories +
            food.calories,
          protein:
            sum.protein +
            food.protein,
          carbs:
            sum.carbs +
            food.carbs,
          fat:
            sum.fat + food.fat,
        }),
        {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        }
      );


    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit template ${item.name}`}
        style={({ pressed }) => [
          styles.templateCard,
          pressed &&
            styles.templateCardPressed,
        ]}
        onPress={() =>
          router.push({
            pathname:
              '/diet/template-create',

            params: {
              templateId:
                item.id,
            },
          })
        }
      >
        <View
          style={styles.cardTop}
        >
          <View
            style={
              styles.cardTitleContainer
            }
          >
            <Text
              numberOfLines={1}
              style={styles.templateName}
            >
              {item.name}
            </Text>

            <Text
              style={styles.foodCount}
            >
              {item.foods.length}{' '}
              {item.foods.length === 1
                ? 'FOOD'
                : 'FOODS'}
            </Text>
          </View>

          <Pressable
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Delete template ${item.name}`}
            style={({ pressed }) => [
              styles.deleteButton,
              pressed &&
                styles.deleteButtonPressed,
            ]}
            onPress={() =>
              handleDelete(item)
            }
          >
            <Text
              style={
                styles.deleteButtonText
              }
            >
              ×
            </Text>
          </Pressable>
        </View>


        <View
          style={styles.statsRow}
        >
          <View
            style={styles.stat}
          >
            <Text
              style={styles.statValue}
            >
              {Math.round(
                totals.calories
              )}
            </Text>

            <Text
              style={styles.statLabel}
            >
              KCAL
            </Text>
          </View>


          <View
            style={styles.divider}
          />


          <View
            style={styles.stat}
          >
            <Text
              style={[
                styles.statValue,
                styles.statAccent,
              ]}
            >
              {totals.protein.toFixed(1)}
              g
            </Text>

            <Text
              style={styles.statLabel}
            >
              PROTEIN
            </Text>
          </View>


          <View
            style={styles.divider}
          />


          <View
            style={styles.stat}
          >
            <Text
              style={styles.statValue}
            >
              {totals.carbs.toFixed(1)}
              g
            </Text>

            <Text
              style={styles.statLabel}
            >
              CARBS
            </Text>
          </View>


          <View
            style={styles.divider}
          />


          <View
            style={styles.stat}
          >
            <Text
              style={styles.statValue}
            >
              {totals.fat.toFixed(1)}
              g
            </Text>

            <Text
              style={styles.statLabel}
            >
              FAT
            </Text>
          </View>
        </View>


        <Text
          style={styles.editHint}
        >
          TAP TO EDIT →
        </Text>
      </Pressable>
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
          style={styles.emptyContainer}
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
          style={styles.emptyContainer}
        >
          <Text
            style={styles.emptyIcon}
          >
            !
          </Text>

          <Text
            style={styles.emptyTitle}
          >
            NO ACTIVE PROFILE
          </Text>

          <Text
            style={styles.emptySubtitle}
          >
            Please log in before using
            the Diet system.
          </Text>
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView
      style={styles.container}
    >
      <View
        style={styles.header}
      >
        <View
          style={styles.headerLeft}
        >
          {router.canGoBack() && (
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
          )}

          <View>
            <Text
              style={styles.eyebrow}
            >
              DIET
            </Text>

            <Text
              style={styles.title}
            >
              TEMPLATES
            </Text>
          </View>
        </View>


        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create a new template"
          style={({ pressed }) => [
            styles.addButton,
            pressed &&
              styles.pressed,
          ]}
          onPress={() =>
            router.push(
              '/diet/template-create'
            )
          }
        >
          <Text
            style={styles.addButtonText}
          >
            + NEW
          </Text>
        </Pressable>
      </View>


      {templates.length === 0 ? (
        <View
          style={styles.emptyContainer}
        >
          <Text
            style={styles.emptyIcon}
          >
            ◈
          </Text>

          <Text
            style={styles.emptyTitle}
          >
            NO TEMPLATES
          </Text>

          <Text
            style={styles.emptySubtitle}
          >
            Create your first daily
            nutrition template.
          </Text>


          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.createButton,
              pressed &&
                styles.pressed,
            ]}
            onPress={() =>
              router.push(
                '/diet/template-create'
              )
            }
          >
            <Text
              style={
                styles.createButtonText
              }
            >
              CREATE TEMPLATE
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) =>
            item.id
          }
          renderItem={
            renderTemplate
          }
          contentContainerStyle={
            styles.list
          }
          showsVerticalScrollIndicator={
            false
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={
                handleRefresh
              }
              tintColor={ACCENT}
              colors={[ACCENT]}
              progressBackgroundColor="#111512"
            />
          }
        />
      )}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    marginRight: 12,
  },

  backText: {
    color: '#F4F7F2',
    fontSize: 23,
  },

  eyebrow: {
    color: ACCENT,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },

  title: {
    color: '#F4F7F2',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 3,
  },

  addButton: {
    backgroundColor: ACCENT,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 6,
  },

  addButtonText: {
    color: '#080A09',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },

  list: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  templateCard: {
    backgroundColor: '#111512',
    borderWidth: 1,
    borderColor: '#252B27',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },

  templateCardPressed: {
    backgroundColor: '#151A17',
    borderColor: '#333B36',
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  cardTitleContainer: {
    flex: 1,
    marginRight: 10,
  },

  templateName: {
    color: '#F4F7F2',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  foodCount: {
    color: '#8B958D',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 5,
  },

  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#1B211D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteButtonPressed: {
    backgroundColor: '#2A1F1F',
  },

  deleteButtonText: {
    color: '#FF6B6B',
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '400',
  },

  statsRow: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#252B27',
    flexDirection: 'row',
    alignItems: 'center',
  },

  stat: {
    flex: 1,
    alignItems: 'center',
  },

  statValue: {
    color: '#F4F7F2',
    fontSize: 15,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },

  statAccent: {
    color: ACCENT,
  },

  statLabel: {
    color: '#7D877F',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 4,
  },

  divider: {
    width: 1,
    height: 28,
    backgroundColor: '#252B27',
  },

  editHint: {
    color: '#7D877F',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 15,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 35,
  },

  emptyIcon: {
    color: ACCENT,
    fontSize: 42,
    marginBottom: 14,
  },

  emptyTitle: {
    color: '#F4F7F2',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },

  emptySubtitle: {
    color: '#808A82',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
  },

  createButton: {
    backgroundColor: ACCENT,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 6,
    marginTop: 22,
  },

  createButtonText: {
    color: '#080A09',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
});