

import React, { useState, useEffect } from 'react';
import {
  View,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Text, TextInput, Button, Card, Appbar, Snackbar } from 'react-native-paper';

const STORAGE_KEY = 'items';

const AddItemScreen = () => {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [nameError, setNameError] = useState('');
  const [priceError, setPriceError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (loading) return;
    setLoading(true);

    let hasError = false;
    setNameError('');
    setPriceError('');
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
    if (hasError) {
      setLoading(false);
      return;
    }

    const newItem = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      name,
      price: numericPrice,
      count: 0,
    };

    try {
      const existingData = await AsyncStorage.getItem(STORAGE_KEY);
      const items = existingData ? JSON.parse(existingData) : [];
      const updatedItems = [...items, newItem];

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
      setSnackbarMessage('商品を保存しました！');
      setSnackbarVisible(true);
    } catch (error) {
      setSnackbarMessage('商品データの保存に失敗しました。');
      setSnackbarVisible(true);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 通知の自動非表示処理
  useEffect(() => {
    if (snackbarVisible) {
      const timer = setTimeout(() => {
        setSnackbarVisible(false);
        if (snackbarMessage === '商品を保存しました！') {
          navigation.goBack();
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [snackbarVisible, snackbarMessage, navigation]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f6f6f6', position: 'relative' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1, justifyContent: 'center' }}>
        <Card
          style={{
            padding: 24,
            borderRadius: 24,
            elevation: 8,
            backgroundColor: 'white',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.18,
            shadowRadius: 12,
            borderWidth: 1,
            borderColor: '#e3e8f0',
            marginBottom: 16,
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 8,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              opacity: 0.15,
            }}
          />
          <Text variant="titleLarge" style={{ marginBottom: 20, textAlign: 'center', fontWeight: 'bold', color: '#1976d2' }}>
            商品登録
          </Text>

          <TextInput
            label="商品名"
            mode="outlined"
            value={name}
            onChangeText={setName}
            placeholder="例: 新刊A"
            style={{ marginBottom: 16 }}
            error={!!nameError}
            autoFocus
          />
          {nameError ? <Text style={{ color: 'red', marginBottom: 8 }}>{nameError}</Text> : null}

          <TextInput
            label="価格（円）"
            mode="outlined"
            value={price}
            onChangeText={setPrice}
            placeholder="例: 500"
            keyboardType="numeric"
            style={{ marginBottom: 8 }}
            error={!!priceError}
          />
          {priceError ? <Text style={{ color: 'red', marginBottom: 16 }}>{priceError}</Text> : <View style={{ marginBottom: 16 }} />}

          <Button
            mode="contained"
            icon="plus"
            onPress={handleAdd}
            buttonColor="#1976d2"
            style={{ borderRadius: 8 }}
            disabled={loading}
            loading={loading}
          >
            登録する
          </Button>
        </Card>
      </ScrollView>
      {/* react-native-paperのSnackbarに統一 */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={1500}
        style={{ backgroundColor: snackbarMessage === '商品を保存しました！' ? '#1976d2' : '#e53935' }}
        action={snackbarMessage === '商品を保存しました！' ? undefined : { label: 'OK', onPress: () => setSnackbarVisible(false) }}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

export default AddItemScreen;
