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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

type Item = { id: string; name: string; price: number; count: number };
type Params = { item: Item; index: number };

function HakModal({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.overlayBg}>
        <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const ItemDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ ItemDetail: Params }, 'ItemDetail'>>();
  const { item, index } = route.params;

  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(String(item.price));
  const [loading, setLoading] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const valid = name.trim().length > 0 && parseInt(price, 10) > 0;
  const hasChanges = name.trim() !== item.name || parseInt(price, 10) !== item.price;
  const canSave = valid && hasChanges;

  const handleSave = async () => {
    if (!canSave || loading) return;
    setLoading(true);
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      const items = data ? JSON.parse(data) : [];
      items[index] = { ...item, name: name.trim(), price: parseInt(price, 10) };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      navigation.goBack();
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      const items = data ? JSON.parse(data) : [];
      items.splice(index, 1);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      setConfirmDel(false);
      navigation.goBack();
    } catch (e) {}
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={A.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>商品を編集</Text>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setConfirmDel(true)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="delete-outline" size={18} color={A.accent} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 現在の実績 */}
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>現在の実績</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>販売数</Text>
                <Text style={styles.statValue}>
                  {item.count || 0}<Text style={styles.statUnit}> 点</Text>
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>売上</Text>
                <Text style={styles.statValue}>{yen(item.price * (item.count || 0))}</Text>
              </View>
            </View>
          </View>

          {/* 商品名 */}
          <Text style={styles.label}>商品名</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="商品名を入力"
            placeholderTextColor={A.faint}
            maxLength={50}
            style={styles.textInput}
          />

          {/* 価格 */}
          <Text style={[styles.label, { marginTop: 24 }]}>価格</Text>
          <View style={styles.priceRow}>
            <Text style={styles.yenPrefix}>¥</Text>
            <TextInput
              value={price}
              onChangeText={v => setPrice(v.replace(/[^0-9]/g, ''))}
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
                onPress={() => setPrice(String(p))}
                activeOpacity={0.7}
              >
                <Text style={[styles.presetText, price === String(p) && styles.presetTextActive]}>
                  ¥{p.toLocaleString('ja-JP')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 変更プレビュー */}
          {hasChanges && valid && (
            <View style={styles.preview}>
              <Text style={styles.previewLabel}>変更後</Text>
              <View style={styles.previewRow}>
                <Text style={styles.previewName} numberOfLines={1}>{name.trim()}</Text>
                <Text style={styles.previewPrice}>{yen(parseInt(price, 10))}</Text>
              </View>
            </View>
          )}

          {/* 保存ボタン */}
          <TouchableOpacity
            style={[styles.submitBtn, !canSave && styles.submitBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave || loading}
            activeOpacity={0.85}
          >
            <Text style={[styles.submitText, !canSave && styles.submitTextDisabled]}>
              {loading ? '保存中...' : '変更を保存'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 削除確認モーダル */}
      <HakModal visible={confirmDel} onClose={() => setConfirmDel(false)}>
        <Text style={styles.modalTitle}>商品を削除</Text>
        <Text style={styles.modalBody}>
          「{item.name}」を削除します。この操作は取り消せません。
        </Text>
        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.btnCancel} onPress={() => setConfirmDel(false)}>
            <Text style={styles.btnCancelText}>キャンセル</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnAccent} onPress={handleDelete}>
            <Text style={styles.btnAccentText}>削除</Text>
          </TouchableOpacity>
        </View>
      </HakModal>
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

  statsCard: {
    backgroundColor: A.surface,
    borderWidth: StyleSheet.hairlineWidth, borderColor: A.line,
    borderRadius: 18, padding: 18, marginBottom: 28,
  },
  statsTitle: { fontSize: 13, color: A.muted, fontWeight: '700', letterSpacing: 0.6, marginBottom: 14 },
  statsGrid: { flexDirection: 'row', alignItems: 'center' },
  statCol: { flex: 1, alignItems: 'center' },
  statDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: A.line },
  statLabel: { fontSize: 13.5, color: A.muted, fontWeight: '600', marginBottom: 6 },
  statValue: {
    fontSize: 27, fontWeight: '700', color: A.ink,
    fontVariant: ['tabular-nums'] as any,
  },
  statUnit: { fontSize: 15, color: A.faint, fontWeight: '600' },

  label: { fontSize: 14.5, fontWeight: '700', color: A.muted, letterSpacing: 0.4, marginBottom: 9 },
  textInput: {
    borderWidth: 1, borderColor: A.line, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 15,
    fontSize: 18, color: A.ink, backgroundColor: A.surface,
  },
  priceRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: A.line, borderRadius: 14,
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
    marginTop: 26, padding: 18,
    borderWidth: 1, borderColor: A.accentLine,
    borderStyle: 'dashed', borderRadius: 16, backgroundColor: A.accentSoft,
  },
  previewLabel: { fontSize: 13, color: A.accent, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewName: { fontSize: 17, fontWeight: '600', color: A.ink, flex: 1, marginRight: 8 },
  previewPrice: {
    fontSize: 19, fontWeight: '700', color: A.ink,
    fontVariant: ['tabular-nums'] as any,
  },

  submitBtn: {
    marginTop: 24, padding: 16, borderRadius: 16,
    backgroundColor: A.accent, alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: A.line },
  submitText: { fontSize: 17.5, fontWeight: '700', color: '#fff' },
  submitTextDisabled: { color: A.faint },

  overlayBg: {
    flex: 1, backgroundColor: 'rgba(34,28,24,0.32)',
    alignItems: 'center', justifyContent: 'center', padding: 28,
  },
  modalCard: { width: '100%', backgroundColor: A.surface, borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: A.ink },
  modalBody: { fontSize: 16, color: A.muted, lineHeight: 25, marginTop: 10, marginBottom: 4 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btnCancel: {
    flex: 1, padding: 14, borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth, borderColor: A.line,
    backgroundColor: A.surface, alignItems: 'center',
  },
  btnCancelText: { fontSize: 16.5, color: A.muted, fontWeight: '600' },
  btnAccent: { flex: 1, padding: 14, borderRadius: 13, backgroundColor: A.accent, alignItems: 'center' },
  btnAccentText: { fontSize: 16.5, color: '#fff', fontWeight: '700' },
});

export default ItemDetailScreen;
