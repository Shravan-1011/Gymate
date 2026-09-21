import React from 'react';

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MusicPlayer from '../../components/audio/MusicPlayer';
import MusicTrackCard from '../../components/audio/MusicTrackCard';

import { MUSIC_TRACKS } from '../../data/musicTracks';
import { useMusic } from '../../context/MusicContext';

import {
  colors,
  spacing,
} from '../../constants/theme';

export default function PokemonMusicScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    mode,
    selectedTrackId,
    setMode,
    selectTrack,
  } = useMusic();

  return (
    <View style={styles.screen}>
      {/* HEADER */}

      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            height: 64 + insets.top,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>
            ‹
          </Text>
        </Pressable>

        <Text style={styles.headerTitle}>
          MUSIC
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom:
              insets.bottom +
              spacing.xxxl +
              spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* PLAYER */}

        <MusicPlayer />

        {/* PLAY MODE */}

        <Text style={styles.sectionTitle}>
          PLAY MODE
        </Text>

        <View style={styles.modeContainer}>
          <Pressable
            onPress={() => setMode('off')}
            style={[
              styles.modeButton,
              mode === 'off' &&
                styles.modeButtonActive,
            ]}
          >
            <Text
              style={[
                styles.modeText,
                mode === 'off' &&
                  styles.modeTextActive,
              ]}
            >
              OFF
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              if (selectedTrackId) {
                setMode('selected');
              } else if (
                MUSIC_TRACKS.length > 0
              ) {
                selectTrack(
                  MUSIC_TRACKS[0].id,
                );
              }
            }}
            style={[
              styles.modeButton,
              mode === 'selected' &&
                styles.modeButtonActive,
            ]}
          >
            <Text
              style={[
                styles.modeText,
                mode === 'selected' &&
                  styles.modeTextActive,
              ]}
            >
              SELECT
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setMode('shuffle');
            }}
            style={[
              styles.modeButton,
              mode === 'shuffle' &&
                styles.modeButtonActive,
            ]}
          >
            <Text
              style={[
                styles.modeText,
                mode === 'shuffle' &&
                  styles.modeTextActive,
              ]}
            >
              🔀
            </Text>

            <Text
              style={[
                styles.modeText,
                mode === 'shuffle' &&
                  styles.modeTextActive,
              ]}
            >
              SHUFFLE
            </Text>
          </Pressable>
        </View>

        {/* EXPLANATION */}

        <View style={styles.modeDescription}>
          {mode === 'off' && (
            <>
              <Text
                style={styles.descriptionTitle}
              >
                MUSIC OFF
              </Text>

              <Text
                style={styles.descriptionText}
              >
                Background music is disabled.
              </Text>
            </>
          )}

          {mode === 'selected' && (
            <>
              <Text
                style={styles.descriptionTitle}
              >
                SELECTED TRACK
              </Text>

              <Text
                style={styles.descriptionText}
              >
                Your selected track will keep
                playing in the background.
              </Text>
            </>
          )}

          {mode === 'shuffle' && (
            <>
              <Text
                style={styles.descriptionTitle}
              >
                SHUFFLE MODE
              </Text>

              <Text
                style={styles.descriptionText}
              >
                Gymate will automatically play
                another track when the current
                one finishes.
              </Text>
            </>
          )}
        </View>

        {/* LIBRARY */}

        <Text style={styles.sectionTitle}>
          BGM LIBRARY
        </Text>

        {MUSIC_TRACKS.map((track) => (
          <MusicTrackCard
            key={track.id}
            track={track}
            selected={
              selectedTrackId === track.id
            }
            onPress={() =>
              selectTrack(track.id)
            }
          />
        ))}

        {MUSIC_TRACKS.length === 0 && (
          <View style={styles.emptyLibrary}>
            <Text style={styles.emptyTitle}>
              NO TRACKS
            </Text>

            <Text style={styles.emptyText}>
              Add BGM files to your music
              library.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  /* -------------------------------
     HEADER
     ------------------------------- */

  header: {
    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: spacing.lg,

    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },

  backButton: {
    width: 40,
    height: 40,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },

  backText: {
    color: colors.primary,
    fontFamily: 'VT323',
    fontSize: 34,
    lineHeight: 34,
  },

  headerTitle: {
    flex: 1,

    textAlign: 'center',

    fontFamily: 'PressStart2P',
    fontSize: 11,

    color: colors.primary,
  },

  headerSpacer: {
    width: 40,
  },

  /* -------------------------------
     CONTENT
     ------------------------------- */

  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  sectionTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: colors.primary,

    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },

  /* -------------------------------
     PLAY MODE
     ------------------------------- */

  modeContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  modeButton: {
    flex: 1,

    minHeight: 44,

    borderWidth: 2,
    borderColor: colors.border,

    backgroundColor: colors.surface,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: spacing.xs,
  },

  modeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceLight,
  },

  modeText: {
    fontFamily: 'PressStart2P',
    fontSize: 6,

    color: colors.textMuted,

    textAlign: 'center',
  },

  modeTextActive: {
    color: colors.primary,
  },

  modeDescription: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,

    backgroundColor: colors.surface,

    padding: spacing.md,

    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },

  descriptionTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 7,
    color: colors.text,
  },

  descriptionText: {
    fontFamily: 'VT323',
    fontSize: 16,
    color: colors.textSecondary,

    lineHeight: 20,

    marginTop: spacing.sm,
  },

  /* -------------------------------
     EMPTY STATE
     ------------------------------- */

  emptyLibrary: {
    borderWidth: 2,
    borderColor: colors.border,

    backgroundColor: colors.surface,

    padding: spacing.xl,

    alignItems: 'center',
  },

  emptyTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: colors.textMuted,
  },

  emptyText: {
    fontFamily: 'VT323',
    fontSize: 16,
    color: colors.textMuted,

    textAlign: 'center',

    marginTop: spacing.sm,
  },
});