import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';

import {
  MUSIC_TRACKS,
  MusicTrack,
} from '../data/musicTracks';

const STORAGE_KEY =
  '@gymate/music-settings';

export type MusicMode =
  | 'off'
  | 'selected'
  | 'shuffle';

export type MusicSettings = {
  mode: MusicMode;
  selectedTrackId: string | null;
};

type MusicContextValue = {
  mode: MusicMode;
  selectedTrackId: string | null;
  currentTrack: MusicTrack | null;

  musicEnabled: boolean;
  musicVolume: number;

  isPlaying: boolean;

  /*
   * Main music API
   */
  setMode: (mode: MusicMode) => void;
  setSelectedTrack: (trackId: string) => void;

  /*
   * Existing API used by the current
   * music screen / MusicPlayer.
   */
  selectTrack: (trackId: string) => void;
  togglePlayback: () => void;
  previousTrack: () => void;

  /*
   * Settings
   */
  setMusicEnabled: (enabled: boolean) => void;
  setMusicVolume: (volume: number) => void;

  /*
   * Playback
   */
  playMusic: () => void;
  pauseMusic: () => boolean;
  resumeMusic: () => void;
  stopMusic: () => void;

  nextTrack: () => void;
};

const MusicContext =
  createContext<MusicContextValue | null>(
    null
  );

const DEFAULT_SETTINGS: MusicSettings = {
  mode: 'off',
  selectedTrackId: null,
};

function clamp(value: number) {
  return Math.max(
    0,
    Math.min(1, value)
  );
}


/*
 * ========================================
 * RANDOM TRACK
 * ========================================
 *
 * Shuffle avoids immediately repeating
 * the same track.
 */

function getRandomTrackId(
  currentTrackId: string | null
): string | null {
  if (
    MUSIC_TRACKS.length === 0
  ) {
    return null;
  }

  if (
    MUSIC_TRACKS.length === 1
  ) {
    return MUSIC_TRACKS[0].id;
  }

  const availableTracks =
    MUSIC_TRACKS.filter(
      track =>
        track.id !== currentTrackId
    );

  const randomIndex =
    Math.floor(
      Math.random() *
        availableTracks.length
    );

  return (
    availableTracks[
      randomIndex
    ]?.id ?? null
  );
}


/*
 * ========================================
 * PROVIDER
 * ========================================
 */

export function MusicProvider({
  children,
}: PropsWithChildren) {
  const [mode, setModeState] =
    useState<MusicMode>(
      DEFAULT_SETTINGS.mode
    );

  const [
    selectedTrackId,
    setSelectedTrackIdState,
  ] = useState<string | null>(
    DEFAULT_SETTINGS.selectedTrackId
  );

  const [
    musicEnabled,
    setMusicEnabledState,
  ] = useState(true);

  const [
    musicVolume,
    setMusicVolumeState,
  ] = useState(0.35);

  const [isLoaded, setIsLoaded] =
    useState(false);


  /*
   * ========================================
   * CURRENT TRACK
   * ========================================
   */

  const currentTrack =
    MUSIC_TRACKS.find(
      track =>
        track.id ===
        selectedTrackId
    ) ?? null;


  /*
   * ========================================
   * AUDIO PLAYER
   * ========================================
   */

  const player =
    useAudioPlayer(
      currentTrack?.source ?? null,
      {
        updateInterval: 500,
      }
    );

  const status =
    useAudioPlayerStatus(
      player
    );


  /*
   * ========================================
   * LOAD SETTINGS
   * ========================================
   */

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        const raw =
          await AsyncStorage.getItem(
            STORAGE_KEY
          );

        if (!raw) {
          if (mounted) {
            setIsLoaded(true);
          }

          return;
        }

        const parsed =
          JSON.parse(raw) as
            Partial<MusicSettings> & {
              musicEnabled?: boolean;
              musicVolume?: number;
            };

        if (!mounted) {
          return;
        }


        /*
         * Mode
         */

        if (
          parsed.mode === 'off' ||
          parsed.mode === 'selected' ||
          parsed.mode === 'shuffle'
        ) {
          setModeState(
            parsed.mode
          );
        }


        /*
         * Selected track
         */

        if (
          typeof parsed.selectedTrackId ===
          'string'
        ) {
          setSelectedTrackIdState(
            parsed.selectedTrackId
          );
        }


        /*
         * Music enabled
         */

        if (
          typeof parsed.musicEnabled ===
          'boolean'
        ) {
          setMusicEnabledState(
            parsed.musicEnabled
          );
        }


        /*
         * Music volume
         */

        if (
          typeof parsed.musicVolume ===
          'number'
        ) {
          setMusicVolumeState(
            clamp(
              parsed.musicVolume
            )
          );
        }
      } catch (error) {
        console.warn(
          '[MusicContext] Failed to load settings:',
          error
        );
      } finally {
        if (mounted) {
          setIsLoaded(true);
        }
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);


  /*
   * ========================================
   * SAVE SETTINGS
   * ========================================
   */

  const saveSettings =
    useCallback(
      async (
        nextMode: MusicMode,
        nextTrackId: string | null,
        nextEnabled: boolean,
        nextVolume: number
      ) => {
        try {
          await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              mode: nextMode,
              selectedTrackId:
                nextTrackId,
              musicEnabled:
                nextEnabled,
              musicVolume:
                nextVolume,
            })
          );
        } catch (error) {
          console.warn(
            '[MusicContext] Failed to save settings:',
            error
          );
        }
      },
      []
    );


  /*
   * ========================================
   * PLAYER VOLUME
   * ========================================
   */

  useEffect(() => {
    player.volume =
      musicEnabled
        ? musicVolume
        : 0;
  }, [
    player,
    musicEnabled,
    musicVolume,
  ]);


  /*
   * ========================================
   * SELECTED TRACK LOOP
   * ========================================
   *
   * Selected mode loops continuously.
   */

  useEffect(() => {
    if (
      mode === 'selected' &&
      currentTrack
    ) {
      player.loop = true;
    } else {
      player.loop = false;
    }
  }, [
    player,
    mode,
    currentTrack,
  ]);


  /*
   * ========================================
   * SHUFFLE TRACK END
   * ========================================
   */

  useEffect(() => {
    if (
      mode !== 'shuffle' ||
      !status.didJustFinish
    ) {
      return;
    }

    const nextTrackId =
      getRandomTrackId(
        selectedTrackId
      );

    if (!nextTrackId) {
      return;
    }

    setSelectedTrackIdState(
      nextTrackId
    );

    saveSettings(
      mode,
      nextTrackId,
      musicEnabled,
      musicVolume
    );
  }, [
    status.didJustFinish,
    mode,
    selectedTrackId,
    musicEnabled,
    musicVolume,
    saveSettings,
  ]);


  /*
   * ========================================
   * SET MODE
   * ========================================
   */

  const setMode =
    useCallback(
      (nextMode: MusicMode) => {
        setModeState(
          nextMode
        );

        saveSettings(
          nextMode,
          selectedTrackId,
          musicEnabled,
          musicVolume
        );


        /*
         * OFF
         */

        if (
          nextMode === 'off'
        ) {
          player.pause();
          return;
        }


        /*
         * SELECTED / SHUFFLE
         */

        if (
          nextMode === 'selected' ||
          nextMode === 'shuffle'
        ) {
          /*
           * If no track has ever been
           * selected, choose the first.
           */

          if (
            !selectedTrackId
          ) {
            const firstTrack =
              MUSIC_TRACKS[0];

            if (firstTrack) {
              setSelectedTrackIdState(
                firstTrack.id
              );

              saveSettings(
                nextMode,
                firstTrack.id,
                musicEnabled,
                musicVolume
              );
            }

            return;
          }


          /*
           * Start playback if allowed.
           */

          if (
            musicEnabled &&
            musicVolume > 0
          ) {
            player.play();
          }
        }
      },
      [
        player,
        selectedTrackId,
        musicEnabled,
        musicVolume,
        saveSettings,
      ]
    );


  /*
   * ========================================
   * SET SELECTED TRACK
   * ========================================
   */

  const setSelectedTrack =
    useCallback(
      (trackId: string) => {
        const track =
          MUSIC_TRACKS.find(
            item =>
              item.id === trackId
          );

        if (!track) {
          return;
        }

        setSelectedTrackIdState(
          trackId
        );

        saveSettings(
          mode,
          trackId,
          musicEnabled,
          musicVolume
        );
      },
      [
        mode,
        musicEnabled,
        musicVolume,
        saveSettings,
      ]
    );


  /*
   * ========================================
   * EXISTING API:
   * selectTrack
   * ========================================
   *
   * Your existing app/pokemon/music.tsx
   * uses this name.
   */

  const selectTrack =
    useCallback(
      (trackId: string) => {
        setSelectedTrack(
          trackId
        );
      },
      [setSelectedTrack]
    );


  /*
   * ========================================
   * ENABLE / DISABLE MUSIC
   * ========================================
   */

  const setMusicEnabled =
    useCallback(
      (enabled: boolean) => {
        setMusicEnabledState(
          enabled
        );

        saveSettings(
          mode,
          selectedTrackId,
          enabled,
          musicVolume
        );


        /*
         * Disable
         */

        if (!enabled) {
          player.pause();
          return;
        }


        /*
         * Enable
         */

        if (
          mode !== 'off' &&
          selectedTrackId &&
          musicVolume > 0
        ) {
          player.play();
        }
      },
      [
        player,
        mode,
        selectedTrackId,
        musicVolume,
        saveSettings,
      ]
    );


  /*
   * ========================================
   * VOLUME
   * ========================================
   */

  const setMusicVolume =
    useCallback(
      (volume: number) => {
        const nextVolume =
          clamp(volume);

        setMusicVolumeState(
          nextVolume
        );

        saveSettings(
          mode,
          selectedTrackId,
          musicEnabled,
          nextVolume
        );

        player.volume =
          musicEnabled
            ? nextVolume
            : 0;
      },
      [
        player,
        mode,
        selectedTrackId,
        musicEnabled,
        saveSettings,
      ]
    );


  /*
   * ========================================
   * PLAY
   * ========================================
   */

  const playMusic =
    useCallback(() => {
      if (
        mode === 'off' ||
        !musicEnabled ||
        musicVolume <= 0 ||
        !currentTrack
      ) {
        return;
      }

      player.volume =
        musicVolume;

      player.play();
    }, [
      player,
      mode,
      musicEnabled,
      musicVolume,
      currentTrack,
    ]);


  /*
   * ========================================
   * PAUSE
   * ========================================
   *
   * Returns true ONLY if music was
   * actually playing.
   *
   * Used by Pokémon obtain sound:
   *
   *   const wasPlaying =
   *     pauseMusic();
   *
   *   ...
   *
   *   if (wasPlaying) {
   *     resumeMusic();
   *   }
   *
   * IMPORTANT:
   * This does NOT change the selected
   * track or music mode.
   */

  const pauseMusic =
    useCallback(
      (): boolean => {
        if (
          !status.playing
        ) {
          return false;
        }

        player.pause();

        return true;
      },
      [
        player,
        status.playing,
      ]
    );


  /*
   * ========================================
   * RESUME
   * ========================================
   *
   * Resumes the current track from its
   * current position.
   */

  const resumeMusic =
    useCallback(() => {
      if (
        mode === 'off' ||
        !musicEnabled ||
        musicVolume <= 0 ||
        !currentTrack
      ) {
        return;
      }

      player.volume =
        musicVolume;

      player.play();
    }, [
      player,
      mode,
      musicEnabled,
      musicVolume,
      currentTrack,
    ]);


  /*
   * ========================================
   * STOP
   * ========================================
   *
   * Unlike pause, this resets the track
   * to the beginning.
   */

  const stopMusic =
    useCallback(() => {
      player.pause();
      player.seekTo(0);
    }, [player]);


  /*
   * ========================================
   * NEXT TRACK
   * ========================================
   */

  const nextTrack =
    useCallback(() => {
      const nextTrackId =
        getRandomTrackId(
          selectedTrackId
        );

      if (!nextTrackId) {
        return;
      }

      setSelectedTrackIdState(
        nextTrackId
      );

      saveSettings(
        mode,
        nextTrackId,
        musicEnabled,
        musicVolume
      );
    }, [
      selectedTrackId,
      mode,
      musicEnabled,
      musicVolume,
      saveSettings,
    ]);


  /*
   * ========================================
   * PREVIOUS TRACK
   * ========================================
   *
   * Required by MusicPlayer.tsx.
   */

  const previousTrack =
    useCallback(() => {
      if (
        MUSIC_TRACKS.length === 0
      ) {
        return;
      }

      const currentIndex =
        MUSIC_TRACKS.findIndex(
          track =>
            track.id ===
            selectedTrackId
        );

      if (
        currentIndex === -1
      ) {
        return;
      }

      const previousIndex =
        currentIndex === 0
          ? MUSIC_TRACKS.length - 1
          : currentIndex - 1;

      const previous =
        MUSIC_TRACKS[
          previousIndex
        ];

      if (!previous) {
        return;
      }

      setSelectedTrackIdState(
        previous.id
      );

      saveSettings(
        mode,
        previous.id,
        musicEnabled,
        musicVolume
      );
    }, [
      selectedTrackId,
      mode,
      musicEnabled,
      musicVolume,
      saveSettings,
    ]);


  /*
   * ========================================
   * TOGGLE PLAYBACK
   * ========================================
   *
   * Required by MusicPlayer.tsx.
   */

  const togglePlayback =
    useCallback(() => {
      /*
       * Currently playing → pause
       */

      if (status.playing) {
        player.pause();
        return;
      }


      /*
       * Currently paused → play
       */

      if (
        mode === 'off' ||
        !musicEnabled ||
        musicVolume <= 0 ||
        !currentTrack
      ) {
        return;
      }

      player.volume =
        musicVolume;

      player.play();
    }, [
      player,
      status.playing,
      mode,
      musicEnabled,
      musicVolume,
      currentTrack,
    ]);


  /*
   * ========================================
   * AUTO START AFTER TRACK / MODE CHANGES
   * ========================================
   */

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (
      mode === 'off' ||
      !musicEnabled ||
      musicVolume <= 0 ||
      !currentTrack
    ) {
      player.pause();
      return;
    }

    player.volume =
      musicVolume;

    player.play();
  }, [
    isLoaded,
    currentTrack,
    mode,
    musicEnabled,
    musicVolume,
    player,
  ]);


  /*
   * ========================================
   * CONTEXT VALUE
   * ========================================
   */

  const value =
    useMemo<MusicContextValue>(
      () => ({
        mode,
        selectedTrackId,
        currentTrack,

        musicEnabled,
        musicVolume,

        isPlaying:
          status.playing,

        /*
         * Main API
         */

        setMode,
        setSelectedTrack,

        /*
         * Compatibility API
         *
         * These are required by the
         * existing music screen/components.
         */

        selectTrack,
        togglePlayback,
        previousTrack,

        /*
         * Settings
         */

        setMusicEnabled,
        setMusicVolume,

        /*
         * Playback
         */

        playMusic,
        pauseMusic,
        resumeMusic,
        stopMusic,

        nextTrack,
      }),
      [
        mode,
        selectedTrackId,
        currentTrack,

        musicEnabled,
        musicVolume,

        status.playing,

        setMode,
        setSelectedTrack,

        selectTrack,
        togglePlayback,
        previousTrack,

        setMusicEnabled,
        setMusicVolume,

        playMusic,
        pauseMusic,
        resumeMusic,
        stopMusic,

        nextTrack,
      ]
    );


  /*
   * ========================================
   * PROVIDER
   * ========================================
   */

  return (
    <MusicContext.Provider
      value={value}
    >
      {children}
    </MusicContext.Provider>
  );
}


/*
 * ========================================
 * HOOK
 * ========================================
 */

export function useMusic() {
  const context =
    useContext(
      MusicContext
    );

  if (!context) {
    throw new Error(
      'useMusic must be used inside MusicProvider'
    );
  }

  return context;
}