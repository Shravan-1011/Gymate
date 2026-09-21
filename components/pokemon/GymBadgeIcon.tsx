import React from 'react';

import {
  Image,
  StyleSheet,
  View,
} from 'react-native';

import {
  getGymBadgeSource,
} from '../../assets/badges/registry';

import type {
  GymBadgeDisplayState,
} from '../../types/pokemonGymBadge';

type GymBadgeIconProps = {
  normalAssetId: string;
  goldAssetId: string;
  state: GymBadgeDisplayState;
  size?: number;
};

export default function GymBadgeIcon({
  normalAssetId,
  goldAssetId,
  state,
  size = 64,
}: GymBadgeIconProps) {

  /*
   * ======================================
   * LOCKED
   * ======================================
   */

  if (state === 'locked') {
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
        <View
          style={[
            styles.locked,
            {
              width: size,
              height: size,
            },
          ]}
        >
          <View style={styles.lockBody} />

          <View style={styles.lockShackle} />
        </View>
      </View>
    );
  }

  /*
   * ======================================
   * GOLD
   * ======================================
   */

  const assetId =
    state === 'gold'
      ? goldAssetId
      : normalAssetId;

  const source =
    getGymBadgeSource(assetId);

  /*
   * Missing asset safety.
   */

  if (!source) {
    return (
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
          },
        ]}
      />
    );
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
        style={{
          width: size,
          height: size,
        }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  /*
   * ======================================
   * LOCKED BADGE
   * ======================================
   */

  locked: {
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: '#454545',
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
  },

  lockBody: {
    width: 18,
    height: 14,
    borderWidth: 2,
    borderColor: '#555',
    backgroundColor: '#222',
    position: 'absolute',
    bottom: 15,
  },

  lockShackle: {
    width: 12,
    height: 12,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: '#555',
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    position: 'absolute',
    bottom: 25,
  },

});