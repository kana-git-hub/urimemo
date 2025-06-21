import React, { useState, useEffect } from 'react';
import {
  View,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Text, TextInput, Button, Snackbar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

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
    
    if (!name.trim()) {
      setNameError('商品名を入力してください');
      hasError = true;
    }
    if (!price.trim()) {
      setPriceError('価格を入力してください');
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
      name: name.trim(),
      price: numericPrice,
      count: 0,
    };

    try {
      const existingData = await AsyncStorage.getItem(STORAGE_KEY);
      const items = existingData ? JSON.parse(existingData) : [];
      const updatedItems = [...items, newItem];

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
      setSnackbarMessage('商品を登録しました！');
      setSnackbarVisible(true);
    } catch (error) {
      setSnackbarMessage('登録に失敗しました');
      setSnackbarVisible(true);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (snackbarVisible) {
      const timer = setTimeout(() => {
        setSnackbarVisible(false);
        if (snackbarMessage === '商品を登録しました！') {
          navigation.goBack();
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [snackbarVisible, snackbarMessage, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            <Text variant="headlineMedium" style={styles.title}>
              商品を登録
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="商品名"
                mode="outlined"
                value={name}
                onChangeText={setName}
                placeholder="商品名を入力"
                style={styles.input}
                error={!!nameError}
                autoFocus
                theme={{
                  colors: {
                    primary: '#667eea',
                    background: 'white',
                  }
                }}
              />
              {nameError ? (
                <Text style={styles.errorText}>{nameError}</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                label="価格（円）"
                mode="outlined"
                value={price}
                onChangeText={setPrice}
                placeholder="価格を入力"
                keyboardType="numeric"
                style={styles.input}
                error={!!priceError}
                theme={{
                  colors: {
                    primary: '#667eea',
                    background: 'white',
                  }
                }}
              />
              {priceError ? (
                <Text style={styles.errorText}>{priceError}</Text>
              ) : null}
            </View>

            <Button
              mode="contained"
              onPress={handleAdd}
              style={styles.button}
              contentStyle={styles.buttonContent}
              disabled={loading}
              loading={loading}
              buttonColor="#667eea"
              labelStyle={styles.buttonLabel}
            >
              登録する
            </Button>
          </View>
        </ScrollView>
      </LinearGradient>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        style={[
          styles.snackbar,
          {
            backgroundColor: snackbarMessage === '商品を登録しました！' 
              ? '#4caf50' 
              : '#f44336'
          }
        ]}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '600',
    color: '#2c3e50',
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: 'white',
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 8,
  },
  button: {
    borderRadius: 16,
    marginTop: 16,
    elevation: 4,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  snackbar: {
    borderRadius: 12,
    margin: 16,
  },
});

export default AddItemScreen;