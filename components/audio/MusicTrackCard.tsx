import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { MusicTrack } from '../../data/musicTracks';

type Props = {
  track: MusicTrack;
  selected: boolean;
  onPress: () => void;
};

export default function MusicTrackCard({
  track,
  selected,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.radio}>
        {selected && (
          <View style={styles.radioInner} />
        )}
      </View>

      <View style={styles.info}>
        <Text
          style={[
            styles.name,
            selected && styles.selectedText,
          ]}
        >
          {track.name}
        </Text>

        <Text style={styles.subtitle}>
          {track.subtitle}
        </Text>
      </View>

      {selected && (
        <Text style={styles.playing}>
          ♪
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',

    borderWidth: 1,
    borderColor: '#292929',

    backgroundColor: '#101010',

    padding: 13,
    marginBottom: 8,
  },

  selected: {
    borderColor: '#B8FF00',
    backgroundColor: '#151D00',
  },

  pressed: {
    opacity: 0.6,
  },

  radio: {
    width: 18,
    height: 18,

    borderWidth: 1,
    borderColor: '#666',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 12,
  },

  radioInner: {
    width: 8,
    height: 8,
    backgroundColor: '#B8FF00',
  },

  info: {
    flex: 1,
  },

  name: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: '#FFFFFF',
  },

  selectedText: {
    color: '#B8FF00',
  },

  subtitle: {
    fontFamily: 'PressStart2P',
    fontSize: 6,
    color: '#666',
    marginTop: 7,
  },

  playing: {
    fontSize: 18,
    color: '#B8FF00',
    marginLeft: 8,
  },
});