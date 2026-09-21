import {
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import {
  borders,
  colors,
  spacing,
} from '../constants/theme';

type DailyTaskItemProps = {
  title: string;
  completed: boolean;
  onPress: () => void;
};

export default function DailyTaskItem({
  title,
  completed,
  onPress,
}: DailyTaskItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,

        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.checkbox,
          completed
            ? styles.completed
            : styles.incomplete,
        ]}
      >
        {completed ? '✓' : '□'}
      </Text>

      <Text
        style={[
          styles.title,
          completed && styles.completedTitle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: colors.surface,

    borderWidth: borders.normal,
    borderColor: colors.border,

    padding: spacing.md,

    marginBottom: spacing.sm,
  },

  pressed: {
    transform: [
      {
        translateY: 2,
      },
    ],
  },

  checkbox: {
    fontFamily: 'VT323',
    fontSize: 26,

    marginRight: spacing.md,
  },

  incomplete: {
    color: colors.textMuted,
  },

  completed: {
    color: colors.primary,
  },

  title: {
    fontFamily: 'VT323',
    fontSize: 20,
    color: colors.text,
  },

  completedTitle: {
    color: colors.textSecondary,
  },
});