import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  colors,
} from '../../constants/theme';

import {
  TRAINER_SPRITES,
} from '../../constants/trainers';

type TrainerSelectorProps = {
  selectedTrainerId: string | null;

  onSelect: (
    trainerId: string
  ) => void;

  onCancel?: () => void;
};

const SCREEN_WIDTH =
  Dimensions.get('window').width;

const CARD_WIDTH =
  Math.min(
    SCREEN_WIDTH - 48,
    300
  );

const CARD_SPACING = 12;

export default function TrainerSelector({
  selectedTrainerId,
  onSelect,
  onCancel,
}: TrainerSelectorProps) {
  const scrollRef =
    useRef<ScrollView | null>(null);

  const initialIndex = Math.max(
    0,
    TRAINER_SPRITES.findIndex(
      trainer =>
        trainer.id ===
        selectedTrainerId
    )
  );

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(initialIndex);

  /*
   * Scroll to the currently selected
   * trainer when the selector opens.
   */

  useEffect(() => {
    if (
      initialIndex < 0 ||
      !scrollRef.current
    ) {
      return;
    }

    const timer =
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          x:
            initialIndex *
            (CARD_WIDTH +
              CARD_SPACING),
          animated: false,
        });
      }, 50);

    return () =>
      clearTimeout(timer);
  }, [initialIndex]);

  function handleScroll(
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) {
    const offsetX =
      event.nativeEvent.contentOffset.x;

    const index = Math.round(
      offsetX /
        (CARD_WIDTH +
          CARD_SPACING)
    );

    const safeIndex =
      Math.max(
        0,
        Math.min(
          TRAINER_SPRITES.length - 1,
          index
        )
      );

    setCurrentIndex(
      safeIndex
    );
  }

  const currentTrainer =
    TRAINER_SPRITES[
      currentIndex
    ];

  function handleSelect() {
    if (!currentTrainer) {
      return;
    }

    onSelect(
      currentTrainer.id
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}

      <View style={styles.header}>
        <Text style={styles.title}>
          TRAINER SELECT
        </Text>

        <Text style={styles.subtitle}>
          CHOOSE YOUR TRAINER
        </Text>
      </View>

      {/* TRAINER CAROUSEL */}

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={
          false
        }
        snapToInterval={
          CARD_WIDTH +
          CARD_SPACING
        }
        decelerationRate="fast"
        contentContainerStyle={
          styles.carouselContent
        }
        onMomentumScrollEnd={
          handleScroll
        }
      >
        {TRAINER_SPRITES.map(
          (trainer, index) => (
            <View
              key={trainer.id}
              style={[
                styles.trainerCard,
                {
                  marginRight:
                    index ===
                    TRAINER_SPRITES.length -
                      1
                      ? 0
                      : CARD_SPACING,
                },
                index ===
                  currentIndex &&
                  styles.trainerCardActive,
              ]}
            >
              <Image
                source={
                  trainer.source
                }
                resizeMode="contain"
                style={
                  styles.trainerImage
                }
              />

              <Text
                style={
                  styles.trainerName
                }
              >
                {trainer.name.toUpperCase()}
              </Text>

              <Text
                style={
                  styles.trainerIndex
                }
              >
                {index + 1} /{' '}
                {
                  TRAINER_SPRITES.length
                }
              </Text>
            </View>
          )
        )}
      </ScrollView>

      {/* DOT INDICATOR */}

      <View style={styles.dots}>
        {TRAINER_SPRITES.map(
          (trainer, index) => (
            <View
              key={trainer.id}
              style={[
                styles.dot,
                index ===
                  currentIndex &&
                  styles.dotActive,
              ]}
            />
          )
        )}
      </View>

      {/* CURRENT TRAINER */}

      <Text style={styles.currentLabel}>
        SELECTED
      </Text>

      <Text style={styles.currentTrainer}>
        {currentTrainer?.name.toUpperCase() ??
          'TRAINER 01'}
      </Text>

      {/* ACTIONS */}

      <View style={styles.actions}>
        {onCancel && (
          <Pressable
            style={styles.cancelButton}
            onPress={onCancel}
          >
            <Text
              style={
                styles.cancelText
              }
            >
              CANCEL
            </Text>
          </Pressable>
        )}

        <Pressable
          style={
            styles.selectButton
          }
          onPress={handleSelect}
        >
          <Text
            style={
              styles.selectText
            }
          >
            SELECT TRAINER
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      width: '100%',
      backgroundColor:
        '#111111',
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 18,
      paddingVertical: 20,
      overflow: 'hidden',
    },

    header: {
      alignItems:
        'center',
      paddingHorizontal: 16,
      marginBottom: 16,
    },

    title: {
      color:
        colors.text,
      fontFamily:
        'PressStart2P',
      fontSize: 13,
      textAlign:
        'center',
    },

    subtitle: {
      color:
        colors.textSecondary,
      fontFamily:
        'VT323',
      fontSize: 18,
      marginTop: 7,
      textAlign:
        'center',
    },

    carouselContent: {
      paddingHorizontal:
        24,
    },

    trainerCard: {
      width:
        CARD_WIDTH,
      minHeight: 300,
      backgroundColor:
        '#181818',
      borderWidth: 2,
      borderColor:
        '#292929',
      borderRadius: 16,
      alignItems:
        'center',
      justifyContent:
        'center',
      padding: 16,
    },

    trainerCardActive: {
      borderColor:
        colors.primary,
    },

    trainerImage: {
      width: '100%',
      height: 220,
    },

    trainerName: {
      color:
        colors.text,
      fontFamily:
        'PressStart2P',
      fontSize: 10,
      marginTop: 10,
      textAlign:
        'center',
    },

    trainerIndex: {
      color:
        colors.textSecondary,
      fontFamily:
        'VT323',
      fontSize: 16,
      marginTop: 5,
    },

    dots: {
      flexDirection:
        'row',
      justifyContent:
        'center',
      alignItems:
        'center',
      flexWrap:
        'wrap',
      paddingHorizontal: 20,
      marginTop: 16,
      gap: 5,
    },

    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor:
        '#3A3A3A',
    },

    dotActive: {
      width: 16,
      backgroundColor:
        colors.primary,
    },

    currentLabel: {
      color:
        colors.textSecondary,
      fontFamily:
        'VT323',
      fontSize: 16,
      textAlign:
        'center',
      marginTop: 16,
    },

    currentTrainer: {
      color:
        colors.primary,
      fontFamily:
        'PressStart2P',
      fontSize: 11,
      textAlign:
        'center',
      marginTop: 4,
    },

    actions: {
      flexDirection:
        'row',
      gap: 10,
      paddingHorizontal: 16,
      marginTop: 18,
    },

    cancelButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        colors.border,
      alignItems:
        'center',
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

    selectButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 12,
      backgroundColor:
        colors.primary,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    selectText: {
      color:
        '#000000',
      fontFamily:
        'PressStart2P',
      fontSize: 9,
    },
  });