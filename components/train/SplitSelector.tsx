import { Pressable, StyleSheet, Text, View } from 'react-native';

import { workoutSplits } from '../../data/workoutSplits';
import { colors, spacing } from '../../constants/theme';
import { MuscleGroup } from '../../types/workout';

type SplitSelectorProps = {
  selectedSplitId: string | null;
  onSelectSplit: (splitId: string) => void;
};

export default function SplitSelector({
  selectedSplitId,
  onSelectSplit,
}: SplitSelectorProps) {
  const formatMuscleName = (muscle: MuscleGroup) => {
    return muscle
      .split('-')
      .map(word => word.toUpperCase())
      .join(' ');
  };

  return (
    <View style={styles.container}>
      {workoutSplits.map(split => {
        const isSelected = selectedSplitId === split.id;

        return (
          <Pressable
            key={split.id}
            style={[
              styles.card,
              isSelected && styles.selectedCard,
            ]}
            onPress={() => onSelectSplit(split.id)}
          >
            <View style={styles.info}>
              <Text
                style={[
                  styles.name,
                  isSelected && styles.selectedName,
                ]}
              >
                {split.name}
              </Text>

              <Text style={styles.description}>
                {split.shortDescription}
              </Text>

              {split.targetMuscles.length > 0 && (
                <Text style={styles.muscles}>
                  {split.targetMuscles
                    .map(formatMuscleName)
                    .join(' • ')}
                </Text>
              )}
            </View>

            <Text style={styles.arrow}>
              {isSelected ? '✓' : '▶'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },

  card: {
    minHeight: 90,

    padding: spacing.md,

    backgroundColor: colors.surface,

    borderWidth: 2,
    borderColor: colors.border,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectedCard: {
    borderColor: colors.primary,
  },

  info: {
    flex: 1,
    paddingRight: spacing.md,
  },

  name: {
    fontFamily: 'PressStart2P',
    fontSize: 11,
    color: colors.text,
    marginBottom: spacing.sm,
  },

  selectedName: {
    color: colors.primary,
  },

  description: {
    fontFamily: 'VT323',
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },

  muscles: {
    fontFamily: 'VT323',
    fontSize: 16,
    color: colors.textSecondary,
  },

  arrow: {
    fontFamily: 'VT323',
    fontSize: 22,
    color: colors.primary,
  },
});