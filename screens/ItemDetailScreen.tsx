import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Appbar, Snackbar, Text as PaperText, TextInput as PaperTextInput, Button as PaperButton, Card } from 'react-native-paper';

const STORAGE_KEY = 'items';

type Item = {
  id: string;
  name: string;
  price: number;
  count: number;
};

type RootStackParamList = {
  ItemDetail: { item: Item; index: number };
};

type ItemDetailRouteProp = RouteProp<RootStackParamList, 'ItemDetail'>;

const ItemDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<ItemDetailRouteProp>();
  const { item, index } = route.params;

  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(item.price.toString());
  const [nameError, setNameError] = useState('');
  const [priceError, setPriceError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleSave = async () => {
    setNameError('');
    setPriceError('');
    let hasError = false;
    if (!name) {
      setNameError('商品名は必須です');
      hasError = true;
    }
    if (!price) {
      setPriceError('価格は必須です');
      hasError = true;
    }
    const numericPrice = parseInt(price, 10);
    if (price && isNaN(numericPrice)) {
      setPriceError('価格は数字で入力してください');
      hasError = true;
    }
    if (hasError) return;

    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      const items = storedData ? JSON.parse(storedData) : [];

      // 既存のアイテムを更新（IDと販売数を保持）
      const updatedItem = {
        ...item, // 既存のID、countを保持
        name,
        price: numericPrice,
      };

      items[index] = updatedItem;

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      setSnackbarMessage('商品情報を更新しました。');
      setSnackbarVisible(true);
      setTimeout(() => {
        setSnackbarVisible(false);
        navigation.goBack();
      }, 1200);
    } catch (error) {
      setSnackbarMessage('更新に失敗しました。');
      setSnackbarVisible(true);
      console.error(error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f6f6f6', justifyContent: 'center' }}>
      <Card style={{ margin: 20, padding: 24, borderRadius: 16, elevation: 4, backgroundColor: 'white', shadowColor: '#000' }}>
        <PaperText variant="titleLarge" style={{ marginBottom: 20, textAlign: 'center', fontWeight: 'bold', color: '#1976d2' }}>
          商品詳細
        </PaperText>
        <PaperText style={{ fontSize: 16, marginBottom: 4, marginTop: 12 }}>商品名</PaperText>
        <PaperTextInput
          mode="outlined"
          value={name}
          onChangeText={setName}
          placeholder="例: 新刊A"
          style={{ marginBottom: 8 }}
          error={!!nameError}
        />
        {nameError ? <PaperText style={{ color: 'red', marginBottom: 8 }}>{nameError}</PaperText> : null}

        <PaperText style={{ fontSize: 16, marginBottom: 4, marginTop: 12 }}>価格（円）</PaperText>
        <PaperTextInput
          mode="outlined"
          value={price}
          onChangeText={setPrice}
          placeholder="例: 500"
          keyboardType="numeric"
          style={{ marginBottom: 8 }}
          error={!!priceError}
        />
        {priceError ? <PaperText style={{ color: 'red', marginBottom: 16 }}>{priceError}</PaperText> : <View style={{ marginBottom: 16 }} />}

        <PaperButton mode="contained" icon="content-save" onPress={handleSave} buttonColor="#1976d2" style={{ borderRadius: 8 }}>
          保存する
        </PaperButton>
      </Card>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={1200}
        style={{ backgroundColor: snackbarMessage === '商品情報を更新しました。' ? '#1976d2' : '#e53935' }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

export default ItemDetailScreen;