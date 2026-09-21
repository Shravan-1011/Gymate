import { useEffect } from 'react';
import { useAudioPlayer } from 'expo-audio';

import {
  useSoundSettings,
} from '../../context/SoundContext';

type BackgroundMusicProps = {
  source: number;
};

export default function BackgroundMusic({
  source,
}: BackgroundMusicProps) {
  const player =
    useAudioPlayer(source);

  const {
    musicEnabled,
    musicVolume,
  } = useSoundSettings();

  useEffect(() => {
    player.loop = true;

    player.volume =
      musicEnabled
        ? musicVolume
        : 0;

    if (
      musicEnabled &&
      musicVolume > 0
    ) {
      player.play();
    } else {
      player.pause();
    }
  }, [
    player,
    musicEnabled,
    musicVolume,
  ]);

  return null;
}