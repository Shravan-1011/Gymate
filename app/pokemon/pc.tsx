
import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  router,
  useFocusEffect,
} from 'expo-router';

import { useProfile } from '../../context/ProfileContext';

import PixelCard from '../../components/PixelCard';
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

type RarityTab =
  | 'all'
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'legendary';

type SortOption =
  | 'number'
  | 'name'
  | 'level';

type TypeFilter =
  | 'all'
  | 'normal'
  | 'fire'
  | 'water'
  | 'electric'
  | 'grass'
  | 'ice'
  | 'fighting'
  | 'poison'
  | 'ground'
  | 'flying'
  | 'psychic'
  | 'bug'
  | 'rock'
  | 'ghost'
  | 'dragon'
  | 'dark'
  | 'steel'
  | 'fairy';

type StageFilter =
  | 'all'
  | 1
  | 2
  | 3;

/*
 * ========================================
 * POKÉMON PC
 * ========================================
 *
 * The PC contains Pokémon actually stored
 * by the profile and NOT currently on the
 * active team.
 *
 * Features:
 *
 * - Rarity tabs
 * - Search
 * - Type filter
 * - Evolution stage filter
 * - Sorting
 *
 * Tapping a Pokémon still opens:
 *
 * /pokemon/detail/[userPokemonId]
 * ========================================
 */

export default function PokemonPCScreen() {
  const { profile } = useProfile();

  const [isLoading, setIsLoading] =
    useState(true);

  const [pcPokemon, setPCPokemon] =
    useState<PCEntry[]>([]);

  const [activeTab, setActiveTab] =
    useState<RarityTab>('all');

  const [searchQuery, setSearchQuery] =
    useState('');

  const [showFilters, setShowFilters] =
    useState(false);

  const [showSort, setShowSort] =
    useState(false);

  const [typeFilter, setTypeFilter] =
    useState<TypeFilter>('all');

  const [stageFilter, setStageFilter] =
    useState<StageFilter>('all');

  const [sortOption, setSortOption] =
    useState<SortOption>('number');

  const loadPC =
    useCallback(async () => {
      if (!profile?.id) {
        setIsLoading(false);
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

  /*
   * ========================================
   * FILTER + SORT
   * ========================================
   */

  const visiblePokemon =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      const filtered =
        pcPokemon.filter(
          (entry) => {
            const species =
              entry.species;

            if (!species) {
              return false;
            }

            /*
             * RARITY TAB
             */
            if (
              activeTab !== 'all' &&
              species.rarity !== activeTab
            ) {
              return false;
            }

            /*
             * SEARCH
             */
            if (
              query.length > 0 &&
              !species.name
                .toLowerCase()
                .includes(query)
            ) {
              return false;
            }

            /*
             * TYPE FILTER
             */
            if (
              typeFilter !== 'all' &&
              !species.types.includes(
                typeFilter
              )
            ) {
              return false;
            }

            /*
             * EVOLUTION STAGE
             */
            if (
              stageFilter !== 'all' &&
              species.evolutionStage !==
                stageFilter
            ) {
              return false;
            }

            return true;
          }
        );

      /*
       * SORT
       */
      return [...filtered].sort(
        (a, b) => {
          const speciesA =
            a.species;

          const speciesB =
            b.species;

          if (
            !speciesA ||
            !speciesB
          ) {
            return 0;
          }

          switch (sortOption) {
            case 'name':
              return speciesA.name.localeCompare(
                speciesB.name
              );

            case 'level':
              return (
                b.userPokemon.level -
                a.userPokemon.level
              );

            case 'number':
            default:
              return (
                speciesA.pokedexNumber -
                speciesB.pokedexNumber
              );
          }
        }
      );
    }, [
      pcPokemon,
      activeTab,
      searchQuery,
      typeFilter,
      stageFilter,
      sortOption,
    ]);

  /*
   * ========================================
   * TAB COUNTS
   * ========================================
   */

  const getRarityCount =
    useCallback(
      (
        rarity: RarityTab
      ) => {
        if (rarity === 'all') {
          return pcPokemon.length;
        }

        return pcPokemon.filter(
          (entry) =>
            entry.species?.rarity ===
            rarity
        ).length;
      },
      [pcPokemon]
    );

  const hasActiveFilters =
    typeFilter !== 'all' ||
    stageFilter !== 'all';

  const sortLabel =
    sortOption === 'number'
      ? 'NUMBER'
      : sortOption === 'name'
        ? 'NAME'
        : 'LEVEL';

  return (
    <View style={styles.container}>

      {/* ==================================
          HEADER
          ================================== */}

      <View style={styles.header}>

        <Pressable
          onPress={() =>
            router.back()
          }
          hitSlop={10}
        >
          <Text
            style={styles.backButton}
          >
            {'< BACK'}
          </Text>
        </Pressable>

        <Text style={styles.title}>
          YOUR PC
        </Text>

        <View
          style={styles.headerSpacer}
        />

      </View>

      {isLoading ? (

        <View
          style={
            styles.loadingScreen
          }
        >
          <ActivityIndicator
            size="small"
            color={colors.primary}
          />
        </View>

      ) : (

        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            styles.content
          }
        >

          {/* ==============================
              PC SUMMARY
              ============================== */}

          <View
            style={
              styles.summary
            }
          >

            <View>
              <Text
                style={
                  styles.summaryTitle
                }
              >
                PC STORAGE
              </Text>

              <Text
                style={
                  styles.summaryCount
                }
              >
                {visiblePokemon.length}
              </Text>
            </View>

            <View
              style={
                styles.summaryRight
              }
            >
              <Text
                style={
                  styles.summarySmall
                }
              >
                {pcPokemon.length}
              </Text>

              <Text
                style={
                  styles.summaryLabel
                }
              >
                TOTAL
              </Text>
            </View>

          </View>

          {/* ==============================
              RARITY TABS
              ============================== */}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.tabsContent
            }
            style={styles.tabsScroll}
          >

            {(
              [
                'all',
                'common',
                'uncommon',
                'rare',
                'legendary',
              ] as RarityTab[]
            ).map(
              (tab) => {

                const isActive =
                  activeTab === tab;

                return (
                  <Pressable
                    key={tab}
                    onPress={() =>
                      setActiveTab(
                        tab
                      )
                    }
                    style={[
                      styles.tab,

                      isActive &&
                        styles.tabActive,
                    ]}
                  >

                    <Text
                      style={[
                        styles.tabText,

                        isActive &&
                          styles.tabTextActive,
                      ]}
                    >
                      {tab === 'all'
                        ? 'ALL'
                        : tab.toUpperCase()}
                    </Text>

                    <Text
                      style={[
                        styles.tabCount,

                        isActive &&
                          styles.tabCountActive,
                      ]}
                    >
                      {getRarityCount(
                        tab
                      )}
                    </Text>

                  </Pressable>
                );
              }
            )}

          </ScrollView>

          {/* ==============================
              SEARCH
              ============================== */}

          <View
            style={
              styles.searchContainer
            }
          >

            <Text
              style={
                styles.searchIcon
              }
            >
              {'>'}
            </Text>

            <TextInput
              value={searchQuery}
              onChangeText={
                setSearchQuery
              }
              placeholder="SEARCH POKÉMON..."
              placeholderTextColor={
                colors.textMuted
              }
              style={
                styles.searchInput
              }
              autoCapitalize="none"
              autoCorrect={false}
            />

            {searchQuery.length >
              0 && (
              <Pressable
                onPress={() =>
                  setSearchQuery('')
                }
                hitSlop={8}
              >
                <Text
                  style={
                    styles.clearSearch
                  }
                >
                  X
                </Text>
              </Pressable>
            )}

          </View>

          {/* ==============================
              FILTER + SORT BUTTONS
              ============================== */}

          <View
            style={
              styles.controls
            }
          >

            <Pressable
              onPress={() => {
                setShowFilters(
                  (value) => !value
                );

                setShowSort(false);
              }}
              style={[
                styles.controlButton,

                hasActiveFilters &&
                  styles.controlButtonActive,
              ]}
            >

              <Text
                style={[
                  styles.controlText,

                  hasActiveFilters &&
                    styles.controlTextActive,
                ]}
              >
                FILTER
              </Text>

              {hasActiveFilters && (
                <Text
                  style={
                    styles.filterDot
                  }
                >
                  *
                </Text>
              )}

            </Pressable>

            <Pressable
              onPress={() => {
                setShowSort(
                  (value) => !value
                );

                setShowFilters(false);
              }}
              style={[
                styles.controlButton,
              ]}
            >
              <Text
                style={
                  styles.controlText
                }
              >
                SORT: {sortLabel}
              </Text>
            </Pressable>

          </View>

          {/* ==============================
              FILTER PANEL
              ============================== */}

          {showFilters && (

            <View
              style={
                styles.panel
              }
            >

              <Text
                style={
                  styles.panelTitle
                }
              >
                FILTER
              </Text>

              <Text
                style={
                  styles.filterLabel
                }
              >
                TYPE
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.filterRow
                }
              >

                {(
                  [
                    'all',
                    'normal',
                    'fire',
                    'water',
                    'electric',
                    'grass',
                    'ice',
                    'fighting',
                    'poison',
                    'ground',
                    'flying',
                    'psychic',
                    'bug',
                    'rock',
                    'ghost',
                    'dragon',
                    'dark',
                    'steel',
                    'fairy',
                  ] as TypeFilter[]
                ).map(
                  (type) => {

                    const isActive =
                      typeFilter ===
                      type;

                    return (
                      <Pressable
                        key={type}
                        onPress={() =>
                          setTypeFilter(
                            type
                          )
                        }
                        style={[
                          styles.filterChip,

                          isActive &&
                            styles.filterChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterChipText,

                            isActive &&
                              styles.filterChipTextActive,
                          ]}
                        >
                          {type.toUpperCase()}
                        </Text>
                      </Pressable>
                    );
                  }
                )}

              </ScrollView>

              <Text
                style={
                  styles.filterLabel
                }
              >
                EVOLUTION STAGE
              </Text>

              <View
                style={
                  styles.stageRow
                }
              >

                {(
                  [
                    'all',
                    1,
                    2,
                    3,
                  ] as StageFilter[]
                ).map(
                  (stage) => {

                    const isActive =
                      stageFilter ===
                      stage;

                    return (
                      <Pressable
                        key={String(stage)}
                        onPress={() =>
                          setStageFilter(
                            stage
                          )
                        }
                        style={[
                          styles.stageButton,

                          isActive &&
                            styles.stageButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.stageText,

                            isActive &&
                              styles.stageTextActive,
                          ]}
                        >
                          {stage === 'all'
                            ? 'ALL'
                            : `STAGE ${stage}`}
                        </Text>
                      </Pressable>
                    );
                  }
                )}

              </View>

              <Pressable
                onPress={() => {
                  setTypeFilter('all');
                  setStageFilter('all');
                }}
                style={
                  styles.resetButton
                }
              >
                <Text
                  style={
                    styles.resetText
                  }
                >
                  RESET FILTERS
                </Text>
              </Pressable>

            </View>
          )}

          {/* ==============================
              SORT PANEL
              ============================== */}

          {showSort && (

            <View
              style={
                styles.panel
              }
            >

              <Text
                style={
                  styles.panelTitle
                }
              >
                SORT BY
              </Text>

              {(
                [
                  {
                    value: 'number',
                    label: 'POKÉDEX NUMBER',
                  },
                  {
                    value: 'name',
                    label: 'NAME A-Z',
                  },
                  {
                    value: 'level',
                    label: 'LEVEL HIGH → LOW',
                  },
                ] as {
                  value: SortOption;
                  label: string;
                }[]
              ).map(
                (option) => {

                  const isActive =
                    sortOption ===
                    option.value;

                  return (
                    <Pressable
                      key={
                        option.value
                      }
                      onPress={() => {
                        setSortOption(
                          option.value
                        );

                        setShowSort(
                          false
                        );
                      }}
                      style={[
                        styles.sortOption,

                        isActive &&
                          styles.sortOptionActive,
                      ]}
                    >

                      <Text
                        style={[
                          styles.sortOptionText,

                          isActive &&
                            styles.sortOptionTextActive,
                        ]}
                      >
                        {isActive
                          ? '> '
                          : '  '}

                        {option.label}
                      </Text>

                    </Pressable>
                  );
                }
              )}

            </View>
          )}

          {/* ==============================
              RESULTS
              ============================== */}

          {visiblePokemon.length ===
          0 ? (

            <View
              style={
                styles.noResults
              }
            >

              <Text
                style={
                  styles.noResultsTitle
                }
              >
                NO POKÉMON FOUND
              </Text>

              <Text
                style={
                  styles.noResultsSubtext
                }
              >
                TRY CHANGING YOUR SEARCH
                OR FILTERS
              </Text>

            </View>

          ) : (

            <View
              style={
                styles.grid
              }
            >

              {visiblePokemon.map(
                (entry) => (

                  <PixelCard
                    key={
                      entry.userPokemon.id
                    }
                    padding={
                      spacing.sm
                    }
                    style={
                      styles.gridCell
                    }
                  >

                    <Pressable
                      onPress={() =>
                        router.push(
                          `/pokemon/detail/${entry.userPokemon.id}`
                        )
                      }
                      style={({
                        pressed,
                      }) => [
                        styles.gridCellContent,

                        pressed && {
                          opacity: 0.7,
                        },
                      ]}
                    >

                      {entry.species
                        ?.iconAssetId && (
                        <AnimatedPokemonIcon
                          iconAssetId={
                            entry.species
                              .iconAssetId
                          }
                          size={64}
                          frameDuration={
                            250
                          }
                        />
                      )}

                      <Text
                        style={
                          styles.gridNumber
                        }
                      >
                        #
                        {String(
                          entry.species
                            ?.pokedexNumber ??
                            0
                        ).padStart(
                          3,
                          '0'
                        )}
                      </Text>

                      <Text
                        style={
                          styles.gridName
                        }
                        numberOfLines={1}
                      >
                        {entry.species
                          ?.name ??
                          '???'}
                      </Text>

                      <Text
                        style={
                          styles.gridLevel
                        }
                      >
                        LV {
                          entry.userPokemon
                            .level
                        }
                      </Text>

                    </Pressable>

                  </PixelCard>
                )
              )}

            </View>
          )}

        </ScrollView>
      )}

    </View>
  );
}

const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    header: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      paddingHorizontal:
        spacing.lg,

      paddingTop:
        spacing.xxl,

      paddingBottom:
        spacing.md,
    },

    backButton: {
      fontFamily:
        'VT323',

      fontSize: 20,

      color:
        colors.primary,
    },

    headerSpacer: {
      width: 60,
    },

    title: {
      fontFamily:
        'PressStart2P',

      fontSize: 14,

      color:
        colors.text,
    },

    loadingScreen: {
      flex: 1,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    content: {
      padding:
        spacing.lg,

      paddingBottom:
        spacing.xxxl,
    },

    /* ================================
       SUMMARY
       ================================ */

    summary: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      borderWidth: 2,

      borderColor:
        colors.border,

      backgroundColor:
        colors.surface,

      padding:
        spacing.md,

      marginBottom:
        spacing.md,
    },

    summaryTitle: {
      fontFamily:
        'PressStart2P',

      fontSize: 8,

      color:
        colors.textSecondary,
    },

    summaryCount: {
      fontFamily:
        'PressStart2P',

      fontSize: 22,

      color:
        colors.primary,

      marginTop:
        spacing.xs,
    },

    summaryRight: {
      alignItems:
        'flex-end',
    },

    summarySmall: {
      fontFamily:
        'PressStart2P',

      fontSize: 14,

      color:
        colors.text,
    },

    summaryLabel: {
      fontFamily:
        'VT323',

      fontSize: 14,

      color:
        colors.textMuted,

      marginTop:
        spacing.xs,
    },

    /* ================================
       RARITY TABS
       ================================ */

    tabsScroll: {
      marginBottom:
        spacing.md,
    },

    tabsContent: {
      gap: spacing.xs,
    },

    tab: {
      minWidth: 76,

      paddingHorizontal:
        spacing.sm,

      paddingVertical:
        spacing.sm,

      borderWidth: 2,

      borderColor:
        colors.border,

      backgroundColor:
        colors.surface,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    tabActive: {
      backgroundColor:
        colors.primary,

      borderColor:
        colors.primary,
    },

    tabText: {
      fontFamily:
        'PressStart2P',

      fontSize: 6,

      color:
        colors.textSecondary,
    },

    tabTextActive: {
      color:
        colors.background,
    },

    tabCount: {
      fontFamily:
        'VT323',

      fontSize: 14,

      color:
        colors.textMuted,

      marginTop:
        2,
    },

    tabCountActive: {
      color:
        colors.background,
    },

    /* ================================
       SEARCH
       ================================ */

    searchContainer: {
      flexDirection:
        'row',

      alignItems:
        'center',

      borderWidth: 2,

      borderColor:
        colors.border,

      backgroundColor:
        colors.surface,

      paddingHorizontal:
        spacing.sm,

      marginBottom:
        spacing.sm,

      minHeight: 44,
    },

    searchIcon: {
      fontFamily:
        'PressStart2P',

      fontSize: 10,

      color:
        colors.primary,

      marginRight:
        spacing.sm,
    },

    searchInput: {
      flex: 1,

      fontFamily:
        'VT323',

      fontSize: 18,

      color:
        colors.text,

      paddingVertical:
        spacing.xs,
    },

    clearSearch: {
      fontFamily:
        'PressStart2P',

      fontSize: 9,

      color:
        colors.textSecondary,

      padding:
        spacing.xs,
    },

    /* ================================
       CONTROLS
       ================================ */

    controls: {
      flexDirection:
        'row',

      gap: spacing.sm,

      marginBottom:
        spacing.sm,
    },

    controlButton: {
      flex: 1,

      minHeight: 40,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderWidth: 2,

      borderColor:
        colors.border,

      backgroundColor:
        colors.surface,

      flexDirection:
        'row',
    },

    controlButtonActive: {
      borderColor:
        colors.primary,
    },

    controlText: {
      fontFamily:
        'PressStart2P',

      fontSize: 6,

      color:
        colors.textSecondary,
    },

    controlTextActive: {
      color:
        colors.primary,
    },

    filterDot: {
      fontFamily:
        'PressStart2P',

      fontSize: 8,

      color:
        colors.primary,

      marginLeft:
        4,
    },

    /* ================================
       FILTER / SORT PANEL
       ================================ */

    panel: {
      borderWidth: 2,

      borderColor:
        colors.border,

      backgroundColor:
        colors.surface,

      padding:
        spacing.md,

      marginBottom:
        spacing.md,
    },

    panelTitle: {
      fontFamily:
        'PressStart2P',

      fontSize: 8,

      color:
        colors.primary,

      marginBottom:
        spacing.md,
    },

    filterLabel: {
      fontFamily:
        'PressStart2P',

      fontSize: 6,

      color:
        colors.textSecondary,

      marginBottom:
        spacing.sm,
    },

    filterRow: {
      gap: spacing.xs,

      paddingBottom:
        spacing.md,
    },

    filterChip: {
      borderWidth: 1,

      borderColor:
        colors.border,

      backgroundColor:
        colors.background,

      paddingHorizontal:
        spacing.sm,

      paddingVertical:
        spacing.xs,
    },

    filterChipActive: {
      backgroundColor:
        colors.primary,

      borderColor:
        colors.primary,
    },

    filterChipText: {
      fontFamily:
        'VT323',

      fontSize: 15,

      color:
        colors.textSecondary,
    },

    filterChipTextActive: {
      color:
        colors.background,
    },

    stageRow: {
      flexDirection:
        'row',

      gap: spacing.xs,

      marginBottom:
        spacing.md,
    },

    stageButton: {
      flex: 1,

      borderWidth: 1,

      borderColor:
        colors.border,

      backgroundColor:
        colors.background,

      paddingVertical:
        spacing.sm,

      alignItems:
        'center',
    },

    stageButtonActive: {
      backgroundColor:
        colors.primary,

      borderColor:
        colors.primary,
    },

    stageText: {
      fontFamily:
        'PressStart2P',

      fontSize: 5,

      color:
        colors.textSecondary,
    },

    stageTextActive: {
      color:
        colors.background,
    },

    resetButton: {
      borderWidth: 1,

      borderColor:
        colors.border,

      paddingVertical:
        spacing.sm,

      alignItems:
        'center',
    },

    resetText: {
      fontFamily:
        'PressStart2P',

      fontSize: 6,

      color:
        colors.textMuted,
    },

    sortOption: {
      borderWidth: 1,

      borderColor:
        colors.border,

      paddingVertical:
        spacing.sm,

      paddingHorizontal:
        spacing.sm,

      marginBottom:
        spacing.xs,

      backgroundColor:
        colors.background,
    },

    sortOptionActive: {
      backgroundColor:
        colors.primary,
    },

    sortOptionText: {
      fontFamily:
        'PressStart2P',

      fontSize: 6,

      color:
        colors.textSecondary,
    },

    sortOptionTextActive: {
      color:
        colors.background,
    },

    /* ================================
       GRID
       ================================ */

    grid: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      gap: spacing.sm,

      paddingTop:
        spacing.xs,

      paddingBottom:
        spacing.xxxl,
    },

    gridCell: {
      width: '31%',
    },

    gridCellContent: {
      alignItems:
        'center',
    },

    gridNumber: {
      fontFamily:
        'VT323',

      fontSize: 11,

      color:
        colors.textMuted,

      marginTop:
        spacing.xs,
    },

    gridName: {
      fontFamily:
        'VT323',

      fontSize: 14,

      color:
        colors.text,

      marginTop:
        1,
    },

    gridLevel: {
      fontFamily:
        'VT323',

      fontSize: 12,

      color:
        colors.textSecondary,
    },

    /* ================================
       EMPTY / NO RESULTS
       ================================ */

    noResults: {
      alignItems:
        'center',

      justifyContent:
        'center',

      paddingVertical:
        spacing.xxxl,
    },

    noResultsTitle: {
      fontFamily:
        'PressStart2P',

      fontSize: 9,

      color:
        colors.textSecondary,

      textAlign:
        'center',
    },

    noResultsSubtext: {
      fontFamily:
        'VT323',

      fontSize: 17,

      color:
        colors.textMuted,

      textAlign:
        'center',

      marginTop:
        spacing.md,
    },

  });
