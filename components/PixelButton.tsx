import React from 'react';

import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { colors } from '../constants/theme';

type PixelButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;

  /**
   * Optional icon displayed inside the button.
   */
  icon?: ImageSourcePropType;

  /**
   * Icon size in pixels.
   */
  iconSize?: number;

  /**
   * Whether the icon appears before or after
   * the button text.
   */
  iconPosition?: 'left' | 'right';
};

export default function PixelButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  icon,
  iconSize = 18,
  iconPosition = 'right',
}: PixelButtonProps) {
  const isPrimary =
    variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,

        isPrimary
          ? styles.primary
          : styles.secondary,

        disabled &&
          styles.disabled,

        pressed &&
          !disabled &&
          styles.pressed,

        style,
      ]}
    >
      <View
        style={[
          styles.content,
          iconPosition === 'right' &&
            styles.contentRight,
        ]}
      >
        {icon &&
          iconPosition === 'left' && (
            <Image
              source={icon}
              resizeMode="contain"
              style={[
                styles.icon,
                {
                  width: iconSize,
                  height: iconSize,
                },
              ]}
            />
          )}

        <Text
          style={[
            styles.text,

            isPrimary
              ? styles.primaryText
              : styles.secondaryText,

            disabled &&
              styles.disabledText,
          ]}
        >
          {title}
        </Text>

        {icon &&
          iconPosition === 'right' && (
            <Image
              source={icon}
              resizeMode="contain"
              style={[
                styles.icon,
                {
                  width: iconSize,
                  height: iconSize,
                },
              ]}
            />
          )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  secondary: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.borderStrong,
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  contentRight: {
    gap: 7,
  },

  icon: {
    flexShrink: 0,
  },

  text: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    textAlign: 'center',
  },

  primaryText: {
    color: colors.background,
  },

  secondaryText: {
    color: colors.text,
  },

  disabled: {
    opacity: 0.4,
  },

  disabledText: {
    color: colors.textSecondary,
  },

  pressed: {
    opacity: 0.7,
  },
});