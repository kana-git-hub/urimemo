import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import IMETextInput from '../components/IMETextInput';
import { useIMEField } from '../hooks/useIMEField';
import { useFocusRing } from '../hooks/useFocusRing';

const A = {
  bg: '#F4F6FB',
  surface: '#FFFFFF',
  line: '#E3E8F1',
  ink: '#1B2333',
  muted: '#79839A',
  faint: '#A9B1C2',
  accent: '#667EEA',
  accentSoft: 'rgba(102,126,234,0.10)',
  accentLine: 'rgba(102,126,234,0.24)',
};

const PRICE_PRESETS = [100, 200, 300, 500, 1000, 1500, 2000, 3000];
const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`;
const STORAGE_KEY = 'items';

const AddItemScreen = () => {
  const navigation = useNavigation();
  const nameField = useIMEField('');
  const nameFocus = useFocusRing();
  const priceFocus = useFocusRing();
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  // 表示・ボタンの見た目用（デバウンス値）。送信時は getCurrent() で最新値を読む。
  const valid = nameField.value.trim().length > 0 && parseInt(price, 10) > 0;

  const handleAdd = async () => {
    if (loading) return;
    const name = nameField.getCurrent().trim();
    const priceNum = parseInt(price, 10);
    if (!name || !(priceNum > 0)) return;
    setLoading(true);
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      const items = data ? JSON.parse(data) : [];
      items.push({
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        name,
        price: priceNum,
        count: 0,
      });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      navigation.goBack();
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={A.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>商品を登録</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 商品名 */}
          <Text style={styles.label}>商品名</Text>
          <IMETextInput
            defaultValue={nameField.initial}
            onChangeText={nameField.onChangeText}
            onEndEditing={nameField.commit}
            onFocus={nameFocus.onFocus}
            onBlur={nameFocus.onBlur}
            placeholder="例：新刊"
            placeholderTextColor={A.faint}
            maxLength={50}
            style={[styles.textInput, nameFocus.focused && styles.inputFocused]}
            autoFocus
          />

          {/* 価格 */}
          <Text style={[styles.label, { marginTop: 24 }]}>価格</Text>
          <View style={[styles.priceRow, priceFocus.focused && styles.inputFocused]}>
            <Text style={styles.yenPrefix}>¥</Text>
            <TextInput
              value={price ? Number(price).toLocaleString('ja-JP') : ''}
              onChangeText={v => setPrice(v.replace(/[^0-9]/g, ''))}
              onFocus={priceFocus.onFocus}
              onBlur={priceFocus.onBlur}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={A.faint}
              style={styles.priceInput}
            />
          </View>

          {/* 価格プリセット */}
          <View style={styles.presetsRow}>
            {PRICE_PRESETS.map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.preset, price === String(p) && styles.presetActive]}
                onPress={() => { setPrice(String(p)); nameField.commit(); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.presetText, price === String(p) && styles.presetTextActive]}>
                  ¥{p.toLocaleString('ja-JP')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* プレビュー */}
          {valid && (
            <View style={styles.preview}>
              <View style={styles.previewHead}>
                <MaterialCommunityIcons name="eye-outline" size={15} color={A.accent} />
                <Text style={styles.previewLabel}>登録プレビュー</Text>
              </View>
              <View style={styles.previewCard}>
                <View style={styles.previewInfo}>
                  <Text style={styles.previewName} numberOfLines={1}>{nameField.value.trim()}</Text>
                  <Text style={styles.previewMeta}>レジに追加される商品</Text>
                </View>
                <Text style={styles.previewPrice}>{yen(parseInt(price, 10))}</Text>
              </View>
            </View>
          )}

          {/* 登録ボタン（押下時に最新値で検証） */}
          <TouchableOpacity
            style={[styles.submitBtn, !valid && styles.submitBtnDisabled]}
            onPress={handleAdd}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={[styles.submitText, !valid && styles.submitTextDisabled]}>
              {loading ? '登録中...' : '商品を登録'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: A.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth, borderColor: A.line,
    backgroundColor: A.surface, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 19, fontWeight: '700', color: A.ink },
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },

  label: { fontSize: 14.5, fontWeight: '700', color: A.muted, letterSpacing: 0.4, marginBottom: 9 },
  textInput: {
    borderWidth: 1.5, borderColor: A.line, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 15,
    fontSize: 18, color: A.ink, backgroundColor: A.surface,
  },
  inputFocused: { borderColor: A.accent, backgroundColor: A.accentSoft },
  priceRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: A.line, borderRadius: 14,
    paddingHorizontal: 16, backgroundColor: A.surface,
  },
  yenPrefix: { fontSize: 24, color: A.faint, fontWeight: '600' },
  priceInput: {
    flex: 1, paddingVertical: 15, paddingHorizontal: 8,
    fontSize: 27, fontWeight: '700', color: A.ink,
    fontVariant: ['tabular-nums'] as any,
  },
  presetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  preset: {
    borderWidth: StyleSheet.hairlineWidth, borderColor: A.line,
    backgroundColor: A.surface, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  presetActive: { borderColor: A.accentLine, backgroundColor: A.accentSoft },
  presetText: { fontSize: 14.5, fontWeight: '600', color: A.muted },
  presetTextActive: { color: A.accent },

  preview: {
    marginTop: 28, padding: 14,
    borderRadius: 18, backgroundColor: A.accentSoft,
  },
  previewHead: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 10, paddingHorizontal: 4,
  },
  previewLabel: { fontSize: 12.5, color: A.accent, fontWeight: '700', letterSpacing: 0.6 },
  previewCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: A.surface, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 15,
  },
  previewInfo: { flex: 1, marginRight: 10 },
  previewName: { fontSize: 16.5, fontWeight: '600', color: A.ink },
  previewMeta: { fontSize: 12.5, color: A.faint, marginTop: 3 },
  previewPrice: {
    fontSize: 19, fontWeight: '700', color: A.accent,
    fontVariant: ['tabular-nums'] as any,
  },

  submitBtn: {
    marginTop: 24, padding: 16, borderRadius: 16,
    backgroundColor: A.accent, alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: A.line },
  submitText: { fontSize: 17.5, fontWeight: '700', color: '#fff' },
  submitTextDisabled: { color: A.faint },
});

export default AddItemScreen;
