import React, {
  useEffect,
  useMemo,
  useRef,
} from 'react';

import {
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';

import type { PokeballType } from '../../types/pokemon';

type PokeballOpeningAnimationProps = {
  onComplete: () => void;
  ballType: PokeballType;
  size?: number;
};

type BallAnimationAssets = {
  ball: number;
  open: number;
  effects: number[];
};


/*
 * ============================================================
 * POKEBALL ANIMATION ASSETS
 * ============================================================
 *
 * Every ball has its own folder.
 */

const BALL_ANIMATIONS: Record<
  PokeballType,
  BallAnimationAssets
> = {

  jester_ball: {
  ball: require(
    '../../assets/pokemon/animations/jester_ball/ball_JESTERBALL.png'
  ),

  open: require(
    '../../assets/pokemon/animations/jester_ball/ball_JESTERBALL_open.png'
  ),

  effects: [
    require(
      '../../assets/pokemon/animations/jester_ball/1.png'
    ),
    require(
      '../../assets/pokemon/animations/jester_ball/2.png'
    ),
    require(
      '../../assets/pokemon/animations/jester_ball/3.png'
    ),
    require(
      '../../assets/pokemon/animations/jester_ball/4.png'
    ),
    require(
      '../../assets/pokemon/animations/jester_ball/5.png'
    ),
  ],
},
  /*
   * ----------------------------------------------------------
   * POKÉ BALL
   * ----------------------------------------------------------
   */

  poke_ball: {
    ball: require(
      '../../assets/pokemon/animations/pokeball/ball_POKEBALL.png'
    ),

    open: require(
      '../../assets/pokemon/animations/pokeball/ball_POKEBALL_open.png'
    ),

    effects: [
      require(
        '../../assets/pokemon/animations/pokeball/1.png'
      ),
      require(
        '../../assets/pokemon/animations/pokeball/2.png'
      ),
      require(
        '../../assets/pokemon/animations/pokeball/3.png'
      ),
      require(
        '../../assets/pokemon/animations/pokeball/4.png'
      ),
      require(
        '../../assets/pokemon/animations/pokeball/5.png'
      ),
    ],
  },


  /*
   * ----------------------------------------------------------
   * GREAT BALL
   * ----------------------------------------------------------
   */

  great_ball: {
    ball: require(
      '../../assets/pokemon/animations/great_ball/ball_GREATBALL.png'
    ),

    open: require(
      '../../assets/pokemon/animations/great_ball/ball_GREATBALL_open.png'
    ),

    effects: [
      require(
        '../../assets/pokemon/animations/great_ball/1.png'
      ),
      require(
        '../../assets/pokemon/animations/great_ball/2.png'
      ),
      require(
        '../../assets/pokemon/animations/great_ball/3.png'
      ),
      require(
        '../../assets/pokemon/animations/great_ball/4.png'
      ),
      require(
        '../../assets/pokemon/animations/great_ball/5.png'
      ),
    ],
  },


  /*
   * ----------------------------------------------------------
   * ULTRA BALL
   * ----------------------------------------------------------
   */

  ultra_ball: {
    ball: require(
      '../../assets/pokemon/animations/ultra_ball/ball_ULTRABALL.png'
    ),

    open: require(
      '../../assets/pokemon/animations/ultra_ball/ball_ULTRABALL_open.png'
    ),

    effects: [
      require(
        '../../assets/pokemon/animations/ultra_ball/1.png'
      ),
      require(
        '../../assets/pokemon/animations/ultra_ball/2.png'
      ),
      require(
        '../../assets/pokemon/animations/ultra_ball/3.png'
      ),
      require(
        '../../assets/pokemon/animations/ultra_ball/4.png'
      ),
      require(
        '../../assets/pokemon/animations/ultra_ball/5.png'
      ),
    ],
  },


  /*
   * ----------------------------------------------------------
   * MASTER BALL
   * ----------------------------------------------------------
   */

  master_ball: {
    ball: require(
      '../../assets/pokemon/animations/master_ball/ball_MASTERBALL.png'
    ),

    open: require(
      '../../assets/pokemon/animations/master_ball/ball_MASTERBALL_open.png'
    ),

    effects: [
      require(
        '../../assets/pokemon/animations/master_ball/1.png'
      ),
      require(
        '../../assets/pokemon/animations/master_ball/2.png'
      ),
      require(
        '../../assets/pokemon/animations/master_ball/3.png'
      ),
      require(
        '../../assets/pokemon/animations/master_ball/4.png'
      ),
      require(
        '../../assets/pokemon/animations/master_ball/5.png'
      ),
    ],
  },
};


/*
 * ============================================================
 * SPRITE SHEET CONFIG
 * ============================================================
 *
 * Same dimensions as the original Poké Ball animation.
 */

const BALL_FRAME_COUNT = 8;

const BALL_SOURCE_FRAME_WIDTH = 32;

const BALL_SOURCE_FRAME_HEIGHT = 64;

const BALL_SCALE = 4;

const BALL_FRAME_WIDTH =
  BALL_SOURCE_FRAME_WIDTH * BALL_SCALE;

const BALL_FRAME_HEIGHT =
  BALL_SOURCE_FRAME_HEIGHT * BALL_SCALE;

const BALL_SHEET_WIDTH =
  BALL_FRAME_WIDTH * BALL_FRAME_COUNT;

const BALL_Y_OFFSET = -48;

const OPEN_BALL_WIDTH = 32 * 4;

const OPEN_BALL_HEIGHT = 64 * 4;

const EFFECT_SIZE = 192;


/*
 * ============================================================
 * TIMING
 * ============================================================
 *
 * These are your faster timings.
 */

const OPENING_FRAME_MS = 80;

const OPEN_HOLD_MS = 300;

const EFFECT_FRAME_MS = 120;

const FINAL_HOLD_MS = 200;

const CROSSFADE_MS = 80;


/*
 * ============================================================
 * BUILD SPRITE SHEET FRAME RANGES
 * ============================================================
 */

function buildStepRanges(
  frameCount: number,
  frameWidth: number
) {
  const inputRange: number[] = [];

  const outputRange: number[] = [];

  for (
    let i = 0;
    i < frameCount;
    i += 1
  ) {
    inputRange.push(i);

    outputRange.push(
      -i * frameWidth
    );

    if (
      i <
      frameCount - 1
    ) {
      inputRange.push(
        i + 0.999
      );

      outputRange.push(
        -i * frameWidth
      );
    }
  }

  inputRange.push(
    frameCount
  );

  outputRange.push(
    -(frameCount - 1) *
      frameWidth
  );

  return {
    inputRange,
    outputRange,
  };
}


/*
 * ============================================================
 * COMPONENT
 * ============================================================
 */

export default function PokeballOpeningAnimation({
  onComplete,
  ballType,
  size = 192,
}: PokeballOpeningAnimationProps) {

  /*
   * Get the correct assets for
   * the selected ball.
   */

  const animation =
    BALL_ANIMATIONS[ballType];

  const BALL_SHEET =
    animation.ball;

  const BALL_OPEN =
    animation.open;

  const EFFECTS =
    animation.effects;


  /*
   * ----------------------------------------------------------
   * ANIMATION VALUES
   * ----------------------------------------------------------
   */

  const rotation =
    useRef(
      new Animated.Value(0)
    ).current;

  const ballScale =
    useRef(
      new Animated.Value(1)
    ).current;

  const sheetFrame =
    useRef(
      new Animated.Value(0)
    ).current;

  const sheetOpacity =
    useRef(
      new Animated.Value(1)
    ).current;

  const openOpacity =
    useRef(
      new Animated.Value(0)
    ).current;

  const effectIn =
    useRef(
      new Animated.Value(0)
    ).current;

  const effectFrame =
    useRef(
      new Animated.Value(0)
    ).current;


  /*
   * Keep latest callback.
   */

  const onCompleteRef =
    useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current =
      onComplete;
  }, [onComplete]);


  /*
   * ----------------------------------------------------------
   * MAIN ANIMATION TIMELINE
   * ----------------------------------------------------------
   */

  useEffect(() => {

    const wiggle = (
      toValue: number,
      duration: number
    ) =>
      Animated.timing(
        rotation,
        {
          toValue,

          duration,

          easing:
            Easing.inOut(
              Easing.sin
            ),

          useNativeDriver: true,
        }
      );


    const timeline =
      Animated.sequence([

        /*
         * ================================================
         * 1. WIGGLE
         * ================================================
         */

        wiggle(
          -0.6,
          150
        ),

        wiggle(
          0.8,
          200
        ),

        wiggle(
          -0.8,
          200
        ),

        wiggle(
          0.85,
          200
        ),

        wiggle(
          -1,
          190
        ),

        wiggle(
          1,
          190
        ),

        wiggle(
          0,
          160
        ),


        /*
         * ================================================
         * 2. BALL OPENING SPRITE SHEET
         * ================================================
         */

        Animated.parallel([

          Animated.timing(
            sheetFrame,
            {
              toValue:
                BALL_FRAME_COUNT,

              duration:
                BALL_FRAME_COUNT *
                OPENING_FRAME_MS,

              easing:
                Easing.linear,

              useNativeDriver: true,
            }
          ),

          Animated.sequence([

            Animated.timing(
              ballScale,
              {
                toValue: 1.07,

                duration:
                  BALL_FRAME_COUNT *
                  OPENING_FRAME_MS *
                  0.7,

                easing:
                  Easing.out(
                    Easing.quad
                  ),

                useNativeDriver: true,
              }
            ),

            Animated.timing(
              ballScale,
              {
                toValue: 1,

                duration:
                  BALL_FRAME_COUNT *
                  OPENING_FRAME_MS *
                  0.3,

                easing:
                  Easing.inOut(
                    Easing.quad
                  ),

                useNativeDriver: true,
              }
            ),
          ]),
        ]),


        /*
         * ================================================
         * 3. CROSSFADE TO OPEN BALL
         * ================================================
         */

        Animated.parallel([

          Animated.timing(
            sheetOpacity,
            {
              toValue: 0,

              duration:
                CROSSFADE_MS,

              useNativeDriver: true,
            }
          ),

          Animated.timing(
            openOpacity,
            {
              toValue: 1,

              duration:
                CROSSFADE_MS,

              useNativeDriver: true,
            }
          ),
        ]),


        /*
         * ================================================
         * 4. HOLD OPEN BALL
         * ================================================
         */

        Animated.delay(
          OPEN_HOLD_MS
        ),


        /*
         * ================================================
         * 5. OPEN BALL → ENERGY EFFECT
         * ================================================
         */

        Animated.parallel([

          Animated.timing(
            openOpacity,
            {
              toValue: 0,

              duration: 140,

              useNativeDriver: true,
            }
          ),

          Animated.timing(
            effectIn,
            {
              toValue: 1,

              duration: 180,

              easing:
                Easing.out(
                  Easing.cubic
                ),

              useNativeDriver: true,
            }
          ),
        ]),


        /*
         * ================================================
         * 6. EFFECT FRAMES
         * ================================================
         */

        Animated.timing(
          effectFrame,
          {
            toValue:
              EFFECTS.length - 1,

            duration:
              (EFFECTS.length - 1) *
              EFFECT_FRAME_MS,

            easing:
              Easing.linear,

            useNativeDriver: true,
          }
        ),


        /*
         * ================================================
         * 7. FINAL HOLD
         * ================================================
         */

        Animated.delay(
          FINAL_HOLD_MS
        ),
      ]);


    /*
     * Start timeline.
     */

    timeline.start(
      ({ finished }) => {

        if (finished) {
          onCompleteRef.current();
        }

      }
    );


    /*
     * Stop animation when
     * component unmounts.
     */

    return () => {
      timeline.stop();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  /*
   * ----------------------------------------------------------
   * BALL ROTATION
   * ----------------------------------------------------------
   */

  const rotate =
    rotation.interpolate({
      inputRange: [
        -1,
        1,
      ],

      outputRange: [
        '-10deg',
        '10deg',
      ],
    });


  /*
   * ----------------------------------------------------------
   * SPRITE SHEET TRANSLATION
   * ----------------------------------------------------------
   */

  const sheetTranslateX =
    useMemo(() => {

      const {
        inputRange,
        outputRange,
      } =
        buildStepRanges(
          BALL_FRAME_COUNT,
          BALL_FRAME_WIDTH
        );

      return sheetFrame.interpolate({
        inputRange,

        outputRange,

        extrapolate:
          'clamp',
      });

    }, [sheetFrame]);


  /*
   * ----------------------------------------------------------
   * EFFECT FRAME OPACITIES
   * ----------------------------------------------------------
   */

  const effectOpacities =
    useMemo(
      () =>
        EFFECTS.map(
          (_, i) => {

            const last =
              i ===
              EFFECTS.length - 1;

            const inputRange = [
              i - 0.2,
              i,
            ];

            const outputRange = [
              0,
              1,
            ];


            if (!last) {

              inputRange.push(
                i + 0.8,
                i + 1
              );

              outputRange.push(
                1,
                0
              );

            }


            return effectFrame.interpolate({
              inputRange,

              outputRange,

              extrapolate:
                'clamp',
            });

          }
        ),

      [effectFrame, EFFECTS]
    );


  /*
   * ----------------------------------------------------------
   * EFFECT SCALE
   * ----------------------------------------------------------
   */

  const effectScale =
    effectIn.interpolate({
      inputRange: [
        0,
        1,
      ],

      outputRange: [
        0.8,
        1,
      ],
    });


  /*
   * ----------------------------------------------------------
   * BALL POSITION
   * ----------------------------------------------------------
   */

  const ballLeft =
    (size -
      BALL_FRAME_WIDTH) /
    2;

  const ballTop =
    (size -
      BALL_FRAME_HEIGHT) /
      2 +
    BALL_Y_OFFSET;


  /*
   * ----------------------------------------------------------
   * OPEN BALL POSITION
   * ----------------------------------------------------------
   */

  const openLeft =
    (size -
      OPEN_BALL_WIDTH) /
    2;

  const openTop =
    (size -
      OPEN_BALL_HEIGHT) /
    2;


  /*
   * ----------------------------------------------------------
   * EFFECT POSITION
   * ----------------------------------------------------------
   */

  const effectLeft =
    (size -
      EFFECT_SIZE) /
    2;

  const effectTop =
    (size -
      EFFECT_SIZE) /
    2;


  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <View
      pointerEvents="none"

      style={[
        styles.stage,

        {
          width: size,
          height: size,
        },
      ]}
    >

      {/* ================================================== */}
      {/* BALL SPRITE SHEET */}
      {/* ================================================== */}

      <Animated.View
        style={[
          styles.ballViewport,

          {
            width:
              BALL_FRAME_WIDTH,

            height:
              BALL_FRAME_HEIGHT,

            left:
              ballLeft,

            top:
              ballTop,

            opacity:
              sheetOpacity,

            transform: [
              {
                rotate,
              },

              {
                scale:
                  ballScale,
              },
            ],
          },
        ]}
      >

        <Animated.Image
          source={
            BALL_SHEET
          }

          resizeMode="stretch"

          fadeDuration={0}

          style={{
            width:
              BALL_SHEET_WIDTH,

            height:
              BALL_FRAME_HEIGHT,

            transform: [
              {
                translateX:
                  sheetTranslateX,
              },
            ],
          }}
        />

      </Animated.View>


      {/* ================================================== */}
      {/* OPEN BALL */}
      {/* ================================================== */}

      <Animated.View
        style={[
          styles.openBallViewport,

          {
            width:
              OPEN_BALL_WIDTH,

            height:
              OPEN_BALL_HEIGHT,

            left:
              openLeft,

            top:
              openTop,

            opacity:
              openOpacity,
          },
        ]}
      >

        <Animated.Image
          source={
            BALL_OPEN
          }

          resizeMode="stretch"

          fadeDuration={0}

          style={{
            width:
              OPEN_BALL_WIDTH,

            height:
              OPEN_BALL_HEIGHT,
          }}
        />

      </Animated.View>


      {/* ================================================== */}
      {/* ENERGY / SPARKLE EFFECT */}
      {/* ================================================== */}

      <Animated.View
        style={[
          styles.effectContainer,

          {
            opacity:
              effectIn,

            transform: [
              {
                scale:
                  effectScale,
              },
            ],
          },
        ]}
      >

        {EFFECTS.map(
          (
            source,
            i
          ) => (

            <Animated.Image
              key={i}

              source={source}

              resizeMode="contain"

              fadeDuration={0}

              style={{
                position:
                  'absolute',

                left:
                  effectLeft,

                top:
                  effectTop,

                width:
                  EFFECT_SIZE,

                height:
                  EFFECT_SIZE,

                opacity:
                  effectOpacities[
                    i
                  ],
              }}
            />

          )
        )}

      </Animated.View>

    </View>
  );
}


/*
 * ============================================================
 * STYLES
 * ============================================================
 */

const styles =
  StyleSheet.create({

    stage: {
      alignItems:
        'center',

      justifyContent:
        'center',

      overflow:
        'visible',
    },


    ballViewport: {
      position:
        'absolute',

      overflow:
        'hidden',
    },


    openBallViewport: {
      position:
        'absolute',

      overflow:
        'hidden',
    },


    effectContainer: {
      position:
        'absolute',

      left: 0,

      top: 0,

      width:
        '100%',

      height:
        '100%',
    },

  });