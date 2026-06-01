import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';

const LoadingScreen = () => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color="#667EEA" />
    <Text style={styles.text}>読み込み中...</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F6FB',
  },
  text: {
    marginTop: 16,
    fontSize: 16.5,
    color: '#79839A',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default LoadingScreen;
