import {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  router,
  useFocusEffect,
} from 'expo-router';

import { useProfile } from '../../context/ProfileContext';

import PixelCard from '../../components/PixelCard';
import PokemonSprite from '../../components/pokemon/PokemonSprite';
import AnimatedPokemonIcon from '../../components/pokemon/AnimatedPokemonIcon';

import {
  colors,
  spacing,
} from '../../constants/theme';

import { getPCWithDetails } from '../../services/pokemonService';

import {
  PokemonSpecies,
  UserPokemon,
} from '../../types/pokemon';

type PCEntry = {
  userPokemon: UserPokemon;
  species: PokemonSpecies | null;
};

/*
 * ========================================
 * PC SCREEN
 * ========================================
 *
 * Grid of every Pokémon the profile owns
 * that is NOT currently on the active
 * team. Tapping one opens the Pokédex
 * detail screen, where it can be moved
 * onto the team (see
 * app/pokemon/detail/[userPokemonId].tsx).
 * ========================================
 */

export default function PokemonPCScreen() {
  const { profile } = useProfile();

  const [isLoading, setIsLoading] =
    useState(true);

  const [pcPokemon, setPCPokemon] =
    useState<PCEntry[]>([]);

  const loadPC = useCallback(async () => {
    if (!profile?.id) {
      return;
    }

    setIsLoading(true);

    try {
      const entries =
        await getPCWithDetails(
          profile.id
        );

      setPCPokemon(entries);
    } catch (error) {
      console.error(
        '[POKEMON] Failed to load PC:',
        error
      );
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useFocusEffect(
    useCallback(() => {
      loadPC();
    }, [loadPC])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
        >
          <Text style={styles.backButton}>
            {'< BACK'}
          </Text>
        </Pressable>

        <Text style={styles.title}>
          YOUR PC
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.loadingScreen}>
          <ActivityIndicator
            size="small"
            color={colors.primary}
          />
        </View>
      ) : pcPokemon.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            YOUR PC IS EMPTY
          </Text>

          <Text
            style={styles.emptySubtext}
          >
            CATCH POKÉMON IN THE SHOP TO
            FILL IT UP
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={
            styles.grid
          }
        >
          {pcPokemon.map((entry) => (
            <PixelCard
              key={entry.userPokemon.id}
              padding={spacing.sm}
              style={styles.gridCell}
            >
              <Pressable
                onPress={() =>
                  router.push(
                    `/pokemon/detail/${entry.userPokemon.id}`
                  )
                }
                style={({ pressed }) => [
                  styles.gridCellContent,
                  pressed && {
                    opacity: 0.7,
                  },
                ]}
              >
                {entry.species?.iconAssetId && (
                  <AnimatedPokemonIcon
                    iconAssetId={entry.species.iconAssetId}
                    size={64}
                    frameDuration={250}
                  />
                )}

                <Text
                  style={styles.gridName}
                  numberOfLines={1}
                >
                  {entry.species?.name ??
                    '???'}
                </Text>

                <Text
                  style={styles.gridLevel}
                >
                  LV {entry.userPokemon.level}
                </Text>
              </Pressable>
            </PixelCard>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },

  backButton: {
    fontFamily: 'VT323',
    fontSize: 20,
    color: colors.primary,
  },

  headerSpacer: {
    width: 60,
  },

  title: {
    fontFamily: 'PressStart2P',
    fontSize: 14,
    color: colors.text,
  },

  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },

  emptyText: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  emptySubtext: {
    fontFamily: 'VT323',
    fontSize: 18,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  gridCell: {
    width: '31%',
  },

  gridCellContent: {
    alignItems: 'center',
  },

  gridName: {
    fontFamily: 'VT323',
    fontSize: 14,
    color: colors.text,
    marginTop: spacing.xs,
  },

  gridLevel: {
    fontFamily: 'VT323',
    fontSize: 12,
    color: colors.textSecondary,
  },
});
