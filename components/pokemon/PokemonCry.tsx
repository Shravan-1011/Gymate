import { useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { useAudioPlayer } from 'expo-audio';

import {
  getPokemonCrySource,
} from '../../assets/pokemon/registry';

import {
  useSoundSettings,
} from '../../context/SoundContext';

type PokemonCryProps = {
  cryAssetId?: string | null;
  autoPlay?: boolean;
  showButton?: boolean;
};

export default function PokemonCry({
  cryAssetId,
  autoPlay = false,
  showButton = true,
}: PokemonCryProps) {
  const source =
    getPokemonCrySource(cryAssetId);

  const player =
    useAudioPlayer(source);

  const {
    soundEnabled,
    soundVolume,
  } = useSoundSettings();

  const effectiveVolume =
    soundEnabled
      ? soundVolume
      : 0;

  // -----------------------------------------
  // GLOBAL VOLUME
  // -----------------------------------------

  useEffect(() => {
    player.volume = effectiveVolume;
  }, [
    player,
    effectiveVolume,
  ]);

  // -----------------------------------------
  // AUTO PLAY
  // -----------------------------------------

  useEffect(() => {
    if (
      !autoPlay ||
      !source ||
      !soundEnabled ||
      soundVolume <= 0
    ) {
      return;
    }

    player.volume = soundVolume;

    player.seekTo(0);
    player.play();
  }, [
    autoPlay,
    source,
    soundEnabled,
    soundVolume,
    player,
  ]);

  // -----------------------------------------
  // MANUAL PLAY
  // -----------------------------------------

  function playCry() {
    if (
      !source ||
      !soundEnabled ||
      soundVolume <= 0
    ) {
      return;
    }

    player.volume = soundVolume;

    player.seekTo(0);
    player.play();
  }

  // No button if disabled
  // or no asset exists.
  if (!source || !showButton) {
    return null;
  }

  return (
    <Pressable
      onPress={playCry}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.icon}>
        🔊
      </Text>

      <Text style={styles.text}>
        CRY
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor: '#B8FF00',

    paddingVertical: 8,
    paddingHorizontal: 16,

    marginTop: 10,
  },

  pressed: {
    opacity: 0.6,
  },

  icon: {
    fontSize: 14,
    marginRight: 6,
  },

  text: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: '#B8FF00',
  },
});