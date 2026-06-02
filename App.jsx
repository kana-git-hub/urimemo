import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MainScreen from './screens/MainScreen';
import AddItemScreen from './screens/AddItemScreen';
import ItemDetailScreen from './screens/ItemDetailScreen';
import LoadingScreen from './screens/LoadingScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const appOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 初期化処理（例：ストレージの読み込みやAPIの初期化など）
    const initialize = async () => {
      // ここで必要な初期化を行う
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsReady(true);
    };
    initialize();
  }, []);

  useEffect(() => {
    if (!isReady) return;
    Animated.timing(appOpacity, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start(() => {
      setShowLoading(false);
    });
  }, [appOpacity, isReady]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.root}>
        {showLoading && (
          <View style={styles.loadingLayer}>
            <LoadingScreen />
          </View>
        )}

        {isReady && (
          <Animated.View style={[styles.appLayer, { opacity: appOpacity }]}>
            <NavigationContainer>
              <Stack.Navigator initialRouteName="ItemList" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="ItemList" component={MainScreen} />
                <Stack.Screen name="AddItem" component={AddItemScreen} />
                <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </Animated.View>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  appLayer: {
    flex: 1,
  },
});
