import { useSettings } from "@/lib/settings-context";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const NUM_PARTICLES = 15;

export function AnimatedBackground() {
  const { accentColor } = useSettings();

  const backgroundParticles = useRef(
    Array.from({ length: NUM_PARTICLES }, (_, i) => ({
      translateX: new Animated.Value(Math.random() * SCREEN_WIDTH),
      translateY: new Animated.Value(Math.random() * SCREEN_HEIGHT),
      scale: new Animated.Value(0.3 + Math.random() * 0.7),
      opacity: new Animated.Value(0.1 + Math.random() * 0.2),
      size: 20 + Math.random() * 60,
      color: i % 3 === 0 ? "primary" : i % 3 === 1 ? "secondary" : "tertiary",
    }))
  ).current;

  useEffect(() => {
    const animateParticle = (particle: typeof backgroundParticles[0], index: number) => {
      const duration = 8000 + Math.random() * 12000;
      const toX = Math.random() * SCREEN_WIDTH;
      const toY = Math.random() * SCREEN_HEIGHT;

      Animated.parallel([
        Animated.timing(particle.translateX, {
          toValue: toX,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(particle.translateY, {
          toValue: toY,
          duration,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(particle.opacity, {
            toValue: 0.05 + Math.random() * 0.15,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: 0.1 + Math.random() * 0.2,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(particle.scale, {
            toValue: 0.5 + Math.random() * 0.5,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 0.3 + Math.random() * 0.7,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => animateParticle(particle, index));
    };

    backgroundParticles.forEach((particle, index) => {
      setTimeout(() => animateParticle(particle, index), index * 500);
    });
  }, [backgroundParticles]);

  return (
    <View style={styles.container} pointerEvents="none">
      {backgroundParticles.map((particle, index) => {
        const particleColor =
          particle.color === "primary"
            ? accentColor
            : particle.color === "secondary"
            ? accentColor + "60"
            : accentColor + "30";

        return (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                width: particle.size,
                height: particle.size,
                borderRadius: particle.size / 2,
                backgroundColor: particleColor,
                transform: [
                  { translateX: particle.translateX },
                  { translateY: particle.translateY },
                  { scale: particle.scale },
                ],
                opacity: particle.opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    zIndex: -1,
  },
  particle: {
    position: "absolute",
  },
});
