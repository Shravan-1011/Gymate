import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getPokemonSpriteSource,
  getPokemonIconSource,
} from '../../assets/pokemon/registry';

import {
  colors,
  borders,
} from '../../constants/theme';

import { PokemonRarity } from '../../types/pokemon';

/*
 * ========================================
 * RARITY COLORS
 * ========================================
 *
 * PLACEHOLDER. Only used for the fallback
 * silhouette border/glow until real
 * sprites exist. Not a source of truth for
 * rarity itself — see types/pokemon.ts and
 * data/pokemonConfig.ts.
 * ========================================
 */

const RARITY_COLORS: Record<
  PokemonRarity,
  string
> = {
  common: colors.textSecondary,
  uncommon: colors.success,
  rare: '#5FA8E8',
  
  legendary: colors.warning,
};

type PokemonSpriteProps = {
  spriteAssetId?: string | null;

  iconAssetId?: string | null;

  name: string;

  rarity: PokemonRarity;

  /*
   * "icon" is used for compact lists
   * (PC, team slots, shop reveal list).
   *
   * "sprite" is used for the larger
   * hero presentation (reveal screen,
   * team detail).
   */
  size?: 'icon' | 'sprite';
};

/*
 * ========================================
 * POKÉMON SPRITE
 * ========================================
 *
 * Resolves a real asset through the
 * centralized registry when one exists.
 *
 * Falls back to a rarity-colored pixel
 * silhouette (first letter of the name)
 * when no real art has been added yet —
 * see assets/pokemon/registry.ts for how
 * to register real sprites.
 * ========================================
 */

export default function PokemonSprite({
  spriteAssetId,
  iconAssetId,
  name,
  rarity,
  size = 'icon',
}: PokemonSpriteProps) {
  const dimension =
    size === 'sprite' ? 96 : 48;

  const source =
    size === 'sprite'
      ? getPokemonSpriteSource(
          spriteAssetId
        )
      : getPokemonIconSource(
          iconAssetId
        );

  const borderColor =
    RARITY_COLORS[rarity] ??
    colors.borderStrong;

  if (source) {
    return (
      <View
        style={[
          styles.frame,
          {
            width: dimension,
            height: dimension,
            borderColor,
          },
        ]}
      >
        <Image
          source={source}
          style={{
            width: dimension - 8,
            height: dimension - 8,
          }}
          resizeMode="contain"
        />
      </View>
    );
  }

  /*
   * ======================================
   * FALLBACK PLACEHOLDER
   * ======================================
   */

  const initial =
    name.trim().charAt(0).toUpperCase() ||
    '?';

  return (
    <View
      style={[
        styles.frame,
        styles.fallback,
        {
          width: dimension,
          height: dimension,
          borderColor,
        },
      ]}
    >
      <Text
        style={[
          styles.fallbackText,
          {
            fontSize: dimension * 0.4,
            color: borderColor,
          },
        ]}
      >
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderWidth: borders.normal,

    backgroundColor: colors.surfaceLight,

    alignItems: 'center',

    justifyContent: 'center',
  },

  fallback: {
    borderStyle: 'dashed',
  },

  fallbackText: {
    fontFamily: 'PressStart2P',
  },
});
