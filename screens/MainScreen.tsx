import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Text,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import IMETextInput from '../components/IMETextInput';
import { useIMEField } from '../hooks/useIMEField';

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
  pos: '#16A06B',
};

const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`;
const num = (n: number) => n.toLocaleString('ja-JP');

type Tab = 'register' | 'summary' | 'memo';
interface Item { id: string; name: string; price: number; count: number }
interface Memo { id: string; text: string; createdAt: number }

const MEMO_KEY = 'memos';

// 日時を「M月D日 HH:mm」で表示
function formatMemoDate(ts: number) {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${d.getMonth() + 1}月${d.getDate()}日 ${h}:${m}`;
}

// ─── 共通モーダル ──────────────────────────────────────────────────────────────
function HakModal({ visible, onClose, children }: {
  visible: boolean; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity activeOpacity={1} onPress={onClose} style={s.overlayBg}>
          <TouchableOpacity activeOpacity={1} style={s.modalCard}>
            {children}
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── 下タブバー ────────────────────────────────────────────────────────────────
function BottomTabBar({ active, onTab, onAdd }: {
  active: Tab; onTab: (t: Tab) => void; onAdd: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <TouchableOpacity style={s.tabItem} onPress={() => onTab('register')} activeOpacity={0.7}>
        <MaterialCommunityIcons
          name="receipt"
          size={23}
          color={active === 'register' ? A.accent : A.faint}
        />
        <Text style={[s.tabLabel, active === 'register' && s.tabLabelActive]}>レジ</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.tabItem} onPress={() => onTab('summary')} activeOpacity={0.7}>
        <MaterialCommunityIcons
          name="chart-bar"
          size={23}
          color={active === 'summary' ? A.accent : A.faint}
        />
        <Text style={[s.tabLabel, active === 'summary' && s.tabLabelActive]}>集計</Text>
      </TouchableOpacity>

      {/* フローティング登録ボタン */}
      <View style={s.tabCenter}>
        <TouchableOpacity style={s.centerBtn} onPress={onAdd} activeOpacity={0.85}>
          <MaterialCommunityIcons name="plus" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={s.centerLabel}>登録</Text>
      </View>

      <TouchableOpacity style={s.tabItem} onPress={() => onTab('memo')} activeOpacity={0.7}>
        <MaterialCommunityIcons
          name="hand-heart-outline"
          size={23}
          color={active === 'memo' ? A.accent : A.faint}
        />
        <Text style={[s.tabLabel, active === 'memo' && s.tabLabelActive]}>メモ</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── レジタブ ──────────────────────────────────────────────────────────────────
function RegisterTab({ items, inc, dec, setCount, resetCounts, openEdit }: {
  items: Item[];
  inc: (id: string) => void;
  dec: (id: string) => void;
  setCount: (id: string, n: number) => void;
  resetCounts: () => void;
  openEdit: (item: Item) => void;
}) {
  const searchField = useIMEField('');
  const searchQuery = searchField.value;
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'revenue'>('name');
  const [quickEdit, setQuickEdit] = useState<Item | null>(null);
  const [quickEditValue, setQuickEditValue] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const total = items.reduce((s, i) => s + i.price * (i.count || 0), 0);
  const units = items.reduce((s, i) => s + (i.count || 0), 0);

  let list = items.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
  list = [...list].sort((a, b) =>
    sortBy === 'name'    ? a.name.localeCompare(b.name, 'ja') :
    sortBy === 'price'   ? b.price - a.price :
    b.price * b.count - a.price * a.count
  );

  const renderItem = ({ item }: { item: Item }) => (
    <View style={s.row}>
      <TouchableOpacity style={s.rowInfo} onPress={() => openEdit(item)} activeOpacity={0.6}>
        <View style={s.nameRow}>
          <Text style={s.itemName} numberOfLines={1}>{item.name}</Text>
          <MaterialCommunityIcons name="pencil" size={13} color={A.faint} style={s.editHint} />
        </View>
        <View style={s.rowMeta}>
          <Text style={s.itemPrice}>{yen(item.price)}</Text>
          <Text style={[s.itemRevenue, { color: item.count ? A.pos : A.faint }]}>
            売上 {yen(item.price * (item.count || 0))}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={s.controls}>
        <TouchableOpacity
          style={[s.ctrlBtn, s.ctrlMinus]}
          onPress={() => dec(item.id)}
          disabled={!item.count}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="minus" size={18} color={item.count ? A.ink : A.faint} />
        </TouchableOpacity>
        <TouchableOpacity
          style={s.ctrlCount}
          onPress={() => { setQuickEdit(item); setQuickEditValue(String(item.count || 0)); }}
          activeOpacity={0.7}
        >
          <Text style={s.countText}>{item.count || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.ctrlBtn, s.ctrlPlus]} onPress={() => inc(item.id)} activeOpacity={0.8}>
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {/* 売上ヘッダー */}
      <View style={s.headerArea}>
        <View style={s.totalRow}>
          <View>
            <Text style={s.totalLabel}>本日の売上</Text>
            <View style={s.totalAmountRow}>
              <View style={s.yenSign}>
                <Text style={s.yenSignText}>¥</Text>
              </View>
              <Text style={s.totalValue}>{num(total)}</Text>
            </View>
          </View>
          <TouchableOpacity style={s.iconBtn} onPress={() => setConfirmReset(true)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="refresh" size={18} color={A.muted} />
          </TouchableOpacity>
        </View>
        <View style={s.statsRow}>
          <Text style={s.stat}>販売 <Text style={s.statBold}>{units}</Text> 点</Text>
          <Text style={s.stat}>商品 <Text style={s.statBold}>{items.length}</Text> 種</Text>
        </View>
      </View>

      {/* 検索・ソート */}
      <View style={s.searchBarRow}>
        <View style={s.searchBox}>
          <MaterialCommunityIcons name="magnify" size={16} color={A.faint} />
          <IMETextInput
            defaultValue={searchField.initial}
            onChangeText={searchField.onChangeText}
            onEndEditing={searchField.commit}
            onSubmitEditing={searchField.commit}
            returnKeyType="search"
            placeholder="商品を検索"
            placeholderTextColor={A.faint}
            style={s.searchInput}
          />
        </View>
        {(['name', 'price', 'revenue'] as const).map(sv => (
          <TouchableOpacity
            key={sv}
            style={[s.sortChip, sortBy === sv && s.sortChipActive]}
            onPress={() => setSortBy(sv)}
            activeOpacity={0.7}
          >
            <Text style={[s.sortChipText, sortBy === sv && s.sortChipTextActive]}>
              {sv === 'name' ? '名前' : sv === 'price' ? '価格' : '売上'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 商品リスト */}
      <FlatList
        data={list}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={s.listContent}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>
              {searchQuery ? '該当する商品がありません' : '商品がまだ登録されていません'}
            </Text>
          </View>
        }
      />

      {/* 数量変更モーダル */}
      <HakModal visible={!!quickEdit} onClose={() => setQuickEdit(null)}>
        <Text style={s.modalSmLabel}>数量を変更</Text>
        <Text style={s.modalItemName}>{quickEdit?.name}</Text>
        <TextInput
          value={quickEditValue}
          onChangeText={v => setQuickEditValue(v.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
          style={s.modalNumInput}
          autoFocus
          selectTextOnFocus
        />
        <View style={s.modalActions}>
          <TouchableOpacity style={s.btnCancel} onPress={() => setQuickEdit(null)}>
            <Text style={s.btnCancelText}>キャンセル</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.btnAccent}
            onPress={() => {
              if (quickEdit) { setCount(quickEdit.id, parseInt(quickEditValue || '0', 10)); setQuickEdit(null); }
            }}
          >
            <Text style={s.btnAccentText}>保存</Text>
          </TouchableOpacity>
        </View>
      </HakModal>

      {/* リセット確認モーダル */}
      <HakModal visible={confirmReset} onClose={() => setConfirmReset(false)}>
        <Text style={s.modalTitle}>売上をリセット</Text>
        <Text style={s.modalBody}>
          全商品の販売数を 0 に戻します。現在の総売上は{' '}
          <Text style={s.modalBodyBold}>{yen(total)}</Text> です。この操作は取り消せません。
        </Text>
        <View style={s.modalActions}>
          <TouchableOpacity style={s.btnCancel} onPress={() => setConfirmReset(false)}>
            <Text style={s.btnCancelText}>キャンセル</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnAccent} onPress={() => { resetCounts(); setConfirmReset(false); }}>
            <Text style={s.btnAccentText}>リセット</Text>
          </TouchableOpacity>
        </View>
      </HakModal>
    </View>
  );
}

// ─── 集計タブ ──────────────────────────────────────────────────────────────────
function SummaryTab({ items }: { items: Item[] }) {
  const ranked = [...items]
    .map(i => ({ ...i, rev: i.price * (i.count || 0) }))
    .sort((a, b) => b.rev - a.rev);
  const max = Math.max(1, ...ranked.map(r => r.rev));
  const total = ranked.reduce((s, r) => s + r.rev, 0);
  const units = ranked.reduce((s, r) => s + (r.count || 0), 0);
  const best = ranked[0];

  return (
    <ScrollView contentContainerStyle={s.summaryScroll} showsVerticalScrollIndicator={false}>
      <Text style={s.pageTitle}>集計</Text>

      {/* 統計カード */}
      <View style={s.statsCards}>
        <View style={s.statsCard}>
          <Text style={s.statsCardLabel}>総売上</Text>
          <Text style={s.statsCardValue}>{yen(total)}</Text>
        </View>
        <View style={s.statsCard}>
          <Text style={s.statsCardLabel}>販売点数</Text>
          <Text style={s.statsCardValue}>
            {units}<Text style={s.statsCardUnit}> 点</Text>
          </Text>
        </View>
      </View>

      {/* ベストセラー */}
      {best && best.rev > 0 && (
        <View style={s.bestBanner}>
          <MaterialCommunityIcons name="star" size={18} color={A.accent} />
          <Text style={s.bestText}>
            最も売れている商品 <Text style={{ fontWeight: '700' }}>{best.name}</Text>
          </Text>
        </View>
      )}

      {/* 商品別ランキング */}
      <Text style={s.sectionLabel}>商品別の売上</Text>
      {ranked.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyText}>販売データがありません</Text>
        </View>
      ) : ranked.map(r => (
        <View key={r.id} style={s.rankRow}>
          <View style={s.rankHeader}>
            <Text style={s.rankName} numberOfLines={1}>{r.name}</Text>
            <Text style={s.rankRevenue}>{yen(r.rev)}</Text>
          </View>
          <View style={s.barRow}>
            <View style={s.barTrack}>
              <View style={[s.barFill, { width: `${(r.rev / max) * 100}%` as any }]} />
            </View>
            <Text style={s.rankCount}>{r.count}点</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── メモタブ（寄贈・交換の記録）────────────────────────────────────────────────
function MemoTab({ memos, addMemo, updateMemo, removeMemo }: {
  memos: Memo[];
  addMemo: (text: string) => void;
  updateMemo: (id: string, text: string) => void;
  removeMemo: (id: string) => void;
}) {
  const [editing, setEditing] = useState<Memo | null>(null);
  const [isNew, setIsNew] = useState(false);
  // 打鍵ごとの再描画（=IME中断・一覧のカクつき）を避けるため draft は ref で保持
  const draftRef = React.useRef('');

  const openNew = () => { draftRef.current = ''; setEditing(null); setIsNew(true); };
  const openEdit = (m: Memo) => { draftRef.current = m.text; setEditing(m); setIsNew(false); };
  const close = () => { draftRef.current = ''; setEditing(null); setIsNew(false); };

  const save = () => {
    const text = draftRef.current.trim();
    if (!text) return;
    if (editing) updateMemo(editing.id, text);
    else addMemo(text);
    close();
  };

  const sorted = [...memos].sort((a, b) => b.createdAt - a.createdAt);
  const modalVisible = isNew || !!editing;

  return (
    <View style={{ flex: 1 }}>
      <View style={s.memoHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.pageTitle}>寄贈・交換メモ</Text>
          <Text style={s.memoSubtitle}>お渡しした本や交換の記録を残せます</Text>
        </View>
        <TouchableOpacity style={s.memoAddBtn} onPress={openNew} activeOpacity={0.85}>
          <MaterialCommunityIcons name="plus" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={m => m.id}
        contentContainerStyle={s.memoListContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.memoCard} onPress={() => openEdit(item)} activeOpacity={0.6}>
            <Text style={s.memoText}>{item.text}</Text>
            <View style={s.memoMetaRow}>
              <MaterialCommunityIcons name="clock-outline" size={13} color={A.faint} />
              <Text style={s.memoDate}>{formatMemoDate(item.createdAt)}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <MaterialCommunityIcons name="hand-heart-outline" size={40} color={A.faint} />
            <Text style={[s.emptyText, { marginTop: 12 }]}>まだメモがありません</Text>
            <Text style={[s.emptyText, { fontSize: 14, marginTop: 4 }]}>
              「＋」から「◯◯さんに新刊1冊寄贈」{'\n'}のように記録できます
            </Text>
          </View>
        }
      />

      <HakModal visible={modalVisible} onClose={close}>
        <Text style={s.modalTitle}>{editing ? 'メモを編集' : 'メモを追加'}</Text>
        <TextInput
          key={editing ? editing.id : 'new'}
          defaultValue={editing ? editing.text : ''}
          onChangeText={t => { draftRef.current = t; }}
          placeholder="例：◯◯さんに新刊を1冊寄贈／△△と既刊を交換"
          placeholderTextColor={A.faint}
          style={s.memoInput}
          multiline
          autoFocus
        />
        <View style={s.modalActions}>
          {editing ? (
            <TouchableOpacity
              style={s.memoDeleteBtn}
              onPress={() => { removeMemo(editing.id); close(); }}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={20} color={A.accent} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.btnCancel} onPress={close}>
              <Text style={s.btnCancelText}>キャンセル</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.btnAccent} onPress={save}>
            <Text style={s.btnAccentText}>{editing ? '保存' : '追加'}</Text>
          </TouchableOpacity>
        </View>
      </HakModal>
    </View>
  );
}

// ─── メインスクリーン ──────────────────────────────────────────────────────────
const MainScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const isFocused = useIsFocused();
  const [tab, setTab] = useState<Tab>('register');
  const [items, setItems] = useState<Item[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);

  useEffect(() => { if (isFocused) { loadItems(); loadMemos(); } }, [isFocused]);

  const loadItems = async () => {
    try {
      const data = await AsyncStorage.getItem('items');
      if (data) setItems(JSON.parse(data));
    } catch (e) {}
  };

  const loadMemos = async () => {
    try {
      const data = await AsyncStorage.getItem(MEMO_KEY);
      if (data) setMemos(JSON.parse(data));
    } catch (e) {}
  };

  const saveMemos = async (next: Memo[]) => {
    setMemos(next);
    try { await AsyncStorage.setItem(MEMO_KEY, JSON.stringify(next)); } catch (e) {}
  };

  const addMemo = (text: string) =>
    saveMemos([
      { id: Date.now().toString() + Math.random().toString(36).slice(2), text, createdAt: Date.now() },
      ...memos,
    ]);
  const updateMemo = (id: string, text: string) =>
    saveMemos(memos.map(m => m.id === id ? { ...m, text } : m));
  const removeMemo = (id: string) =>
    saveMemos(memos.filter(m => m.id !== id));

  const saveItems = async (next: Item[]) => {
    setItems(next);
    try { await AsyncStorage.setItem('items', JSON.stringify(next)); } catch (e) {}
  };

  const inc = (id: string) =>
    saveItems(items.map(i => i.id === id ? { ...i, count: (i.count || 0) + 1 } : i));
  const dec = (id: string) =>
    saveItems(items.map(i => i.id === id && i.count > 0 ? { ...i, count: i.count - 1 } : i));
  const setCount = (id: string, count: number) =>
    saveItems(items.map(i => i.id === id ? { ...i, count } : i));
  const resetCounts = () =>
    saveItems(items.map(i => ({ ...i, count: 0 })));

  const openEdit = (item: Item) => {
    const index = items.findIndex(i => i.id === item.id);
    navigation.navigate('ItemDetail', { item, index });
  };

  return (
    <View style={{ flex: 1, backgroundColor: A.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {tab === 'register' && (
          <RegisterTab
            items={items}
            inc={inc} dec={dec} setCount={setCount}
            resetCounts={resetCounts} openEdit={openEdit}
          />
        )}
        {tab === 'summary' && <SummaryTab items={items} />}
        {tab === 'memo' && (
          <MemoTab
            memos={memos}
            addMemo={addMemo}
            updateMemo={updateMemo}
            removeMemo={removeMemo}
          />
        )}
      </SafeAreaView>

      <BottomTabBar
        active={tab}
        onTab={setTab}
        onAdd={() => navigation.navigate('AddItem')}
      />
    </View>
  );
};

// ─── スタイル ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // ── タブバー
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: A.line,
    paddingTop: 11,
  },
  tabItem: {
    flex: 1, alignItems: 'center', gap: 5,
  },
  tabLabel: { fontSize: 12, color: A.muted, fontWeight: '500', letterSpacing: 0.2 },
  tabLabelActive: { color: A.accent, fontWeight: '700' },
  tabCenter: { flex: 1, alignItems: 'center', gap: 5 },
  centerBtn: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: A.accent, marginTop: -6,
    alignItems: 'center', justifyContent: 'center',
  },
  centerLabel: { fontSize: 12, color: A.muted, fontWeight: '600', letterSpacing: 0.2 },

  // ── レジヘッダー
  headerArea: { paddingHorizontal: 24, paddingTop: 20 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  totalLabel: { fontSize: 14, color: A.muted, fontWeight: '600', letterSpacing: 1.4 },
  totalAmountRow: {
    flexDirection: 'row', alignItems: 'baseline', marginTop: 8,
  },
  totalValue: {
    fontSize: 58, fontWeight: '700', color: A.ink,
    letterSpacing: -2.6, lineHeight: 66,
    fontVariant: ['tabular-nums'] as any,
  },
  yenSign: { paddingRight: 5 },
  yenSignText: { fontSize: 33, fontWeight: '600', color: A.faint },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth, borderColor: A.line,
    backgroundColor: A.surface, alignItems: 'center', justifyContent: 'center', marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row', gap: 18, marginTop: 16, paddingBottom: 18,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: A.line,
  },
  stat: { fontSize: 15, color: A.muted },
  statBold: { color: A.ink, fontWeight: '700' },

  // ── 検索・ソート
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
  searchInput: { flex: 1, fontSize: 16, color: A.ink, padding: 0 },
  sortChip: {
    borderWidth: StyleSheet.hairlineWidth, borderColor: A.line,
    backgroundColor: A.surface, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  sortChipActive: { borderColor: A.accentLine, backgroundColor: A.accentSoft },
  sortChipText: { fontSize: 13.5, color: A.muted, fontWeight: '500' },
  sortChipTextActive: { color: A.accent, fontWeight: '700' },

  // ── リスト行
  listContent: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 16 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 8, paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: A.line,
  },
  rowInfo: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  itemName: { fontSize: 17.5, fontWeight: '600', color: A.ink, flexShrink: 1 },
  editHint: { marginLeft: 6 },
  rowMeta: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', alignItems: 'baseline', marginTop: 4 },
  itemPrice: { fontSize: 15, color: A.muted },
  itemRevenue: { fontSize: 14.5 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ctrlBtn: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  ctrlMinus: { borderWidth: StyleSheet.hairlineWidth, borderColor: A.line, backgroundColor: A.surface },
  ctrlPlus: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: A.accent,
  },
  ctrlCount: { minWidth: 38, height: 38, paddingHorizontal: 4, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 21, fontWeight: '700', color: A.ink, fontVariant: ['tabular-nums'] as any },

  // ── 集計
  summaryScroll: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  pageTitle: { fontSize: 30, fontWeight: '700', color: A.ink, letterSpacing: -0.5, marginBottom: 18 },
  statsCards: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statsCard: {
    flex: 1, backgroundColor: A.surface,
    borderWidth: StyleSheet.hairlineWidth, borderColor: A.line,
    borderRadius: 18, padding: 16,
  },
  statsCardLabel: { fontSize: 13.5, color: A.muted, fontWeight: '600' },
  statsCardValue: {
    fontSize: 29, fontWeight: '700', color: A.ink,
    marginTop: 6, fontVariant: ['tabular-nums'] as any,
  },
  statsCardUnit: { fontSize: 15, color: A.faint, fontWeight: '600' },
  bestBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: A.accentSoft,
    borderWidth: StyleSheet.hairlineWidth, borderColor: A.accentLine,
    borderRadius: 18, padding: 14, marginBottom: 4,
  },
  bestText: { fontSize: 15, color: A.ink, flex: 1 },
  sectionLabel: {
    fontSize: 14.5, color: A.muted, fontWeight: '700',
    letterSpacing: 0.6, marginTop: 26, marginBottom: 6,
  },
  rankRow: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: A.line },
  rankHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 9 },
  rankName: { fontSize: 16.5, fontWeight: '600', color: A.ink, flex: 1, marginRight: 12 },
  rankRevenue: { fontSize: 16.5, fontWeight: '700', color: A.ink, fontVariant: ['tabular-nums'] as any },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barTrack: { flex: 1, height: 7, borderRadius: 3.5, backgroundColor: A.bg, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3.5, backgroundColor: A.accent },
  rankCount: { fontSize: 13.5, color: A.muted, fontVariant: ['tabular-nums'] as any, minWidth: 42, textAlign: 'right' },

  // ── メモ
  memoHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 20, paddingBottom: 4,
  },
  memoSubtitle: { fontSize: 14, color: A.muted, marginTop: -8 },
  memoAddBtn: {
    width: 46, height: 46, borderRadius: 14, backgroundColor: A.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  memoListContent: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 16 },
  memoCard: {
    backgroundColor: A.surface,
    borderWidth: StyleSheet.hairlineWidth, borderColor: A.line,
    borderRadius: 16, padding: 16, marginBottom: 10,
  },
  memoText: { fontSize: 16.5, color: A.ink, lineHeight: 24 },
  memoMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  memoDate: { fontSize: 13, color: A.faint, fontVariant: ['tabular-nums'] as any },
  memoInput: {
    width: '100%', minHeight: 96, borderWidth: 1, borderColor: A.line, borderRadius: 14,
    padding: 14, fontSize: 17, color: A.ink, marginTop: 14,
    textAlignVertical: 'top',
  },
  memoDeleteBtn: {
    width: 52, padding: 14, borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth, borderColor: A.accentLine,
    backgroundColor: A.accentSoft, alignItems: 'center', justifyContent: 'center',
  },

  // ── 空状態
  empty: { paddingTop: 64, paddingHorizontal: 24, alignItems: 'center' },
  emptyText: { fontSize: 16, color: A.faint, textAlign: 'center' },

  // ── モーダル
  overlayBg: {
    flex: 1, backgroundColor: 'rgba(34,28,24,0.32)',
    alignItems: 'center', justifyContent: 'center', padding: 28,
  },
  modalCard: { width: '100%', backgroundColor: A.surface, borderRadius: 24, padding: 24 },
  modalSmLabel: { fontSize: 14, color: A.muted, fontWeight: '600' },
  modalItemName: { fontSize: 19, fontWeight: '700', color: A.ink, marginTop: 4, marginBottom: 18 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: A.ink },
  modalBody: { fontSize: 16, color: A.muted, lineHeight: 25, marginTop: 10, marginBottom: 4 },
  modalBodyBold: { color: A.ink, fontWeight: '700' },
  modalNumInput: {
    width: '100%', borderWidth: 1, borderColor: A.line, borderRadius: 14,
    padding: 14, fontSize: 27, fontWeight: '700', color: A.ink, textAlign: 'center',
    fontVariant: ['tabular-nums'] as any,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  btnCancel: {
    flex: 1, padding: 14, borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth, borderColor: A.line,
    backgroundColor: A.surface, alignItems: 'center',
  },
  btnCancelText: { fontSize: 16.5, color: A.muted, fontWeight: '600' },
  btnAccent: { flex: 1, padding: 14, borderRadius: 13, backgroundColor: A.accent, alignItems: 'center' },
  btnAccentText: { fontSize: 16.5, color: '#fff', fontWeight: '700' },
});

export default MainScreen;
