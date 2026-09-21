// import React, {
//   useCallback,
//   useEffect,
//   useRef,
//   useState,
// } from 'react';

// import {
//   ActivityIndicator,
//   Alert,
//   Animated,
//   Easing,
//   Pressable,
//   RefreshControl,
//   ScrollView,
//   StyleSheet,
//   Text,
//   View,
// } from 'react-native';

// import {
//   useFocusEffect,
//   useRouter,
// } from 'expo-router';

// import { useProfile } from '../../context/ProfileContext';

// import {
//   deleteDailyNutritionFood,
// } from '../../database/dietRepository';

// import {
//   getNutritionProgress,
//   getOrCreateTodayNutrition,
//   setWaterForDay,
// } from '../../services/dietService';

// import {
//   evaluatePreviousNutritionDays,
// } from '../../services/dietXPService';

// import type {
//   DailyNutrition,
//   NutritionProgress,
// } from '../../types/diet';


// const ACCENT = '#B8FF3D';
// const WARNING = '#FFB03D';


// function getTodayDate(): string {
//   const now = new Date();

//   return `${now.getFullYear()}-${String(
//     now.getMonth() + 1
//   ).padStart(2, '0')}-${String(
//     now.getDate()
//   ).padStart(2, '0')}`;
// }


// function formatDisplayDate(
//   isoDate: string
// ): string {
//   const [year, month, day] =
//     isoDate.split('-').map(Number);

//   const date = new Date(
//     year,
//     month - 1,
//     day
//   );

//   return date
//     .toLocaleDateString('en-US', {
//       weekday: 'short',
//       month: 'short',
//       day: 'numeric',
//     })
//     .toUpperCase();
// }


// function formatNumber(
//   value: number,
//   decimals = 0
// ): string {
//   return Number(
//     value.toFixed(decimals)
//   ).toString();
// }


// function remainingLabel(
//   total: number,
//   goal: number,
//   unit: string,
//   decimals = 0
// ): string {
//   const difference = goal - total;

//   if (difference >= 0) {
//     return `${formatNumber(
//       difference,
//       decimals
//     )} ${unit} left`;
//   }

//   return `${formatNumber(
//     Math.abs(difference),
//     decimals
//   )} ${unit} over`;
// }


// /*
//  * Animated fill: eases to the new value
//  * instead of jumping whenever data changes.
//  */
// function ProgressBar({
//   progress,
//   over = false,
// }: {
//   progress: number;
//   over?: boolean;
// }) {
//   const safeProgress =
//     Math.min(
//       100,
//       Math.max(0, progress)
//     );

//   const animated =
//     useRef(
//       new Animated.Value(0)
//     ).current;

//   useEffect(() => {
//     Animated.timing(animated, {
//       toValue: safeProgress,
//       duration: 600,
//       easing: Easing.out(
//         Easing.cubic
//       ),
//       useNativeDriver: false,
//     }).start();
//   }, [animated, safeProgress]);

//   const width =
//     animated.interpolate({
//       inputRange: [0, 100],
//       outputRange: ['0%', '100%'],
//     });

//   return (
//     <View style={styles.progressTrack}>
//       <Animated.View
//         style={[
//           styles.progressFill,
//           over &&
//             styles.progressFillOver,
//           { width },
//         ]}
//       />
//     </View>
//   );
// }


// export default function DietScreen() {
//   const router = useRouter();

//   const {
//     profile,
//     isLoading: profileLoading,
//   } = useProfile();

//   const profileId =
//     profile?.id ?? null;

//   const [nutrition, setNutrition] =
//     useState<DailyNutrition | null>(
//       null
//     );

//   const [progress, setProgress] =
//     useState<NutritionProgress | null>(
//       null
//     );

//   const [loading, setLoading] =
//     useState(true);

//   const [refreshing, setRefreshing] =
//     useState(false);

//   const [savingWater, setSavingWater] =
//     useState(false);

//   const today =
//     getTodayDate();


//   const loadToday =
//   useCallback(async () => {

//     if (!profileId) {
//       setNutrition(null);
//       setProgress(null);
//       setLoading(false);
//       return;
//     }


//     try {

//       /*
//        * ====================================
//        * EVALUATE PREVIOUS DIET DAYS
//        * ====================================
//        *
//        * This allows nutrition XP to be
//        * awarded even if the app was closed
//        * at midnight.
//        */

//       await evaluatePreviousNutritionDays(
//         profileId
//       );


//       /*
//        * ====================================
//        * LOAD TODAY
//        * ====================================
//        */

//       const todayNutrition =
//         await getOrCreateTodayNutrition(
//           profileId
//         );


//       const nutritionProgress =
//         await getNutritionProgress(
//           profileId,
//           today
//         );


//       setNutrition(
//         todayNutrition
//       );


//       setProgress(
//         nutritionProgress
//       );

//     } catch (error) {

//       console.error(
//         'Failed to load diet:',
//         error
//       );

//       Alert.alert(
//         'Diet',
//         'Unable to load today\'s nutrition.'
//       );

//     } finally {

//       setLoading(false);
//       setRefreshing(false);

//     }

//   }, [
//     profileId,
//     today,
//   ]);


//   useFocusEffect(
//     useCallback(() => {
//       loadToday();
//     }, [loadToday])
//   );


//   async function refresh() {
//     setRefreshing(true);
//     await loadToday();
//   }


//   async function changeWater(
//     amount: number
//   ) {
//     if (
//       !profileId ||
//       !nutrition ||
//       savingWater
//     ) {
//       return;
//     }

//     const nextAmount =
//       Math.max(
//         0,
//         nutrition.waterConsumed +
//           amount
//       );

//     try {
//       setSavingWater(true);

//       const updated =
//         await setWaterForDay(
//           profileId,
//           today,
//           nextAmount
//         );

//       if (updated) {
//         setNutrition(updated);
//       }

//       const updatedProgress =
//         await getNutritionProgress(
//           profileId,
//           today
//         );

//       setProgress(
//         updatedProgress
//       );
//     } catch (error) {
//       console.error(
//         'Failed to update water:',
//         error
//       );

//       Alert.alert(
//         'Water',
//         'Unable to update water intake.'
//       );
//     } finally {
//       setSavingWater(false);
//     }
//   }


//   async function deleteFood(
//     foodId: string
//   ) {
//     if (!profileId) {
//       return;
//     }

//     Alert.alert(
//       'Delete food?',
//       'This food will be removed from today\'s nutrition.',
//       [
//         {
//           text: 'Cancel',
//           style: 'cancel',
//         },
//         {
//           text: 'Delete',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               await deleteDailyNutritionFood(
//                 profileId,
//                 foodId
//               );

//               await loadToday();
//             } catch (error) {
//               console.error(
//                 'Failed to delete food:',
//                 error
//               );

//               Alert.alert(
//                 'Diet',
//                 'Unable to delete this food.'
//               );
//             }
//           },
//         },
//       ]
//     );
//   }


//   if (
//     profileLoading ||
//     loading
//   ) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator
//           size="large"
//           color={ACCENT}
//         />
//       </View>
//     );
//   }


//   if (!profileId) {
//     return (
//       <View style={styles.center}>
//         <Text style={styles.emptyTitle}>
//           PROFILE REQUIRED
//         </Text>

//         <Text style={styles.emptyText}>
//           Create or select a profile to
//           start tracking nutrition.
//         </Text>
//       </View>
//     );
//   }


//   if (!nutrition || !progress) {
//     return (
//       <View style={styles.center}>
//         <Text style={styles.emptyTitle}>
//           NO NUTRITION DATA
//         </Text>

//         <Pressable
//           onPress={loadToday}
//           accessibilityRole="button"
//           accessibilityLabel="Retry loading nutrition"
//           style={({ pressed }) => [
//             styles.primaryButton,
//             styles.retryButton,
//             pressed && styles.pressed,
//           ]}
//         >
//           <Text
//             style={
//               styles.primaryButtonText
//             }
//           >
//             RETRY
//           </Text>
//         </Pressable>
//       </View>
//     );
//   }


//   const caloriesOver =
//     progress.totals.calories >
//     nutrition.calorieGoal;

//   const waterMinusDisabled =
//     savingWater ||
//     nutrition.waterConsumed <= 0;


//   return (
//     <View style={styles.container}>
//       <ScrollView
//         contentContainerStyle={
//           styles.content
//         }
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={refresh}
//             tintColor={ACCENT}
//             colors={[ACCENT]}
//             progressBackgroundColor="#151515"
//           />
//         }
//         showsVerticalScrollIndicator={
//           false
//         }
//       >

//         {/* HEADER */}

//         <View style={styles.header}>
//           <Pressable
//             onPress={() =>
//               router.replace('/')
//             }
//             hitSlop={10}
//             accessibilityRole="button"
//             accessibilityLabel="Go back"
//             style={({ pressed }) => [
//               styles.backButton,
//               pressed && styles.pressed,
//             ]}
//           >
//             <Text
//               style={
//                 styles.backButtonText
//               }
//             >
//               ← BACK
//             </Text>
//           </Pressable>

//           <Pressable
//   onPress={() =>
//     router.push(
//       '/diet/history'
//     )
//   }
//   accessibilityRole="button"
//   accessibilityLabel="View diet history"
//   style={({ pressed }) => [
//     styles.historyButton,
//     pressed &&
//       styles.pressed,
//   ]}
// >
//   <Text
//     style={
//       styles.historyButtonText
//     }
//   >
//     VIEW HISTORY →
//   </Text>
// </Pressable>

//           <View style={styles.headerMain}>
//             <View>
//               <Text style={styles.eyebrow}>
//                 DAILY NUTRITION
//               </Text>

//               <Text style={styles.title}>
//                 TODAY
//               </Text>
//             </View>

//             <Text style={styles.date}>
//               {formatDisplayDate(today)}
//             </Text>
//           </View>
//         </View>


//         {/* SUMMARY */}

//         <View style={styles.summaryCard}>
//           <View style={styles.summaryHeader}>
//             <Text style={styles.cardTitle}>
//               NUTRITION
//             </Text>

//             <Text style={styles.goalText}>
//               TARGETS
//             </Text>
//           </View>


//           <View style={styles.metric}>
//             <View style={styles.metricTop}>
//               <Text style={styles.metricName}>
//                 CALORIES
//               </Text>

//               <Text style={styles.metricValue}>
//                 {formatNumber(
//                   progress.totals.calories
//                 )}
//                 {' / '}
//                 {formatNumber(
//                   nutrition.calorieGoal
//                 )}
//                 {' kcal'}
//               </Text>
//             </View>

//             <ProgressBar
//               progress={
//                 progress.caloriePercent
//               }
//               over={caloriesOver}
//             />

//             <View style={styles.metricBottom}>
//               <Text style={styles.metricPercent}>
//                 {Math.round(
//                   progress.caloriePercent
//                 )}
//                 %
//               </Text>

//               <Text
//                 style={[
//                   styles.metricRemaining,
//                   caloriesOver &&
//                     styles.metricOver,
//                 ]}
//               >
//                 {remainingLabel(
//                   progress.totals.calories,
//                   nutrition.calorieGoal,
//                   'kcal'
//                 )}
//               </Text>
//             </View>
//           </View>


//           <View style={styles.metric}>
//             <View style={styles.metricTop}>
//               <Text style={styles.metricName}>
//                 PROTEIN
//               </Text>

//               <Text style={styles.metricValue}>
//                 {formatNumber(
//                   progress.totals.protein,
//                   1
//                 )}
//                 {' / '}
//                 {formatNumber(
//                   nutrition.proteinGoal,
//                   1
//                 )}
//                 {' g'}
//               </Text>
//             </View>

//             <ProgressBar
//               progress={
//                 progress.proteinPercent
//               }
//             />

//             <View style={styles.metricBottom}>
//               <Text style={styles.metricPercent}>
//                 {Math.round(
//                   progress.proteinPercent
//                 )}
//                 %
//               </Text>

//               <Text
//                 style={
//                   styles.metricRemaining
//                 }
//               >
//                 {remainingLabel(
//                   progress.totals.protein,
//                   nutrition.proteinGoal,
//                   'g',
//                   1
//                 )}
//               </Text>
//             </View>
//           </View>


//           <View
//             style={[
//               styles.metric,
//               {
//                 marginBottom: 0,
//               },
//             ]}
//           >
//             <View style={styles.metricTop}>
//               <Text style={styles.metricName}>
//                 WATER
//               </Text>

//               <Text style={styles.metricValue}>
//                 {formatNumber(
//                   nutrition.waterConsumed,
//                   2
//                 )}
//                 {' / '}
//                 {formatNumber(
//                   nutrition.waterGoal,
//                   2
//                 )}
//                 {' L'}
//               </Text>
//             </View>

//             <ProgressBar
//               progress={
//                 progress.waterPercent
//               }
//             />

//             <View style={styles.metricBottom}>
//               <Text style={styles.metricPercent}>
//                 {Math.round(
//                   progress.waterPercent
//                 )}
//                 %
//               </Text>

//               <Text
//                 style={
//                   styles.metricRemaining
//                 }
//               >
//                 {remainingLabel(
//                   nutrition.waterConsumed,
//                   nutrition.waterGoal,
//                   'L',
//                   2
//                 )}
//               </Text>
//             </View>
//           </View>
//         </View>


//         {/* ACTIONS */}

//         <View style={styles.actions}>
//           <Pressable
//             style={({ pressed }) => [
//               styles.actionButton,
//               pressed && styles.pressed,
//             ]}
//             accessibilityRole="button"
//             accessibilityLabel="Add food"
//             onPress={() =>
//               router.push(
//                 '/diet/daily-food'
//               )
//             }
//           >
//             <Text style={styles.actionIcon}>
//               +
//             </Text>

//             <Text style={styles.actionText}>
//               ADD FOOD
//             </Text>
//           </Pressable>


//           <Pressable
//             style={({ pressed }) => [
//               styles.actionButton,
//               pressed && styles.pressed,
//             ]}
//             accessibilityRole="button"
//             accessibilityLabel="Use a template"
//             onPress={() =>
//               router.push(
//                 '/diet/select-template'
//               )
//             }
//           >
//             <Text style={styles.actionIcon}>
//               ▣
//             </Text>

//             <Text style={styles.actionText}>
//               USE TEMPLATE
//             </Text>
//           </Pressable>
//         </View>


//         {/* WATER */}

//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <View>
//               <Text style={styles.sectionTitle}>
//                 WATER
//               </Text>

//               <Text style={styles.sectionSubtitle}>
//                 Track your daily intake
//               </Text>
//             </View>

//             <Text style={styles.waterAmount}>
//               {formatNumber(
//                 nutrition.waterConsumed,
//                 2
//               )}
//               L
//             </Text>
//           </View>


//           <View style={styles.waterControls}>
//             <Pressable
//               style={({ pressed }) => [
//                 styles.waterButton,
//                 waterMinusDisabled &&
//                   styles.disabled,
//                 pressed &&
//                   !waterMinusDisabled &&
//                   styles.pressed,
//               ]}
//               disabled={waterMinusDisabled}
//               accessibilityRole="button"
//               accessibilityLabel="Remove 0.25 litres of water"
//               onPress={() =>
//                 changeWater(-0.25)
//               }
//             >
//               <Text
//                 style={
//                   styles.waterButtonText
//                 }
//               >
//                 −0.25L
//               </Text>
//             </Pressable>


//             <Pressable
//               style={({ pressed }) => [
//                 styles.waterButton,
//                 savingWater &&
//                   styles.disabled,
//                 pressed &&
//                   !savingWater &&
//                   styles.pressed,
//               ]}
//               disabled={savingWater}
//               accessibilityRole="button"
//               accessibilityLabel="Add 0.25 litres of water"
//               onPress={() =>
//                 changeWater(0.25)
//               }
//             >
//               <Text
//                 style={
//                   styles.waterButtonText
//                 }
//               >
//                 +0.25L
//               </Text>
//             </Pressable>


//             <Pressable
//               style={({ pressed }) => [
//                 styles.waterButton,
//                 savingWater &&
//                   styles.disabled,
//                 pressed &&
//                   !savingWater &&
//                   styles.pressed,
//               ]}
//               disabled={savingWater}
//               accessibilityRole="button"
//               accessibilityLabel="Add 0.5 litres of water"
//               onPress={() =>
//                 changeWater(0.5)
//               }
//             >
//               <Text
//                 style={
//                   styles.waterButtonText
//                 }
//               >
//                 +0.5L
//               </Text>
//             </Pressable>
//           </View>
//         </View>


//         {/* FOOD */}

//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <View>
//               <Text style={styles.sectionTitle}>
//                 TODAY&apos;S FOOD
//               </Text>

//               <Text style={styles.sectionSubtitle}>
//                 {nutrition.foods.length}{' '}
//                 item
//                 {nutrition.foods.length === 1
//                   ? ''
//                   : 's'}
//               </Text>
//             </View>

//             {nutrition.foods.length > 0 && (
//               <Text style={styles.totalText}>
//                 {formatNumber(
//                   progress.totals.calories
//                 )}{' '}
//                 kcal
//               </Text>
//             )}
//           </View>


//           {nutrition.foods.length === 0 ? (
//             <View style={styles.emptyFood}>
//               <Text style={styles.emptyFoodIcon}>
//                 +
//               </Text>

//               <Text style={styles.emptyFoodTitle}>
//                 NO FOOD ADDED
//               </Text>

//               <Text style={styles.emptyFoodText}>
//                 Add food manually or apply
//                 one of your templates.
//               </Text>

//               <Pressable
//                 style={({ pressed }) => [
//                   styles.primaryButton,
//                   pressed && styles.pressed,
//                 ]}
//                 accessibilityRole="button"
//                 accessibilityLabel="Add your first food"
//                 onPress={() =>
//                   router.push(
//                     '/diet/daily-food'
//                   )
//                 }
//               >
//                 <Text
//                   style={
//                     styles.primaryButtonText
//                   }
//                 >
//                   ADD FIRST FOOD
//                 </Text>
//               </Pressable>
//             </View>
//           ) : (
//             nutrition.foods.map(
//               (food) => (
//                 <Pressable
//                   key={food.id}
//                   style={({ pressed }) => [
//                     styles.foodCard,
//                     pressed &&
//                       styles.foodCardPressed,
//                   ]}
//                   accessibilityRole="button"
//                   accessibilityLabel={`Edit ${food.foodName}`}
//                   onPress={() =>
//                     router.push({
//                       pathname:
//                         '/diet/daily-food',
//                       params: {
//                         foodId: food.id,
//                       },
//                     })
//                   }
//                 >
//                   <View style={styles.foodInfo}>
//                     <Text
//                       numberOfLines={1}
//                       style={
//                         styles.foodName
//                       }
//                     >
//                       {food.foodName}
//                     </Text>

//                     <Text
//                       style={
//                         styles.foodQuantity
//                       }
//                     >
//                       {formatNumber(
//                         food.quantity,
//                         2
//                       )}{' '}
//                       {food.unit}
//                     </Text>
//                   </View>


//                   <View
//                     style={
//                       styles.foodNutrition
//                     }
//                   >
//                     <Text
//                       style={
//                         styles.foodCalories
//                       }
//                     >
//                       {formatNumber(
//                         food.calories
//                       )}{' '}
//                       kcal
//                     </Text>

//                     <Text
//                       style={
//                         styles.foodProtein
//                       }
//                     >
//                       P{' '}
//                       {formatNumber(
//                         food.protein,
//                         1
//                       )}
//                       g
//                     </Text>
//                   </View>


//                   <Pressable
//                     hitSlop={12}
//                     accessibilityRole="button"
//                     accessibilityLabel={`Delete ${food.foodName}`}
//                     onPress={() =>
//                       deleteFood(
//                         food.id
//                       )
//                     }
//                     style={({ pressed }) => [
//                       styles.deleteButton,
//                       pressed &&
//                         styles.deleteButtonPressed,
//                     ]}
//                   >
//                     <Text
//                       style={
//                         styles.deleteText
//                       }
//                     >
//                       ×
//                     </Text>
//                   </Pressable>
//                 </Pressable>
//               )
//             )
//           )}
//         </View>


//         {/* TARGETS */}

//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <View>
//               <Text style={styles.sectionTitle}>
//                 DAILY TARGETS
//               </Text>

//               <Text style={styles.sectionSubtitle}>
//                 Current nutrition goals
//               </Text>
//             </View>

//             <Text style={styles.comingSoon}>
//               D4
//             </Text>
//           </View>


//           <View style={styles.goalGrid}>
//             <View style={styles.goalCard}>
//               <Text style={styles.goalLabel}>
//                 CALORIES
//               </Text>

//               <Text style={styles.goalValue}>
//                 {formatNumber(
//                   nutrition.calorieGoal
//                 )}
//               </Text>

//               <Text style={styles.goalUnit}>
//                 KCAL
//               </Text>
//             </View>


//             <View style={styles.goalCard}>
//               <Text style={styles.goalLabel}>
//                 PROTEIN
//               </Text>

//               <Text style={styles.goalValue}>
//                 {formatNumber(
//                   nutrition.proteinGoal
//                 )}
//               </Text>

//               <Text style={styles.goalUnit}>
//                 GRAMS
//               </Text>
//             </View>


//             <View style={styles.goalCard}>
//               <Text style={styles.goalLabel}>
//                 WATER
//               </Text>

//               <Text style={styles.goalValue}>
//                 {formatNumber(
//                   nutrition.waterGoal,
//                   2
//                 )}
//               </Text>

//               <Text style={styles.goalUnit}>
//                 LITRES
//               </Text>
//             </View>
//           </View>
//         </View>

//       </ScrollView>
//     </View>
//   );
// }


// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#090909',
//   },

//   content: {
//     padding: 18,
//     paddingBottom: 50,
//   },

//   center: {
//     flex: 1,
//     backgroundColor: '#090909',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 24,
//   },

//   pressed: {
//     opacity: 0.7,
//   },

//   disabled: {
//     opacity: 0.4,
//   },

//   /* HEADER */

//   header: {
//     marginBottom: 22,
//   },

//   backButton: {
//     alignSelf: 'flex-start',
//     marginBottom: 14,
//     paddingVertical: 6,
//     paddingHorizontal: 2,
//   },

//   backButtonText: {
//     color: ACCENT,
//     fontSize: 11,
//     fontWeight: '900',
//     letterSpacing: 1,
//   },

//   headerMain: {
//     flexDirection: 'row',
//     alignItems: 'flex-end',
//     justifyContent: 'space-between',
//   },

//   eyebrow: {
//     color: '#8A8A8A',
//     fontSize: 11,
//     fontWeight: '800',
//     letterSpacing: 2,
//   },

//   title: {
//     color: '#F5F5F5',
//     fontSize: 30,
//     fontWeight: '900',
//     letterSpacing: 1,
//     marginTop: 3,
//   },

//   date: {
//     color: '#8A8A8A',
//     fontSize: 11,
//     fontWeight: '800',
//     letterSpacing: 1,
//     marginBottom: 5,
//   },

//   /* SUMMARY */

//   summaryCard: {
//     backgroundColor: '#111',
//     borderWidth: 1,
//     borderColor: '#242424',
//     borderRadius: 10,
//     padding: 16,
//   },

//   summaryHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 18,
//   },

//   cardTitle: {
//     color: ACCENT,
//     fontSize: 13,
//     fontWeight: '900',
//     letterSpacing: 1,
//   },

//   goalText: {
//     color: '#6E6E6E',
//     fontSize: 10,
//     fontWeight: '800',
//   },

//   metric: {
//     marginBottom: 18,
//   },

//   metricTop: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 8,
//   },

//   metricName: {
//     color: '#B0B0B0',
//     fontSize: 11,
//     fontWeight: '800',
//     letterSpacing: 1,
//   },

//   metricValue: {
//     color: '#F5F5F5',
//     fontSize: 12,
//     fontWeight: '800',
//     fontVariant: ['tabular-nums'],
//   },

//   metricBottom: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 6,
//   },

//   metricPercent: {
//     color: '#777',
//     fontSize: 10,
//     fontWeight: '800',
//     fontVariant: ['tabular-nums'],
//   },

//   metricRemaining: {
//     color: '#777',
//     fontSize: 10,
//     fontWeight: '700',
//     fontVariant: ['tabular-nums'],
//   },

//   metricOver: {
//     color: WARNING,
//   },

//   progressTrack: {
//     height: 7,
//     backgroundColor: '#222',
//     borderRadius: 3,
//     overflow: 'hidden',
//   },

//   progressFill: {
//     height: '100%',
//     backgroundColor: ACCENT,
//     borderRadius: 3,
//   },

//   progressFillOver: {
//     backgroundColor: WARNING,
//   },

//   /* ACTIONS */

//   actions: {
//     flexDirection: 'row',
//     gap: 10,
//     marginTop: 12,
//   },

//   actionButton: {
//     flex: 1,
//     minHeight: 64,
//     backgroundColor: '#151515',
//     borderWidth: 1,
//     borderColor: '#292929',
//     borderRadius: 9,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   actionIcon: {
//     color: ACCENT,
//     fontSize: 20,
//     fontWeight: '900',
//   },

//   actionText: {
//     color: '#E8E8E8',
//     fontSize: 10,
//     fontWeight: '900',
//     letterSpacing: 0.8,
//     marginTop: 4,
//   },

//   /* SECTIONS */

//   section: {
//     marginTop: 26,
//   },

//   sectionHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginBottom: 12,
//   },

//   sectionTitle: {
//     color: '#F2F2F2',
//     fontSize: 14,
//     fontWeight: '900',
//     letterSpacing: 1,
//   },

//   sectionSubtitle: {
//     color: '#7A7A7A',
//     fontSize: 11,
//     marginTop: 3,
//   },

//   /* WATER */

//   waterAmount: {
//     color: ACCENT,
//     fontSize: 17,
//     fontWeight: '900',
//     fontVariant: ['tabular-nums'],
//   },

//   waterControls: {
//     flexDirection: 'row',
//     gap: 8,
//   },

//   waterButton: {
//     flex: 1,
//     backgroundColor: '#151515',
//     borderWidth: 1,
//     borderColor: '#292929',
//     borderRadius: 8,
//     paddingVertical: 14,
//     alignItems: 'center',
//   },

//   waterButtonText: {
//     color: '#E8E8E8',
//     fontSize: 11,
//     fontWeight: '900',
//   },

//   /* FOOD */

//   foodCard: {
//     backgroundColor: '#111',
//     borderWidth: 1,
//     borderColor: '#242424',
//     borderRadius: 9,
//     minHeight: 70,
//     paddingHorizontal: 13,
//     paddingVertical: 11,
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },

//   foodCardPressed: {
//     backgroundColor: '#161616',
//     borderColor: '#333',
//   },

//   foodInfo: {
//     flex: 1,
//     marginRight: 10,
//   },

//   foodName: {
//     color: '#F2F2F2',
//     fontSize: 13,
//     fontWeight: '800',
//   },

//   foodQuantity: {
//     color: '#7A7A7A',
//     fontSize: 11,
//     marginTop: 4,
//   },

//   foodNutrition: {
//     alignItems: 'flex-end',
//     marginRight: 8,
//   },

//   foodCalories: {
//     color: '#DDD',
//     fontSize: 11,
//     fontWeight: '800',
//     fontVariant: ['tabular-nums'],
//   },

//   foodProtein: {
//     color: ACCENT,
//     fontSize: 10,
//     fontWeight: '800',
//     marginTop: 4,
//     fontVariant: ['tabular-nums'],
//   },

//   deleteButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 6,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   deleteButtonPressed: {
//     backgroundColor: '#1F1F1F',
//   },

//   deleteText: {
//     color: '#808080',
//     fontSize: 22,
//     fontWeight: '300',
//   },

//   totalText: {
//     color: ACCENT,
//     fontSize: 11,
//     fontWeight: '800',
//     fontVariant: ['tabular-nums'],
//   },

//   emptyFood: {
//     backgroundColor: '#111',
//     borderWidth: 1,
//     borderColor: '#242424',
//     borderRadius: 9,
//     padding: 24,
//     alignItems: 'center',
//   },

//   emptyFoodIcon: {
//     color: ACCENT,
//     fontSize: 28,
//     fontWeight: '300',
//   },

//   emptyFoodTitle: {
//     color: '#EEE',
//     fontSize: 13,
//     fontWeight: '900',
//     marginTop: 8,
//   },

//   emptyFoodText: {
//     color: '#7A7A7A',
//     fontSize: 11,
//     textAlign: 'center',
//     lineHeight: 17,
//     marginTop: 6,
//     marginBottom: 15,
//   },

//   primaryButton: {
//     backgroundColor: ACCENT,
//     paddingHorizontal: 18,
//     paddingVertical: 12,
//     borderRadius: 7,
//   },

//   retryButton: {
//     marginTop: 18,
//   },

//   primaryButtonText: {
//     color: '#090909',
//     fontSize: 11,
//     fontWeight: '900',
//     letterSpacing: 0.7,
//   },

//   /* TARGETS */

//   goalGrid: {
//     flexDirection: 'row',
//     gap: 8,
//   },

//   goalCard: {
//     flex: 1,
//     backgroundColor: '#111',
//     borderWidth: 1,
//     borderColor: '#242424',
//     borderRadius: 8,
//     padding: 12,
//   },

//   goalLabel: {
//     color: '#7A7A7A',
//     fontSize: 9,
//     fontWeight: '900',
//     letterSpacing: 0.8,
//   },

//   goalValue: {
//     color: '#EEE',
//     fontSize: 19,
//     fontWeight: '900',
//     marginTop: 7,
//     fontVariant: ['tabular-nums'],
//   },

//   goalUnit: {
//     color: '#6E6E6E',
//     fontSize: 9,
//     fontWeight: '900',
//     marginTop: 2,
//   },

//   comingSoon: {
//     color: '#6E6E6E',
//     fontSize: 9,
//     fontWeight: '900',
//   },

//   /* EMPTY STATES */

//   emptyTitle: {
//     color: '#F2F2F2',
//     fontSize: 15,
//     fontWeight: '900',
//   },

//   emptyText: {
//     color: '#7A7A7A',
//     fontSize: 12,
//     textAlign: 'center',
//     marginTop: 8,
//   },

//   historyButton: {
//   marginTop: 10,
//   alignSelf: 'flex-start',
//   paddingVertical: 9,
//   paddingHorizontal: 13,
//   borderRadius: 6,
//   borderWidth: 1,
//   borderColor: '#2B2B2B',
//   backgroundColor: '#111111',
// },

// historyButtonText: {
//   color: '#B8FF3D',
//   fontSize: 10,
//   fontWeight: '900',
//   letterSpacing: 1,
// },
// });