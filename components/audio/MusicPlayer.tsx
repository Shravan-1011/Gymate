import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useMusic } from '../../context/MusicContext';

export default function MusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    togglePlayback,
    nextTrack,
    previousTrack,
  } = useMusic();

  if (!currentTrack) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          NO MUSIC PLAYING
        </Text>

        <Text style={styles.emptySubtext}>
          Select a track below
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        NOW PLAYING
      </Text>

      <View style={styles.trackBox}>
        <View style={styles.trackInfo}>
          <Text style={styles.trackName}>
            {currentTrack.name}
          </Text>

          <Text style={styles.subtitle}>
            {currentTrack.subtitle}
          </Text>
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable
          onPress={previousTrack}
          style={styles.controlButton}
        >
          <Text style={styles.controlText}>
            ◀
          </Text>
        </Pressable>

        <Pressable
          onPress={togglePlayback}
          style={styles.playButton}
        >
          <Text style={styles.playText}>
            {isPlaying ? 'Ⅱ' : '▶'}
          </Text>
        </Pressable>

        <Pressable
          onPress={nextTrack}
          style={styles.controlButton}
        >
          <Text style={styles.controlText}>
            ▶
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#111',
    padding: 14,
    marginBottom: 16,
  },

  label: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: '#B8FF00',
    marginBottom: 12,
  },

  trackBox: {
    borderWidth: 1,
    borderColor: '#444',
    padding: 14,
  },

  trackInfo: {
    minHeight: 48,
    justifyContent: 'center',
  },

  trackName: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: '#FFFFFF',
  },

  subtitle: {
    fontFamily: 'PressStart2P',
    fontSize: 6,
    color: '#777',
    marginTop: 8,
  },

  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },

  controlButton: {
    width: 42,
    height: 38,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },

  controlText: {
    color: '#B8FF00',
    fontSize: 14,
  },

  playButton: {
    width: 52,
    height: 46,
    borderWidth: 1,
    borderColor: '#B8FF00',
    backgroundColor: '#1A2600',
    alignItems: 'center',
    justifyContent: 'center',
  },

  playText: {
    color: '#B8FF00',
    fontSize: 18,
  },

  empty: {
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#111',
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },

  emptyText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: '#777',
  },

  emptySubtext: {
    fontFamily: 'PressStart2P',
    fontSize: 6,
    color: '#555',
    marginTop: 10,
  },
});