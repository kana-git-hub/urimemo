import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Animated, Easing, Image } from 'react-native';

const A = {
  bg: '#F4F6FB',
  ink: '#1B2333',
  muted: '#79839A',
  accent: '#667EEA',
};

const LoadingScreen = () => {
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();
  }, [fade, rise]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ alignItems: 'center', opacity: fade, transform: [{ translateY: rise }] }}>
        {/* ロゴバッジ */}
        <View style={styles.logo}>
          <Image source={require('../assets/splash-icon.png')} style={styles.logoImage} />
        </View>
        <Text style={styles.title}>ウリメモ</Text>
        <Text style={styles.tagline}>同人即売会の売上を、さっと記録</Text>
      </Animated.View>

      <View style={styles.footer}>
        <ActivityIndicator size="small" color={A.accent} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: A.bg,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: A.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: A.ink,
    letterSpacing: 1,
  },
  tagline: {
    marginTop: 8,
    fontSize: 14.5,
    color: A.muted,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  footer: {
    position: 'absolute',
    bottom: 64,
    alignItems: 'center',
  },
});

export default LoadingScreen;
