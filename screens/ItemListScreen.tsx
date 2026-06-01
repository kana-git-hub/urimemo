import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const A = {
  bg: '#FAF8F5',
  surface: '#FFFFFF',
  line: '#ECE7E0',
  ink: '#221C18',
  muted: '#8C837A',
  faint: '#B6ADA3',
  accent: '#9A4A3A',
  accentSoft: 'rgba(154,74,58,0.09)',
  accentLine: 'rgba(154,74,58,0.22)',
  pos: '#3F7A5E',
};

const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`;
const num = (n: number) => n.toLocaleString('ja-JP');

interface Item {
  id: string;
  name: string;
  price: number;
  count: number;
}

interface Props {
  navigation: any;
}

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

const ItemListScreen: React.FC<Props> = ({ navigation }) => {
  const isFocused = useIsFocused();
  const [items, setItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'revenue'>('name');
  const [quickEdit, setQuickEdit] = useState<Item | null>(null);
  const [quickEditValue, setQuickEditValue] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (isFocused) loadItems();
  }, [isFocused]);

  const loadItems = async () => {
    try {
      const data = await AsyncStorage.getItem('items');
      if (data) setItems(JSON.parse(data));
    } catch (e) {}
  };

  const saveItems = async (next: Item[]) => {
    setItems(next);
    try {
      await AsyncStorage.setItem('items', JSON.stringify(next));
    } catch (e) {}
  };

  const inc = (id: string) =>
    saveItems(items.map(i => i.id === id ? { ...i, count: (i.count || 0) + 1 } : i));

  const dec = (id: string) =>
    saveItems(items.map(i => i.id === id && i.count > 0 ? { ...i, count: i.count - 1 } : i));

  const setCount = (id: string, count: number) =>
    saveItems(items.map(i => i.id === id ? { ...i, count } : i));

  const resetCounts = () =>
    saveItems(items.map(i => ({ ...i, count: 0 })));

  const total = items.reduce((s, i) => s + i.price * (i.count || 0), 0);
  const units = items.reduce((s, i) => s + (i.count || 0), 0);

  let list = items.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
  list = [...list].sort((a, b) =>
    sortBy === 'name' ? a.name.localeCompare(b.name, 'ja') :
    sortBy === 'price' ? b.price - a.price :
    b.price * b.count - a.price * a.count
  );

  const openEdit = (item: Item) => {
    const index = items.findIndex(i => i.id === item.id);
    navigation.navigate('ItemDetail', { item, index });
  };

  const renderItem = ({ item }: { item: Item }) => (
    <View style={styles.row}>
      <TouchableOpacity style={styles.rowInfo} onPress={() => openEdit(item)} activeOpacity={0.7}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.rowMeta}>
          <Text style={styles.itemPrice}>{yen(item.price)}</Text>
          <Text style={[styles.itemRevenue, { color: item.count ? A.pos : A.faint }]}>
            売上 {yen(item.price * (item.count || 0))}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.ctrlBtn, styles.ctrlMinus]}
          onPress={() => dec(item.id)}
          disabled={!item.count}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="minus" size={16} color={item.count ? A.ink : A.faint} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.ctrlCount}
          onPress={() => { setQuickEdit(item); setQuickEditValue(String(item.count || 0)); }}
          activeOpacity={0.7}
        >
          <Text style={styles.countText}>{item.count || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.ctrlBtn, styles.ctrlPlus]} onPress={() => inc(item.id)} activeOpacity={0.8}>
          <MaterialCommunityIcons name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* ヘッダー：売上サマリー */}
      <View style={styles.headerArea}>
        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>本日の売上</Text>
            <Text style={styles.totalValue}>
              <Text style={styles.yenSign}>¥</Text>{num(total)}
            </Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setConfirmReset(true)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="refresh" size={18} color={A.muted} />
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.stat}>販売 <Text style={styles.statBold}>{units}</Text> 点</Text>
          <Text style={styles.stat}>商品 <Text style={styles.statBold}>{items.length}</Text> 種</Text>
        </View>
      </View>

      {/* 検索 + ソート */}
      <View style={styles.searchBarRow}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={16} color={A.faint} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="商品を検索"
            placeholderTextColor={A.faint}
            style={styles.searchInput}
          />
        </View>
        {(['name', 'price', 'revenue'] as const).map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.sortChip, sortBy === s && styles.sortChipActive]}
            onPress={() => setSortBy(s)}
            activeOpacity={0.7}
          >
            <Text style={[styles.sortChipText, sortBy === s && styles.sortChipTextActive]}>
              {s === 'name' ? '名前' : s === 'price' ? '価格' : '売上'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 商品リスト */}
      <FlatList
        data={list}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {searchQuery ? '該当する商品がありません' : '商品がまだ登録されていません'}
            </Text>
          </View>
        }
      />

      {/* 登録ボタン */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddItem')} activeOpacity={0.85}>
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      {/* 数量変更モーダル */}
      <HakModal visible={!!quickEdit} onClose={() => setQuickEdit(null)}>
        <Text style={styles.modalSmLabel}>数量を変更</Text>
        <Text style={styles.modalItemName}>{quickEdit?.name}</Text>
        <TextInput
          value={quickEditValue}
          onChangeText={v => setQuickEditValue(v.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
          style={styles.modalNumInput}
          autoFocus
          selectTextOnFocus
        />
        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.btnCancel} onPress={() => setQuickEdit(null)}>
            <Text style={styles.btnCancelText}>キャンセル</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnAccent}
            onPress={() => {
              if (quickEdit) { setCount(quickEdit.id, parseInt(quickEditValue || '0', 10)); setQuickEdit(null); }
            }}
          >
            <Text style={styles.btnAccentText}>保存</Text>
          </TouchableOpacity>
        </View>
      </HakModal>

      {/* リセット確認モーダル */}
      <HakModal visible={confirmReset} onClose={() => setConfirmReset(false)}>
        <Text style={styles.modalTitle}>売上をリセット</Text>
        <Text style={styles.modalBody}>
          全商品の販売数を 0 に戻します。現在の総売上{' '}
          <Text style={styles.modalBodyBold}>{yen(total)}</Text>
          。この操作は取り消せません。
        </Text>
        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.btnCancel} onPress={() => setConfirmReset(false)}>
            <Text style={styles.btnCancelText}>キャンセル</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnAccent} onPress={() => { resetCounts(); setConfirmReset(false); }}>
            <Text style={styles.btnAccentText}>リセット</Text>
          </TouchableOpacity>
        </View>
      </HakModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: A.bg },

  // ヘッダー
  headerArea: { paddingHorizontal: 24, paddingTop: 20 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  totalLabel: { fontSize: 13, color: A.muted, fontWeight: '600', letterSpacing: 1.4 },
  totalValue: {
    fontSize: 52,
    fontWeight: '700',
    color: A.ink,
    letterSpacing: -2.4,
    lineHeight: 60,
    marginTop: 8,
    fontVariant: ['tabular-nums'] as any,
  },
  yenSign: { fontSize: 30, fontWeight: '600', color: A.faint },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth, borderColor: A.line,
    backgroundColor: A.surface,
    alignItems: 'center', justifyContent: 'center', marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row', gap: 18, marginTop: 16, paddingBottom: 18,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: A.line,
  },
  stat: { fontSize: 13.5, color: A.muted },
  statBold: { color: A.ink, fontWeight: '700' },

  // 検索・ソート
  searchBarRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 24, paddingTop: 14, paddingBottom: 10,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: A.bg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: A.line,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9,
  },
  searchInput: { flex: 1, fontSize: 14, color: A.ink, padding: 0 },
  sortChip: {
    borderWidth: StyleSheet.hairlineWidth, borderColor: A.line,
    backgroundColor: A.surface, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  sortChipActive: { borderColor: A.accentLine, backgroundColor: A.accentSoft },
  sortChipText: { fontSize: 12, color: A.muted, fontWeight: '500' },
  sortChipTextActive: { color: A.accent, fontWeight: '700' },

  // リスト行
  listContent: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 100 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 8, paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: A.line,
  },
  rowInfo: { flex: 1, minWidth: 0 },
  itemName: { fontSize: 15.5, fontWeight: '600', color: A.ink },
  rowMeta: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', alignItems: 'baseline', marginTop: 4 },
  itemPrice: { fontSize: 13, color: A.muted },
  itemRevenue: { fontSize: 12.5 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ctrlBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ctrlMinus: {
    borderWidth: StyleSheet.hairlineWidth, borderColor: A.line, backgroundColor: A.surface,
  },
  ctrlPlus: {
    width: 38, height: 38, borderRadius: 11, backgroundColor: A.accent,
    shadowColor: A.accent, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.28, shadowRadius: 9,
    elevation: 4,
  },
  ctrlCount: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  countText: {
    fontSize: 18, fontWeight: '700', color: A.ink,
    fontVariant: ['tabular-nums'] as any,
  },

  // 空状態
  empty: { paddingTop: 64, paddingHorizontal: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, color: A.faint, textAlign: 'center' },

  // FAB
  fab: {
    position: 'absolute', right: 24, bottom: 32,
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: A.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: A.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12,
    elevation: 8,
  },

  // モーダル共通
  overlayBg: {
    flex: 1, backgroundColor: 'rgba(34,28,24,0.32)',
    alignItems: 'center', justifyContent: 'center', padding: 28,
  },
  modalCard: { width: '100%', backgroundColor: A.surface, borderRadius: 24, padding: 24 },
  modalSmLabel: { fontSize: 13, color: A.muted, fontWeight: '600' },
  modalItemName: { fontSize: 17, fontWeight: '700', color: A.ink, marginTop: 4, marginBottom: 18 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: A.ink },
  modalBody: { fontSize: 14.5, color: A.muted, lineHeight: 23, marginTop: 10, marginBottom: 4 },
  modalBodyBold: { color: A.ink, fontWeight: '700' },
  modalNumInput: {
    width: '100%', borderWidth: 1, borderColor: A.line, borderRadius: 14,
    padding: 14, fontSize: 24, fontWeight: '700', color: A.ink, textAlign: 'center',
    fontVariant: ['tabular-nums'] as any,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  btnCancel: {
    flex: 1, padding: 13, borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth, borderColor: A.line,
    backgroundColor: A.surface, alignItems: 'center',
  },
  btnCancelText: { fontSize: 15, color: A.muted, fontWeight: '600' },
  btnAccent: { flex: 1, padding: 13, borderRadius: 13, backgroundColor: A.accent, alignItems: 'center' },
  btnAccentText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});

export default ItemListScreen;
