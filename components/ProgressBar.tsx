import { StyleSheet, View } from 'react-native';
import { colors } from '../constants/theme';

type ProgressBarProps = {
  progress: number;
};

export default function ProgressBar({
  progress,
}: ProgressBarProps) {
  const clampedProgress = Math.max(
    0,
    Math.min(progress, 1)
  );

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress * 100}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 14,

    backgroundColor: colors.background,

    borderWidth: 2,
    borderColor: colors.borderStrong,

    overflow: 'hidden',
  },

  fill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
});