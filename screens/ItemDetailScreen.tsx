import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Snackbar, Text, TextInput, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

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
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    setNameError('');
    setPriceError('');
    
    let hasError = false;
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

    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      const items = storedData ? JSON.parse(storedData) : [];

      const updatedItem = {
        ...item,
        name: name.trim(),
        price: numericPrice,
      };

      items[index] = updatedItem;

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      setSnackbarMessage('商品情報を更新しました');
      setSnackbarVisible(true);
      
      setTimeout(() => {
        setSnackbarVisible(false);
        navigation.goBack();
      }, 1500);
    } catch (error) {
      setSnackbarMessage('更新に失敗しました');
      setSnackbarVisible(true);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            <Text variant="headlineMedium" style={styles.title}>
              商品を編集
            </Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>現在の販売数</Text>
                <Text style={styles.statValue}>{item.count || 0}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>現在の売上</Text>
                <Text style={styles.statValue}>
                  ¥{(item.price * (item.count || 0)).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                label="商品名"
                mode="outlined"
                value={name}
                onChangeText={setName}
                placeholder="商品名を入力"
                style={styles.input}
                error={!!nameError}
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
              onPress={handleSave}
              style={styles.button}
              contentStyle={styles.buttonContent}
              disabled={loading}
              loading={loading}
              buttonColor="#667eea"
              labelStyle={styles.buttonLabel}
            >
              保存する
            </Button>
          </View>
        </ScrollView>
      </LinearGradient>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={1500}
        style={[
          styles.snackbar,
          {
            backgroundColor: snackbarMessage === '商品情報を更新しました' 
              ? '#4caf50' 
              : '#f44336'
          }
        ]}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
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
    marginBottom: 24,
    fontWeight: '600',
    color: '#2c3e50',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#667eea',
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

export default ItemDetailScreen;