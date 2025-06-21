import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

const LoadingScreen = () => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color="#1976d2" />
    <Text style={styles.text}>読み込み中...</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f6f6',
    paddingHorizontal: 24,
  },
  text: {
    marginTop: 24,
    fontSize: 20,
    color: '#1976d2',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default LoadingScreen; 