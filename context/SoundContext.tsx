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

const STORAGE_KEY = '@gymate/sound-settings';

export type SoundSettings = {
  soundEnabled: boolean;
  soundVolume: number; // 0 - 1
  musicEnabled: boolean;
  musicVolume: number; // 0 - 1
};

type SoundContextValue = SoundSettings & {
  isLoaded: boolean;

  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;

  setMusicEnabled: (enabled: boolean) => void;
  setMusicVolume: (volume: number) => void;
};

const DEFAULT_SETTINGS: SoundSettings = {
  soundEnabled: true,
  soundVolume: 1,

  musicEnabled: true,
  musicVolume: 0.35,
};

const SoundContext = createContext<SoundContextValue | null>(null);

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function SoundProvider({
  children,
}: PropsWithChildren) {
  const [settings, setSettings] =
    useState<SoundSettings>(DEFAULT_SETTINGS);

  const [isLoaded, setIsLoaded] = useState(false);

  // -----------------------------------------
  // LOAD SETTINGS
  // -----------------------------------------

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        const raw =
          await AsyncStorage.getItem(STORAGE_KEY);

        if (!raw || !mounted) {
          setIsLoaded(true);
          return;
        }

        const parsed =
          JSON.parse(raw) as Partial<SoundSettings>;

        setSettings({
          soundEnabled:
            typeof parsed.soundEnabled === 'boolean'
              ? parsed.soundEnabled
              : DEFAULT_SETTINGS.soundEnabled,

          soundVolume:
            typeof parsed.soundVolume === 'number'
              ? clamp(parsed.soundVolume)
              : DEFAULT_SETTINGS.soundVolume,

          musicEnabled:
            typeof parsed.musicEnabled === 'boolean'
              ? parsed.musicEnabled
              : DEFAULT_SETTINGS.musicEnabled,

          musicVolume:
            typeof parsed.musicVolume === 'number'
              ? clamp(parsed.musicVolume)
              : DEFAULT_SETTINGS.musicVolume,
        });
      } catch (error) {
        console.warn(
          '[SoundContext] Failed to load settings:',
          error,
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

  // -----------------------------------------
  // SAVE
  // -----------------------------------------

  const saveSettings = useCallback(
    async (next: SoundSettings) => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(next),
        );
      } catch (error) {
        console.warn(
          '[SoundContext] Failed to save settings:',
          error,
        );
      }
    },
    [],
  );

  // -----------------------------------------
  // SOUND EFFECTS
  // -----------------------------------------

  const setSoundEnabled = useCallback(
    (enabled: boolean) => {
      setSettings((current) => {
        const next = {
          ...current,
          soundEnabled: enabled,
        };

        saveSettings(next);

        return next;
      });
    },
    [saveSettings],
  );

  const setSoundVolume = useCallback(
    (volume: number) => {
      setSettings((current) => {
        const next = {
          ...current,
          soundVolume: clamp(volume),
        };

        saveSettings(next);

        return next;
      });
    },
    [saveSettings],
  );

  // -----------------------------------------
  // MUSIC
  // -----------------------------------------

  const setMusicEnabled = useCallback(
    (enabled: boolean) => {
      setSettings((current) => {
        const next = {
          ...current,
          musicEnabled: enabled,
        };

        saveSettings(next);

        return next;
      });
    },
    [saveSettings],
  );

  const setMusicVolume = useCallback(
    (volume: number) => {
      setSettings((current) => {
        const next = {
          ...current,
          musicVolume: clamp(volume),
        };

        saveSettings(next);

        return next;
      });
    },
    [saveSettings],
  );

  const value = useMemo(
    () => ({
      ...settings,

      isLoaded,

      setSoundEnabled,
      setSoundVolume,

      setMusicEnabled,
      setMusicVolume,
    }),
    [
      settings,
      isLoaded,

      setSoundEnabled,
      setSoundVolume,

      setMusicEnabled,
      setMusicVolume,
    ],
  );

  return (
    <SoundContext.Provider value={value}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSoundSettings() {
  const context = useContext(SoundContext);

  if (!context) {
    throw new Error(
      'useSoundSettings must be used inside SoundProvider',
    );
  }

  return context;
}