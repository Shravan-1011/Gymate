import { Tabs } from 'expo-router';
import {
  Text,
  StyleSheet,
  View,
  type ColorValue,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../constants/theme';

/*
 * ========================================
 * PIXEL ICON
 * ========================================
 */

type PixelIconProps = {
  symbol: string;
  color: ColorValue;
};

function PixelIcon({
  symbol,
  color,
}: PixelIconProps) {
  return (
    <Text
      style={[
        styles.pixelIcon,
        { color },
      ]}
    >
      {symbol}
    </Text>
  );
}

/*
 * ========================================
 * POKÉBALL ICON
 * ========================================
 */

function PokeBallIcon({
  color,
}: {
  color: ColorValue;
}) {
  return (
    <View
      style={[
        styles.pokeBall,
        {
          borderColor: color,
        },
      ]}
    >
      {/* TOP HALF */}

      <View
        style={[
          styles.pokeBallTop,
          {
            backgroundColor: color,
          },
        ]}
      />

      {/* CENTER LINE */}

      <View
        style={[
          styles.pokeBallLine,
          {
            backgroundColor: color,
          },
        ]}
      />

      {/* CENTER BUTTON */}

      <View
        style={[
          styles.pokeBallButtonOuter,
          {
            borderColor: color,
          },
        ]}
      >
        <View
          style={[
            styles.pokeBallButtonInner,
            {
              backgroundColor:
                colors.background,
            },
          ]}
        />
      </View>
    </View>
  );
}

/*
 * ========================================
 * TAB LAYOUT
 * ========================================
 */

export default function TabLayout() {
  const insets =
    useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor:
          colors.primary,

        tabBarInactiveTintColor:
          colors.textSecondary,

        /*
         * ====================================
         * TAB BAR
         * ====================================
         *
         * IMPORTANT:
         * Do NOT use position: 'absolute'
         * here.
         *
         * The tab navigator will reserve the
         * tab bar's space automatically, so
         * screen content won't sit underneath
         * the navbar.
         */

        tabBarStyle: {
          backgroundColor:
            colors.background,

          borderTopWidth: 2,

          borderTopColor:
            colors.border,

          height:
            70 + insets.bottom,

          paddingTop: 6,

          paddingBottom:
            Math.max(
              insets.bottom,
              8,
            ),

          elevation: 0,

          shadowOpacity: 0,
        },

        tabBarLabelStyle: {
          fontFamily:
            'PressStart2P',

          fontSize: 7,

          marginTop: 1,
        },

        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      {/* ========================================
          HOME
          ======================================== */}

      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',

          tabBarIcon: ({
            color,
          }) => (
            <PixelIcon
              symbol="✚"
              color={color}
            />
          ),
        }}
      />

      {/* ========================================
          TRAINING
          ======================================== */}

      <Tabs.Screen
        name="train"
        options={{
          title: 'TRAIN',

          tabBarIcon: ({
            color,
          }) => (
            <PixelIcon
              symbol="⚔"
              color={color}
            />
          ),
        }}
      />

      {/* ========================================
          POKÉMON
          ======================================== */}

      <Tabs.Screen
        name="pokemon"
        options={{
          title: 'POKÉMON',

          tabBarIcon: ({
            color,
          }) => (
            <PokeBallIcon
              color={color}
            />
          ),

          /*
           * Keep the Pokémon tab aligned
           * with the other tabs.
           */

          tabBarItemStyle: {
            paddingVertical: 0,
            marginTop: 0,
          },

          /*
           * Give the label enough space
           * below the Pokéball.
           */

          tabBarLabelStyle: {
            fontFamily:
              'PressStart2P',

            fontSize: 6,

            marginTop: 11,
          },
        }}
      />

      {/* ========================================
          DIET
          ======================================== */}

      <Tabs.Screen
        name="diet"
        options={{
          title: 'DIET',

          tabBarIcon: ({
            color,
          }) => (
            <PixelIcon
              symbol="●"
              color={color}
            />
          ),
        }}
      />

      {/* ========================================
          ACTIVITY
          ======================================== */}

      <Tabs.Screen
        name="activity"
        options={{
          title: 'ACTIVITY',

          tabBarIcon: ({
            color,
          }) => (
            <PixelIcon
              symbol="★"
              color={color}
            />
          ),
        }}
      />

      {/* ========================================
          HIDDEN SCREENS
          ======================================== */}

      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

/*
 * ========================================
 * STYLES
 * ========================================
 */

const styles =
  StyleSheet.create({
    /*
     * ======================================
     * NORMAL PIXEL ICON
     * ======================================
     */

    pixelIcon: {
      fontFamily:
        'PressStart2P',

      fontSize: 18,

      lineHeight: 22,

      textAlign: 'center',
    },

    /*
     * ======================================
     * POKÉBALL
     * ======================================
     */

    pokeBall: {
      width: 44,
      height: 44,

      borderWidth: 3,

      borderRadius: 22,

      overflow: 'hidden',

      backgroundColor:
        colors.background,

      position: 'relative',

      justifyContent:
        'center',

      alignItems:
        'center',

      marginBottom: 0,
    },

    /*
     * ======================================
     * POKÉBALL TOP
     * ======================================
     */

    pokeBallTop: {
      position: 'absolute',

      top: 0,
      left: 0,
      right: 0,

      height: 19,

      opacity: 0.9,
    },

    /*
     * ======================================
     * POKÉBALL CENTER LINE
     * ======================================
     */

    pokeBallLine: {
      position: 'absolute',

      left: 0,
      right: 0,

      top: 18,

      height: 5,
    },

    /*
     * ======================================
     * POKÉBALL BUTTON OUTER
     * ======================================
     */

    pokeBallButtonOuter: {
      width: 18,
      height: 18,

      borderWidth: 3,

      borderRadius: 9,

      backgroundColor:
        colors.background,

      justifyContent:
        'center',

      alignItems:
        'center',

      zIndex: 5,
    },

    /*
     * ======================================
     * POKÉBALL BUTTON INNER
     * ======================================
     */

    pokeBallButtonInner: {
      width: 7,
      height: 7,

      borderRadius: 4,
    },
  });