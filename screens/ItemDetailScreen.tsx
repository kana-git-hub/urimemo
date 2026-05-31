import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
  Keyboard,
  TouchableOpacity,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { 
  Snackbar, 
  Text as PaperText, 
  TextInput, 
  Button as PaperButton,
  IconButton,
  Card,
  Chip,
  Dialog,
  Portal,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

const STORAGE_KEY = 'items';
const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

// 価格プリセット
const PRICE_PRESETS = [100, 200, 300, 500, 1000, 1500, 2000, 3000];

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
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [formScale] = useState(new Animated.Value(0.95));
  const [hasChanges, setHasChanges] = useState(false);

  // フォームアニメーション
  useEffect(() => {
    Animated.spring(formScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, []);

  // 変更検知
  useEffect(() => {
    const nameChanged = name.trim() !== item.name;
    const priceChanged = parseInt(price, 10) !== item.price;
    setHasChanges(nameChanged || priceChanged);
  }, [name, price, item]);

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

  const showSuccessMessage = (message: string) => {
    setSnackbarMessage(message);
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

    setTimeout(() => {
      setSnackbarVisible(false);
      navigation.goBack();
    }, 1500);
  };

  const showErrorMessage = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleSave = async () => {
    if (Platform.OS === 'ios') {
      Keyboard.dismiss();
    }
    
    if (!validateInputs()) return;
    if (!hasChanges) {
      showErrorMessage('変更がありません');
      return;
    }
    
    setLoading(true);

    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      const items = storedData ? JSON.parse(storedData) : [];

      // 同じ名前の商品がないかチェック（自分以外）
      const duplicateItem = items.find((existingItem: Item, idx: number) => 
        idx !== index && 
        existingItem.name.toLowerCase() === name.trim().toLowerCase()
      );
      
      if (duplicateItem) {
        setNameError('同じ名前の商品が既に存在します');
        setLoading(false);
        return;
      }

      const updatedItem = {
        ...item,
        name: name.trim(),
        price: parseInt(price, 10),
      };

      items[index] = updatedItem;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      showSuccessMessage('商品情報を更新しました');
    } catch (error) {
      showErrorMessage('更新に失敗しました');
      console.error('保存エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      const items = storedData ? JSON.parse(storedData) : [];
      
      // 指定されたインデックスのアイテムを削除
      items.splice(index, 1);
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      setDeleteDialogVisible(false);
      showSuccessMessage('商品を削除しました');
    } catch (error) {
      showErrorMessage('削除に失敗しました');
      console.error('削除エラー:', error);
    }
  };

  const handlePricePresetSelect = (presetPrice: number) => {
    setPrice(presetPrice.toString());
    setPriceError('');
  };

  const resetForm = () => {
    setName(item.name);
    setPrice(item.price.toString());
    setNameError('');
    setPriceError('');
  };

  const formatPriceDisplay = (value: string) => {
    const numericValue = parseInt(value, 10);
    if (isNaN(numericValue)) return '';
    return `¥${numericValue.toLocaleString()}`;
  };

  const calculateRevenue = () => item.price * (item.count || 0);
  const calculateNewRevenue = () => {
    const newPrice = parseInt(price, 10);
    if (isNaN(newPrice)) return 0;
    return newPrice * (item.count || 0);
  };

  const revenueChange = calculateNewRevenue() - calculateRevenue();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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
          <PaperText style={styles.headerTitle}>商品を編集</PaperText>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => setDeleteDialogVisible(true)}
          >
            <IconButton
              icon="delete"
              size={20}
              iconColor="white"
              style={styles.deleteIcon}
            />
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.formWrapper, { transform: [{ scale: formScale }] }]}>
            {/* 統計カード */}
            <Card style={styles.statsCard}>
              <Card.Content style={styles.statsContent}>
                <View style={styles.statsHeader}>
                  <IconButton
                    icon="chart-line"
                    size={24}
                    iconColor="#667eea"
                    style={styles.statsIcon}
                  />
                  <PaperText style={styles.statsTitle}>現在の実績</PaperText>
                </View>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <PaperText style={styles.statLabel}>販売数</PaperText>
                    <PaperText style={styles.statValue}>{item.count || 0}</PaperText>
                    <PaperText style={styles.statUnit}>個</PaperText>
                  </View>
                  <View style={styles.statItem}>
                    <PaperText style={styles.statLabel}>現在価格</PaperText>
                    <PaperText style={styles.statValue}>
                      ¥{item.price.toLocaleString()}
                    </PaperText>
                    <PaperText style={styles.statUnit}>円</PaperText>
                  </View>
                  <View style={styles.statItem}>
                    <PaperText style={styles.statLabel}>売上</PaperText>
                    <PaperText style={styles.revenueValue}>
                      ¥{calculateRevenue().toLocaleString()}
                    </PaperText>
                    <PaperText style={styles.statUnit}>円</PaperText>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* フォームカード */}
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
                    placeholder="商品名を入力"
                    style={styles.input}
                    error={!!nameError}
                    maxLength={50}
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

                {/* 変更予測カード */}
                {hasChanges && !nameError && !priceError && price && (
                  <View style={styles.previewSection}>
                    <PaperText style={styles.previewLabel}>変更予測</PaperText>
                    <Card style={styles.previewCard}>
                      <Card.Content style={styles.previewContent}>
                        <View style={styles.previewRow}>
                          <PaperText style={styles.previewItemLabel}>新しい価格:</PaperText>
                          <PaperText style={styles.previewItemValue}>
                            {formatPriceDisplay(price)}
                          </PaperText>
                        </View>
                        <View style={styles.previewRow}>
                          <PaperText style={styles.previewItemLabel}>新しい売上:</PaperText>
                          <PaperText style={styles.newRevenueValue}>
                            ¥{calculateNewRevenue().toLocaleString()}
                          </PaperText>
                        </View>
                        {revenueChange !== 0 && (
                          <View style={styles.previewRow}>
                            <PaperText style={styles.previewItemLabel}>売上変化:</PaperText>
                            <PaperText style={[
                              styles.revenueChangeValue,
                              revenueChange > 0 ? styles.positiveChange : styles.negativeChange
                            ]}>
                              {revenueChange > 0 ? '+' : ''}¥{revenueChange.toLocaleString()}
                            </PaperText>
                          </View>
                        )}
                      </Card.Content>
                    </Card>
                  </View>
                )}

                {/* ボタン */}
                <View style={styles.buttonContainer}>
                  <PaperButton
                    mode="contained"
                    onPress={handleSave}
                    style={[
                      styles.saveButton,
                      !hasChanges && styles.saveButtonDisabled
                    ]}
                    contentStyle={styles.saveButtonContent}
                    disabled={loading || !hasChanges || !!nameError || !!priceError}
                    loading={loading}
                    buttonColor="#667eea"
                    labelStyle={styles.saveButtonLabel}
                    icon="content-save"
                  >
                    {loading ? '保存中...' : '変更を保存'}
                  </PaperButton>
                  
                  <TouchableOpacity 
                    style={styles.resetButton}
                    onPress={resetForm}
                  >
                    <IconButton
                      icon="refresh"
                      size={16}
                      iconColor="#64748b"
                      style={styles.resetIcon}
                    />
                    <PaperText style={styles.resetButtonText}>リセット</PaperText>
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>
          </Animated.View>
        </ScrollView>
      </LinearGradient>

      <Portal>
        {/* 削除確認ダイアログ */}
        <Dialog 
          visible={deleteDialogVisible} 
          onDismiss={() => setDeleteDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>
            <View style={styles.deleteDialogTitleContainer}>
              <IconButton
                icon="alert"
                size={24}
                iconColor="#f44336"
                style={styles.warningIcon}
              />
              <PaperText style={styles.deleteDialogTitle}>商品の削除</PaperText>
            </View>
          </Dialog.Title>
          <Dialog.Content>
            <PaperText style={styles.dialogContent}>
              「{item.name}」を削除してもよろしいですか？
            </PaperText>
            <View style={styles.deleteSummary}>
              <View style={styles.summaryRow}>
                <PaperText style={styles.summaryLabel}>販売数:</PaperText>
                <PaperText style={styles.summaryValue}>{item.count || 0}個</PaperText>
              </View>
              <View style={styles.summaryRow}>
                <PaperText style={styles.summaryLabel}>売上:</PaperText>
                <PaperText style={styles.summaryValue}>¥{calculateRevenue().toLocaleString()}</PaperText>
              </View>
            </View>
            <PaperText style={styles.warningText}>
              ⚠️ この操作は取り消せません
            </PaperText>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <PaperButton 
              onPress={() => setDeleteDialogVisible(false)}
              textColor="#64748b"
              labelStyle={styles.dialogButtonLabel}
              style={styles.cancelButton}
            >
              キャンセル
            </PaperButton>
            <PaperButton 
              onPress={handleDelete} 
              textColor="white"
              style={styles.deleteConfirmButton}
              labelStyle={styles.dialogButtonLabel}
              icon="delete"
            >
              削除
            </PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        style={[
          styles.snackbar,
          {
            backgroundColor: snackbarMessage.includes('成功') || snackbarMessage.includes('更新') || snackbarMessage.includes('削除')
              ? '#4caf50' 
              : '#f44336'
          }
        ]}
      >
        <View style={styles.snackbarContent}>
          <IconButton
            icon={snackbarMessage.includes('成功') || snackbarMessage.includes('更新') || snackbarMessage.includes('削除') ? 'check-circle' : 'alert-circle'}
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
  deleteButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  deleteIcon: {
    margin: 0,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formWrapper: {
    gap: 20,
  },
  statsCard: {
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    backgroundColor: 'white',
  },
  statsContent: {
    padding: 24,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsIcon: {
    margin: 0,
    marginRight: 8,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 8,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4caf50',
    marginBottom: 4,
  },
  statUnit: {
    fontSize: 10,
    color: '#94a3b8',
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
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewItemLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  previewItemValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
  },
  newRevenueValue: {
    fontSize: 16,
    color: '#4caf50',
    fontWeight: '600',
  },
  revenueChangeValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  positiveChange: {
    color: '#22c55e',
  },
  negativeChange: {
    color: '#ef4444',
  },
  buttonContainer: {
    gap: 16,
  },
  saveButton: {
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
  saveButtonDisabled: {
    elevation: 2,
    shadowOpacity: 0.1,
  },
  saveButtonContent: {
    paddingVertical: 12,
  },
  saveButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  resetIcon: {
    margin: 0,
    marginRight: 4,
  },
  resetButtonText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  dialog: {
    borderRadius: 16,
  },
  dialogTitle: {
    color: '#2c3e50',
  },
  deleteDialogTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteDialogTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  warningIcon: {
    margin: 0,
  },
  dialogContent: {
    color: '#64748b',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  deleteSummary: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
  },
  warningText: {
    fontSize: 14,
    color: '#f44336',
    textAlign: 'center',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  dialogActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dialogButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  deleteConfirmButton: {
    backgroundColor: '#f44336',
    marginLeft: 8,
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

export default ItemDetailScreen;