import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type {
  ProfileDisplayGymBadge,
} from '../../services/pokemonAchievementService';

import {
  getGymBadgeSource,
} from '../../assets/badges/registry';

import {
  colors,
  spacing,
} from '../../constants/theme';

type GymBadgesCardProps = {
  badge: ProfileDisplayGymBadge;

  onPress?: () => void;
};

export default function GymBadgesCard({
  badge,
  onPress,
}: GymBadgesCardProps) {

  const {
    badge: definition,
    displayVariant,
  } = badge;

  const isLocked =
    displayVariant === 'locked';

  const isGold =
    displayVariant === 'gold';

  const imageSource =
    getGymBadgeSource(
      definition.assetId
    );

  return (
    <Pressable
      disabled={
        !onPress
      }
      onPress={
        onPress
      }
      style={[
        styles.card,

        isLocked &&
          styles.cardLocked,

        isGold &&
          styles.cardGold,
      ]}
    >

      {/* ==================================
          BADGE IMAGE
          ================================== */}

      <View
        style={[
          styles.badgeContainer,

          isLocked &&
            styles.badgeContainerLocked,

          isGold &&
            styles.badgeContainerGold,
        ]}
      >

        {imageSource ? (

          <Image
            source={
              imageSource
            }
            style={[
              styles.badgeImage,

              isLocked &&
                styles.badgeImageLocked,
            ]}
            resizeMode="contain"
          />

        ) : (

          <Text
            style={
              styles.missingBadge
            }
          >
            ?
          </Text>

        )}

      </View>

      {/* ==================================
          INFORMATION
          ================================== */}

      <View
        style={
          styles.info
        }
      >

        <Text
          style={[
            styles.name,

            isLocked &&
              styles.nameLocked,

            isGold &&
              styles.nameGold,
          ]}
          numberOfLines={2}
        >
          {definition.name}
        </Text>

        <Text
          style={
            styles.variant
          }
        >
          {isLocked
            ? 'LOCKED'
            : isGold
              ? 'GOLD BADGE'
              : 'BADGE EARNED'}
        </Text>

        <Text
          style={
            styles.description
          }
          numberOfLines={3}
        >
          {definition.description}
        </Text>

      </View>

    </Pressable>
  );
}

/*
 * ========================================
 * STYLES
 * ========================================
 */

const styles =
  StyleSheet.create({

    card: {
      flexDirection:
        'row',

      alignItems:
        'center',

      minHeight:
        130,

      padding:
        spacing.md,

      marginBottom:
        spacing.md,

      backgroundColor:
        colors.surface,

      borderWidth:
        2,

      borderColor:
        colors.primary,
    },

    cardLocked: {
      borderColor:
        colors.border,

      opacity:
        0.55,
    },

    cardGold: {
      borderColor:
        colors.primary,
    },

    /*
     * BADGE
     */

    badgeContainer: {
      width:
        100,

      height:
        100,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight:
        spacing.md,

      backgroundColor:
        colors.surfaceLight,

      borderWidth:
        1,

      borderColor:
        colors.border,
    },

    badgeContainerLocked: {
      borderColor:
        colors.border,
    },

    badgeContainerGold: {
      borderColor:
        colors.primary,
    },

    badgeImage: {
      width:
        88,

      height:
        88,
    },

    badgeImageLocked: {
      opacity:
        0.35,
    },

    missingBadge: {
      fontFamily:
        'PressStart2P',

      fontSize:
        24,

      color:
        colors.textMuted,
    },

    /*
     * INFO
     */

    info: {
      flex: 1,
    },

    name: {
      fontFamily:
        'PressStart2P',

      fontSize:
        10,

      lineHeight:
        16,

      color:
        colors.text,
    },

    nameLocked: {
      color:
        colors.textSecondary,
    },

    nameGold: {
      color:
        colors.primary,
    },

    variant: {
      fontFamily:
        'VT323',

      fontSize:
        16,

      color:
        colors.primary,

      marginTop:
        spacing.xs,
    },

    description: {
      fontFamily:
        'VT323',

      fontSize:
        16,

      lineHeight:
        18,

      color:
        colors.textSecondary,

      marginTop:
        spacing.xs,
    },

  });