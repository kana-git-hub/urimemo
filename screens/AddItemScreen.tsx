import React, { useState, useEffect } from 'react';
import {
  View,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { 
  Text as PaperText, 
  TextInput, 
  Button as PaperButton, 
  Snackbar,
  IconButton,
  Card,
  Chip,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

const STORAGE_KEY = 'items';

// よく使われる価格のプリセット
const PRICE_PRESETS = [100, 200, 300, 500, 1000, 1500, 2000, 3000];

const AddItemScreen = () => {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [nameError, setNameError] = useState('');
  const [priceError, setPriceError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [formScale] = useState(new Animated.Value(0.95));

  // フォームアニメーション
  useEffect(() => {
    Animated.spring(formScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, []);

  const validateInputs = () => {
    let hasError = false;
    setNameError('');
    setPriceError('');
    
    if (!name.trim()) {
      setNameError('商品名を入力してください');
      hasError = true;
    } else if (name.trim().length > 50) {
      setNameError('商品名は50文字以内で入力してください');
      hasError = true;
    }
    
    if (!price.trim()) {
      setPriceError('価格を入力してください');
      hasError = true;
    } else {
      const numericPrice = parseInt(price, 10);
      if (isNaN(numericPrice)) {
        setPriceError('価格は数字で入力してください');
        hasError = true;
      } else if (numericPrice <= 0) {
        setPriceError('価格は1円以上で入力してください');
        hasError = true;
      } else if (numericPrice > 999999) {
        setPriceError('価格は999,999円以下で入力してください');
        hasError = true;
      }
    }
    
    return !hasError;
  };

  const handleAdd = async () => {
    if (loading) return;
    
    if (!validateInputs()) return;
    
    setLoading(true);

    const newItem = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      name: name.trim(),
      price: parseInt(price, 10),
      count: 0,
    };

    try {
      const existingData = await AsyncStorage.getItem(STORAGE_KEY);
      const items = existingData ? JSON.parse(existingData) : [];
      
      // 同じ名前の商品がないかチェック
      const duplicateItem = items.find(item => 
        item.name.toLowerCase() === newItem.name.toLowerCase()
      );
      
      if (duplicateItem) {
        setNameError('同じ名前の商品が既に存在します');
        setLoading(false);
        return;
      }
      
      const updatedItems = [...items, newItem];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
      
      setSnackbarMessage('商品を登録しました！');
      setSnackbarVisible(true);
      
      // 成功時のアニメーション
      Animated.sequence([
        Animated.spring(formScale, {
          toValue: 1.05,
          useNativeDriver: true,
          tension: 100,
          friction: 6,
        }),
        Animated.spring(formScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
      
    } catch (error) {
      setSnackbarMessage('登録に失敗しました');
      setSnackbarVisible(true);
      console.error('保存エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePricePresetSelect = (presetPrice: number) => {
    setPrice(presetPrice.toString());
    setPriceError('');
  };

  const clearForm = () => {
    setName('');
    setPrice('');
    setNameError('');
    setPriceError('');
  };

  const formatPriceDisplay = (value: string) => {
    const numericValue = parseInt(value, 10);
    if (isNaN(numericValue)) return '';
    return `¥${numericValue.toLocaleString()}`;
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
        colors={['#4f46e5', '#7c3aed', '#2563eb']}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      >
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <IconButton
              icon="arrow-left"
              size={24}
              iconColor="white"
              style={styles.backIcon}
            />
          </TouchableOpacity>
          <PaperText style={styles.headerTitle}>商品を登録</PaperText>
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={clearForm}
          >
            <IconButton
              icon="refresh"
              size={20}
              iconColor="white"
              style={styles.clearIcon}
            />
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.formWrapper, { transform: [{ scale: formScale }] }]}>
            <Card style={styles.formContainer}>
              <Card.Content style={styles.cardContent}>
                
                {/* 商品名入力 */}
                <View style={styles.inputSection}>
                  <View style={styles.inputHeader}>
                    <IconButton
                      icon="tag"
                      size={20}
                      iconColor="#667eea"
                      style={styles.inputIcon}
                    />
                    <PaperText style={styles.inputLabel}>商品名</PaperText>
                  </View>
                  <TextInput
                    mode="outlined"
                    value={name}
                    onChangeText={setName}
                    placeholder="例: 新刊、既刊..."
                    style={styles.input}
                    error={!!nameError}
                    maxLength={50}
                    autoFocus
                    theme={{
                      colors: {
                        primary: '#667eea',
                        background: 'white',
                        outline: nameError ? '#f44336' : '#e2e8f0',
                      }
                    }}
                    right={
                      name.length > 0 ? (
                        <TextInput.Affix 
                          text={`${name.length}/50`} 
                          textStyle={styles.characterCount}
                        />
                      ) : null
                    }
                  />
                  {nameError ? (
                    <View style={styles.errorContainer}>
                      <IconButton
                        icon="alert-circle"
                        size={16}
                        iconColor="#f44336"
                        style={styles.errorIcon}
                      />
                      <PaperText style={styles.errorText}>{nameError}</PaperText>
                    </View>
                  ) : null}
                </View>

                {/* 価格入力 */}
                <View style={styles.inputSection}>
                  <View style={styles.inputHeader}>
                    <IconButton
                      icon="currency-jpy"
                      size={20}
                      iconColor="#667eea"
                      style={styles.inputIcon}
                    />
                    <PaperText style={styles.inputLabel}>価格</PaperText>
                    {price && !priceError && (
                      <PaperText style={styles.pricePreview}>
                        {formatPriceDisplay(price)}
                      </PaperText>
                    )}
                  </View>
                  <TextInput
                    mode="outlined"
                    value={price}
                    onChangeText={setPrice}
                    placeholder="価格を入力（円）"
                    keyboardType="numeric"
                    style={styles.input}
                    error={!!priceError}
                    theme={{
                      colors: {
                        primary: '#667eea',
                        background: 'white',
                        outline: priceError ? '#f44336' : '#e2e8f0',
                      }
                    }}
                  />
                  {priceError ? (
                    <View style={styles.errorContainer}>
                      <IconButton
                        icon="alert-circle"
                        size={16}
                        iconColor="#f44336"
                        style={styles.errorIcon}
                      />
                      <PaperText style={styles.errorText}>{priceError}</PaperText>
                    </View>
                  ) : null}
                  
                  {/* 価格プリセット */}
                  <View style={styles.presetsContainer}>
                    <PaperText style={styles.presetsLabel}>よく使われる価格</PaperText>
                    <View style={styles.presetsGrid}>
                      {PRICE_PRESETS.map((presetPrice) => (
                        <TouchableOpacity
                          key={presetPrice}
                          onPress={() => handlePricePresetSelect(presetPrice)}
                        >
                          <Chip
                            style={[
                              styles.priceChip,
                              price === presetPrice.toString() && styles.selectedPriceChip
                            ]}
                            textStyle={[
                              styles.priceChipText,
                              price === presetPrice.toString() && styles.selectedPriceChipText
                            ]}
                            compact
                          >
                            ¥{presetPrice.toLocaleString()}
                          </Chip>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                {/* プレビューカード */}
                {name.trim() && price && !nameError && !priceError && (
                  <View style={styles.previewSection}>
                    <PaperText style={styles.previewLabel}>プレビュー</PaperText>
                    <Card style={styles.previewCard}>
                      <Card.Content style={styles.previewContent}>
                        <View style={styles.previewHeader}>
                          <View style={styles.previewInfo}>
                            <PaperText style={styles.previewName} numberOfLines={1}>
                              {name.trim()}
                            </PaperText>
                            <PaperText style={styles.previewPrice}>
                              {formatPriceDisplay(price)}
                            </PaperText>
                          </View>
                          <View style={styles.previewBadge}>
                            <PaperText style={styles.previewBadgeText}>NEW</PaperText>
                          </View>
                        </View>
                      </Card.Content>
                    </Card>
                  </View>
                )}

                {/* 登録ボタン */}
                <View style={styles.buttonContainer}>
                  <PaperButton
                    mode="contained"
                    onPress={handleAdd}
                    style={[
                      styles.submitButton,
                      (!name.trim() || !price || !!nameError || !!priceError) && styles.submitButtonDisabled
                    ]}
                    contentStyle={styles.submitButtonContent}
                    disabled={loading || !name.trim() || !price || !!nameError || !!priceError}
                    loading={loading}
                    buttonColor="#667eea"
                    labelStyle={styles.submitButtonLabel}
                    icon="plus-circle"
                  >
                    {loading ? '登録中...' : '商品を登録する'}
                  </PaperButton>
                  
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                  >
                    <PaperText style={styles.cancelButtonText}>キャンセル</PaperText>
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>
          </Animated.View>
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
        <View style={styles.snackbarContent}>
          <IconButton
            icon={snackbarMessage === '商品を登録しました！' ? 'check-circle' : 'alert-circle'}
            size={20}
            iconColor="white"
            style={styles.snackbarIcon}
          />
          <PaperText style={styles.snackbarText}>{snackbarMessage}</PaperText>
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backIcon: {
    margin: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    flex: 1,
  },
  clearButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  clearIcon: {
    margin: 0,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  formWrapper: {
    flex: 1,
  },
  formContainer: {
    borderRadius: 24,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    backgroundColor: 'white',
  },
  cardContent: {
    padding: 28,
  },
  inputSection: {
    marginBottom: 28,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputIcon: {
    margin: 0,
    marginRight: 8,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  pricePreview: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4caf50',
  },
  input: {
    backgroundColor: 'white',
    fontSize: 16,
  },
  characterCount: {
    fontSize: 12,
    color: '#94a3b8',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  errorIcon: {
    margin: 0,
    marginRight: 4,
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    flex: 1,
  },
  presetsContainer: {
    marginTop: 16,
  },
  presetsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 12,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priceChip: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderColor: 'rgba(102, 126, 234, 0.3)',
    borderWidth: 1,
  },
  selectedPriceChip: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  priceChipText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
  },
  selectedPriceChipText: {
    color: 'white',
  },
  previewSection: {
    marginBottom: 28,
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
    borderStyle: 'dashed',
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  previewContent: {
    padding: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  previewPrice: {
    fontSize: 14,
    color: '#4caf50',
    fontWeight: '500',
  },
  previewBadge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  previewBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  buttonContainer: {
    gap: 16,
  },
  submitButton: {
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  submitButtonDisabled: {
    elevation: 2,
    shadowOpacity: 0.1,
  },
  submitButtonContent: {
    paddingVertical: 12,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  snackbar: {
    borderRadius: 12,
    margin: 20,
    elevation: 8,
  },
  snackbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  snackbarIcon: {
    margin: 0,
    marginRight: 8,
  },
  snackbarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
});

export default AddItemScreen;