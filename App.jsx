import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';

import AddItemScreen from './screens/AddItemScreen';
import ItemListScreen from './screens/ItemListScreen';
import ItemDetailScreen from './screens/ItemDetailScreen';
import LoadingScreen from './screens/LoadingScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 初期化処理（例：ストレージの読み込みやAPIの初期化など）
    const initialize = async () => {
      // ここで必要な初期化を行う
      await new Promise((resolve) => setTimeout(resolve, 600));
      setIsReady(true);
    };
    initialize();
  }, []);

  if (!isReady) {
    return <LoadingScreen />;
  }

  // デバッグ用コード（本番では不要）
  // const resetStorage = async () => {
  //   await AsyncStorage.clear();
  //   console.log('AsyncStorage cleared');
  // };
  // resetStorage(); // 必要に応じて実行
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="ItemList">
          <Stack.Screen name="ItemList" component={ItemListScreen} options={{ title: '商品一覧' }} />
          <Stack.Screen name="AddItem" component={AddItemScreen} options={{ title: '商品追加' }} />
          <Stack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ title: '商品詳細' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
