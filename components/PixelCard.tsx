import {
  StyleSheet,
  View,
  ViewProps,
} from 'react-native';

import {
  borders,
  colors,
  spacing,
} from '../constants/theme';

type PixelCardProps = ViewProps & {
  children: React.ReactNode;
  padding?: number;
};

export default function PixelCard({
  children,
  style,
  padding = spacing.lg,
  ...props
}: PixelCardProps) {
  return (
    <View
      style={[
        styles.card,
        {
          padding,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,

    borderWidth: borders.normal,
    borderColor: colors.borderStrong,

    borderRadius: 0,
  },
});