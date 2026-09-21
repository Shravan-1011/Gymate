import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { getPokemonIconSource } from '../../assets/pokemon/registry';

type AnimatedPokemonIconProps = {
  iconAssetId: string;
  size?: number;
  frameDuration?: number;
};

export default function AnimatedPokemonIcon({
  iconAssetId,
  size = 64,
  frameDuration = 250,
}: AnimatedPokemonIconProps) {
  const [frame, setFrame] = useState(0);

  const source = getPokemonIconSource(iconAssetId);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((currentFrame) => (currentFrame === 0 ? 1 : 0));
    }, frameDuration);

    return () => clearInterval(interval);
  }, [frameDuration]);

  if (!source) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
      ]}
    >
      <Image
        source={source}
        resizeMode="stretch"
        style={{
          width: size * 2,
          height: size,
          transform: [
            {
              translateX: frame === 0 ? 0 : -size,
            },
          ],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});