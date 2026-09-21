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
  useLocalSearchParams,
} from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProfile } from '../../../context/ProfileContext';

import PixelCard from '../../../components/PixelCard';
import PixelButton from '../../../components/PixelButton';
import PokemonSprite from '../../../components/pokemon/PokemonSprite';
import PokemonCry from '../../../components/pokemon/PokemonCry';
import ProgressBar from '../../../components/ProgressBar';

import {
  colors,
  spacing,
} from '../../../constants/theme';

import {
  getUserPokemonDetail,
  moveToTeam,
  moveToPC,
  
} from '../../../services/pokemonService';

import {
  getPokemonXPPerLevel,
  getPokemonMaxLevel,
  getEvolutionLevelStage2,
  getEvolutionLevelStage3,
} from '../../../services/pokemonDataService';

import {
  PokemonSpecies,
  UserPokemon,
} from '../../../types/pokemon';

export default function PokemonDetailScreen() {
  const { profile } = useProfile();
  const insets = useSafeAreaInsets();

  const { userPokemonId } =
    useLocalSearchParams<{
      userPokemonId: string;
    }>();

  const [isLoading, setIsLoading] =
    useState(true);

  const [userPokemon, setUserPokemon] =
    useState<UserPokemon | null>(null);

  const [species, setSpecies] =
    useState<PokemonSpecies | null>(null);

  const [isOnTeam, setIsOnTeam] =
    useState(false);

  const [actionMessage, setActionMessage] =
    useState<string | null>(null);

  const [isBusy, setIsBusy] =
    useState(false);

  const load = useCallback(async () => {
    if (!profile?.id || !userPokemonId) {
      return;
    }

    setIsLoading(true);

    try {
      const detail =
        await getUserPokemonDetail(
          profile.id,
          userPokemonId
        );

      if (detail) {
        setUserPokemon(
          detail.userPokemon
        );

        setSpecies(detail.species);

        setIsOnTeam(detail.isOnTeam);
      }
    } catch (error) {
      console.error(
        '[POKEMON] Failed to load Pokémon detail:',
        error
      );
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, userPokemonId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleMoveToTeam() {
    if (!profile?.id || !userPokemon) {
      return;
    }

    setIsBusy(true);
    setActionMessage(null);

    try {
      await moveToTeam(
        profile.id,
        userPokemon.id
      );

      await load();
    } catch (error) {
      setActionMessage(
        error instanceof Error &&
          error.message === 'TEAM_IS_FULL'
          ? 'YOUR TEAM IS FULL (MAX 3)'
          : 'COULD NOT MOVE TO TEAM'
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleMoveToPC() {
    if (!profile?.id || !userPokemon) {
      return;
    }

    setIsBusy(true);
    setActionMessage(null);

    try {
      await moveToPC(
        profile.id,
        userPokemon.id
      );

      await load();
    } catch (error) {
      setActionMessage(
        'COULD NOT MOVE TO PC'
      );
    } finally {
      setIsBusy(false);
    }
  }

  

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingScreen,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <ActivityIndicator
          size="small"
          color={colors.primary}
        />
      </View>
    );
  }

  if (!userPokemon || !species) {
    return (
      <View
        style={[
          styles.loadingScreen,
          {
            paddingTop:
              insets.top + spacing.lg,
            paddingBottom:
              insets.bottom + spacing.lg,
          },
        ]}
      >
        <Text style={styles.notFoundText}>
          POKÉMON NOT FOUND
        </Text>

        <PixelButton
          title="BACK"
          onPress={() => router.back()}
          style={{
            marginTop: spacing.lg,
          }}
        />
      </View>
    );
  }

  const xpPerLevel =
    getPokemonXPPerLevel();

  const maxLevel =
    getPokemonMaxLevel();

  const isMaxLevel =
    userPokemon.level >= maxLevel;

  const progress = isMaxLevel
    ? 1
    : (userPokemon.xp % xpPerLevel) /
      xpPerLevel;

  const nextEvolutionLevel =
    species.evolutionStage === 1
      ? getEvolutionLevelStage2()
      : species.evolutionStage === 2
      ? getEvolutionLevelStage3()
      : null;

  const canMegaEvolve =
    !species.isMegaForm &&
    species.canMegaEvolve;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop:
            insets.top + spacing.lg,
          paddingBottom:
            insets.bottom +
            spacing.xxxl +
            spacing.lg,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        onPress={() => router.back()}
        style={styles.backButtonContainer}
      >
        <Text style={styles.backButton}>
          {'< BACK'}
        </Text>
      </Pressable>

      <View style={styles.heroSection}>
        <PokemonSprite
          spriteAssetId={
            species.spriteAssetId
          }
          iconAssetId={species.iconAssetId}
          name={species.name}
          rarity={species.rarity}
          size="sprite"
        />

        <PokemonCry
          cryAssetId={species.cryAssetId}
          autoPlay
        />

        <Text style={styles.name}>
          {species.name}
        </Text>

        <Text style={styles.dexNumber}>
          #
          {String(
            species.pokedexNumber
          ).padStart(3, '0')}
        </Text>

        <View style={styles.typeRow}>
          {species.types.map((type) => (
            <View
              key={type}
              style={styles.typeChip}
            >
              <Text
                style={
                  styles.typeChipText
                }
              >
                {type.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <PixelCard style={styles.statsCard}>
        <View style={styles.statsRow}>
          <Text style={styles.statLabel}>
            LEVEL
          </Text>

          <Text style={styles.statValue}>
            {userPokemon.level}
            {isMaxLevel ? ' (MAX)' : ''}
          </Text>
        </View>

        <ProgressBar progress={progress} />

        <Text style={styles.xpText}>
          {isMaxLevel
            ? 'FULLY TRAINED'
            : `${
                userPokemon.xp % xpPerLevel
              } / ${xpPerLevel} XP TO NEXT LEVEL`}
        </Text>

        {nextEvolutionLevel &&
          !isMaxLevel && (
            <Text
              style={styles.evolutionHint}
            >
              EVOLVES AT LEVEL{' '}
              {nextEvolutionLevel}
            </Text>
          )}

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <Text style={styles.statLabel}>
            RARITY
          </Text>

          <Text style={styles.statValue}>
            {species.rarity.toUpperCase()}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statLabel}>
            SOURCE
          </Text>

          <Text style={styles.statValue}>
            {userPokemon.source
              .replace(/_/g, ' ')
              .toUpperCase()}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statLabel}>
            OBTAINED
          </Text>

          <Text style={styles.statValue}>
            {new Date(
              userPokemon.obtainedAt
            ).toLocaleDateString()}
          </Text>
        </View>
      </PixelCard>

      {actionMessage && (
        <Text style={styles.actionMessage}>
          {actionMessage}
        </Text>
      )}

      <View style={styles.actions}>
        {isOnTeam ? (
          <PixelButton
            title="MOVE TO PC"
            variant="secondary"
            disabled={isBusy}
            onPress={handleMoveToPC}
          />
        ) : (
          <PixelButton
            title="MOVE TO TEAM"
            disabled={isBusy}
            onPress={handleMoveToTeam}
          />
        )}

        
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: spacing.lg,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },

  notFoundText: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  backButtonContainer: {
    alignSelf: 'flex-start',
    minHeight: 40,
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },

  backButton: {
    fontFamily: 'VT323',
    fontSize: 20,
    color: colors.primary,
  },

  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  name: {
    fontFamily: 'PressStart2P',
    fontSize: 16,
    color: colors.text,
    marginTop: spacing.md,
  },

  dexNumber: {
    fontFamily: 'VT323',
    fontSize: 16,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  typeChip: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },

  typeChipText: {
    fontFamily: 'VT323',
    fontSize: 14,
    color: colors.textSecondary,
  },

  statsCard: {
    marginBottom: spacing.lg,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },

  statLabel: {
    fontFamily: 'VT323',
    fontSize: 18,
    color: colors.textSecondary,
  },

  statValue: {
    fontFamily: 'VT323',
    fontSize: 18,
    color: colors.text,
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: spacing.md,
  },

  xpText: {
    fontFamily: 'VT323',
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  evolutionHint: {
    fontFamily: 'VT323',
    fontSize: 14,
    color: colors.primary,
    marginTop: spacing.xs,
  },

  divider: {
    height: 2,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },

  actionMessage: {
    fontFamily: 'VT323',
    fontSize: 16,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  actions: {
    marginTop: spacing.sm,
  },
});