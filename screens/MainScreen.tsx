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
import { useFocusRing } from '../hooks/useFocusRing';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

const A = {
  bg: '#F4F6FB',
  surface: '#FFFFFF',
  line: '#E3E8F1',
  field: '#EAEEF6',
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
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function BottomTabBar({ active, onTab }: {
  active: Tab; onTab: (t: Tab) => void;
}) {
  const insets = useSafeAreaInsets();

  // 現在地のタブ＝淡いアクセント円＋アクセントのアイコン/ラベル、非アクティブ＝アウトライン＋ミュート
  const renderTab = (id: Tab, label: string, iconOn: IconName, iconOff: IconName) => {
    const isActive = active === id;
    return (
      <TouchableOpacity style={s.tabItem} onPress={() => onTab(id)} activeOpacity={0.7}>
        <View style={[s.tabIcon, isActive && s.tabIconActive]}>
          <MaterialCommunityIcons
            name={isActive ? iconOn : iconOff}
            size={22}
            color={isActive ? A.accent : A.faint}
          />
        </View>
        <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[s.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {renderTab('register', 'レジ', 'receipt-text', 'receipt-text-outline')}
      {renderTab('summary', '集計', 'chart-box', 'chart-box-outline')}
      {renderTab('memo', 'メモ', 'hand-heart', 'hand-heart-outline')}
    </View>
  );
}

// ─── レジタブ ──────────────────────────────────────────────────────────────────
function RegisterTab({ items, inc, dec, setCount, openEdit, onAdd, onReorder, onDelete }: {
  items: Item[];
  inc: (id: string) => void;
  dec: (id: string) => void;
  setCount: (id: string, n: number) => void;
  openEdit: (item: Item) => void;
  onAdd: () => void;
  onReorder: (items: Item[]) => void;
  onDelete: (id: string) => void;
}) {
  const searchField = useIMEField('');
  const searchQuery = searchField.value;
  const searchFocus = useFocusRing();
  const quickFocus = useFocusRing();
  const [quickEdit, setQuickEdit] = useState<Item | null>(null);
  const [quickEditValue, setQuickEditValue] = useState('');

  const total = items.reduce((s, i) => s + i.price * (i.count || 0), 0);
  const units = items.reduce((s, i) => s + (i.count || 0), 0);

  const list = searchQuery
    ? items.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : items;

  // drag を渡すと長押しで並び替え可能になる（検索中は drag なし）
  const renderRow = (item: Item, drag?: () => void, isActive?: boolean) => (
    <View style={[s.row, isActive && s.rowActive]}>
      <TouchableOpacity
        style={s.rowInfo}
        onPress={() => openEdit(item)}
        onLongPress={drag}
        delayLongPress={180}
        disabled={isActive}
        activeOpacity={0.6}
      >
        <View style={s.nameRow}>
          {drag && <MaterialCommunityIcons name="drag-horizontal-variant" size={16} color={A.faint} style={s.dragHandle} />}
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

  // 左スワイプで右側に出る削除ボタン
  const renderRightActions = (item: Item) => () => (
    <TouchableOpacity style={s.swipeDelete} onPress={() => onDelete(item.id)} activeOpacity={0.85}>
      <MaterialCommunityIcons name="trash-can-outline" size={22} color="#fff" />
      <Text style={s.swipeDeleteText}>削除</Text>
    </TouchableOpacity>
  );

  const emptyComponent = (
    <View style={s.empty}>
      <Text style={s.emptyText}>
        {searchQuery ? '該当する商品がありません' : '商品がまだ登録されていません'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity style={s.emptyCta} onPress={onAdd} activeOpacity={0.85}>
          <MaterialCommunityIcons name="plus" size={18} color="#fff" />
          <Text style={s.emptyCtaText}>商品を登録</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {/* 売上ヘッダー */}
      <View style={s.headerArea}>
        <View style={s.screenHeader}>
          <View style={{ flex: 1 }}>
            <Text style={s.totalLabel}>本日の売上</Text>
            <View style={s.totalAmountRow}>
              <View style={s.yenSign}>
                <Text style={s.yenSignText}>¥</Text>
              </View>
              <Text style={s.totalValue}>{num(total)}</Text>
            </View>
          </View>
          <TouchableOpacity style={s.headerPill} onPress={onAdd} activeOpacity={0.7}>
            <MaterialCommunityIcons name="tag-plus-outline" size={17} color={A.accent} />
            <Text style={s.headerPillText}>商品登録</Text>
          </TouchableOpacity>
        </View>
        <View style={s.statsRow}>
          <Text style={s.stat}>販売 <Text style={s.statBold}>{units}</Text> 点</Text>
          <Text style={s.stat}>商品 <Text style={s.statBold}>{items.length}</Text> 種</Text>
        </View>
      </View>

      {/* 検索 */}
      <View style={s.toolArea}>
        <View style={[s.searchBox, searchFocus.focused && s.fieldFocused]}>
          <MaterialCommunityIcons name="magnify" size={19} color={searchFocus.focused ? A.accent : A.muted} />
          <IMETextInput
            defaultValue={searchField.initial}
            onChangeText={searchField.onChangeText}
            onEndEditing={searchField.commit}
            onSubmitEditing={searchField.commit}
            onFocus={searchFocus.onFocus}
            onBlur={searchFocus.onBlur}
            returnKeyType="search"
            placeholder="商品を検索"
            placeholderTextColor={A.faint}
            style={s.searchInput}
          />
        </View>
      </View>

      {/* 商品リスト：通常は長押しドラッグで並び替え、検索中は固定 */}
      {searchQuery ? (
        <FlatList
          style={s.list}
          data={list}
          keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <ReanimatedSwipeable
              renderRightActions={renderRightActions(item)}
              overshootRight={false}
              rightThreshold={40}
            >
              {renderRow(item)}
            </ReanimatedSwipeable>
          )}
          contentContainerStyle={s.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={emptyComponent}
        />
      ) : (
        <DraggableFlatList
          style={s.list}
          containerStyle={s.list}
          data={items}
          keyExtractor={i => i.id}
          onDragEnd={({ data }) => onReorder(data)}
          renderItem={({ item, drag, isActive }) => (
            <ScaleDecorator activeScale={1.03}>
              <ReanimatedSwipeable
                renderRightActions={renderRightActions(item)}
                overshootRight={false}
                rightThreshold={40}
                enabled={!isActive}
              >
                {renderRow(item, drag, isActive)}
              </ReanimatedSwipeable>
            </ScaleDecorator>
          )}
          contentContainerStyle={s.listContent}
          ListEmptyComponent={emptyComponent}
        />
      )}

      {/* 数量変更モーダル */}
      <HakModal visible={!!quickEdit} onClose={() => setQuickEdit(null)}>
        <Text style={s.modalSmLabel}>数量を変更</Text>
        <Text style={s.modalItemName}>{quickEdit?.name}</Text>
        <TextInput
          value={quickEditValue}
          onChangeText={v => setQuickEditValue(v.replace(/[^0-9]/g, ''))}
          onFocus={quickFocus.onFocus}
          onBlur={quickFocus.onBlur}
          keyboardType="numeric"
          style={[s.modalNumInput, quickFocus.focused && s.fieldFocused]}
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
    </View>
  );
}

// ─── 集計タブ ──────────────────────────────────────────────────────────────────
function SummaryTab({ items, resetCounts }: { items: Item[]; resetCounts: () => void }) {
  const [sortBy, setSortBy] = useState<'revenue' | 'count'>('revenue');
  const [confirmReset, setConfirmReset] = useState(false);
  const withRev = items.map(i => ({ ...i, rev: i.price * (i.count || 0) }));
  const ranked = [...withRev].sort((a, b) =>
    sortBy === 'revenue' ? b.rev - a.rev : (b.count || 0) - (a.count || 0)
  );
  const maxRev = Math.max(1, ...withRev.map(r => r.rev));
  const maxCount = Math.max(1, ...withRev.map(r => r.count || 0));
  const total = withRev.reduce((s, r) => s + r.rev, 0);
  const units = withRev.reduce((s, r) => s + (r.count || 0), 0);
  const best = [...withRev].sort((a, b) => b.rev - a.rev)[0]; // ベストセラーは売上基準で固定

  return (
    <ScrollView contentContainerStyle={s.summaryScroll} showsVerticalScrollIndicator={false}>
      <View style={[s.screenHeader, { marginBottom: 18 }]}>
        <Text style={[s.pageTitle, { marginBottom: 0 }]}>集計</Text>
        <TouchableOpacity style={s.headerPill} onPress={() => setConfirmReset(true)} activeOpacity={0.7}>
          <MaterialCommunityIcons name="refresh" size={17} color={A.accent} />
          <Text style={s.headerPillText}>リセット</Text>
        </TouchableOpacity>
      </View>

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

      {/* 商品別ランキング（売上順／個数順を切替） */}
      <View style={[s.sortRow, { marginTop: 26, marginBottom: 10 }]}>
        <Text style={s.sortLabel}>商品別</Text>
        <View style={s.sortSegment}>
          {(['revenue', 'count'] as const).map(sv => (
            <TouchableOpacity
              key={sv}
              style={[s.sortSeg, sortBy === sv && s.sortSegActive]}
              onPress={() => setSortBy(sv)}
              activeOpacity={0.7}
            >
              <Text style={[s.sortSegText, sortBy === sv && s.sortSegTextActive]}>
                {sv === 'revenue' ? '売上順' : '個数順'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {ranked.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyText}>販売データがありません</Text>
        </View>
      ) : ranked.map(r => {
        const metric = sortBy === 'revenue' ? r.rev : (r.count || 0);
        const maxMetric = sortBy === 'revenue' ? maxRev : maxCount;
        return (
          <View key={r.id} style={s.rankRow}>
            <View style={s.rankHeader}>
              <Text style={s.rankName} numberOfLines={1}>{r.name}</Text>
              <Text style={s.rankRevenue}>{yen(r.rev)}</Text>
            </View>
            <View style={s.barRow}>
              <View style={s.barTrack}>
                <View style={[s.barFill, { width: `${(metric / maxMetric) * 100}%` as any }]} />
              </View>
              <Text style={s.rankCount}>{r.count}点</Text>
            </View>
          </View>
        );
      })}

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
  const [confirmDel, setConfirmDel] = useState(false);
  const memoFocus = useFocusRing();
  // 打鍵ごとの再描画（=IME中断・一覧のカクつき）を避けるため draft は ref で保持
  const draftRef = React.useRef('');

  const openNew = () => { draftRef.current = ''; setConfirmDel(false); setEditing(null); setIsNew(true); };
  const openEdit = (m: Memo) => { draftRef.current = m.text; setConfirmDel(false); setEditing(m); setIsNew(false); };
  const close = () => { draftRef.current = ''; setConfirmDel(false); setEditing(null); setIsNew(false); };

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
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={[s.pageTitle, { marginBottom: 4 }]}>寄贈・交換メモ</Text>
          <Text style={s.memoSubtitle}>お渡しした本や交換の記録を残せます</Text>
        </View>
        <TouchableOpacity style={s.headerPill} onPress={openNew} activeOpacity={0.7}>
          <MaterialCommunityIcons name="note-plus-outline" size={17} color={A.accent} />
          <Text style={s.headerPillText}>メモ追加</Text>
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
        {confirmDel && editing ? (
          <>
            <Text style={s.modalTitle}>メモを削除</Text>
            <Text style={s.modalBody}>このメモを削除します。この操作は取り消せません。</Text>
            <View style={s.modalActions}>
              <TouchableOpacity style={s.btnCancel} onPress={() => setConfirmDel(false)}>
                <Text style={s.btnCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnAccent} onPress={() => { removeMemo(editing.id); close(); }}>
                <Text style={s.btnAccentText}>削除</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={s.modalTitle}>{editing ? 'メモを編集' : 'メモを追加'}</Text>
            <TextInput
              key={editing ? editing.id : 'new'}
              defaultValue={editing ? editing.text : ''}
              onChangeText={t => { draftRef.current = t; }}
              onFocus={memoFocus.onFocus}
              onBlur={memoFocus.onBlur}
              placeholder="例：◯◯さんに新刊を1冊寄贈／△△と既刊を交換"
              placeholderTextColor={A.faint}
              style={[s.memoInput, memoFocus.focused && s.fieldFocused]}
              multiline
              autoFocus
            />
            <View style={s.modalActions}>
              {editing ? (
                <TouchableOpacity style={s.memoDeleteBtn} onPress={() => setConfirmDel(true)}>
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
          </>
        )}
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
  const deleteItem = (id: string) =>
    saveItems(items.filter(i => i.id !== id));

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
            openEdit={openEdit}
            onAdd={() => navigation.navigate('AddItem')}
            onReorder={saveItems}
            onDelete={deleteItem}
          />
        )}
        {tab === 'summary' && <SummaryTab items={items} resetCounts={resetCounts} />}
        {tab === 'memo' && (
          <MemoTab
            memos={memos}
            addMemo={addMemo}
            updateMemo={updateMemo}
            removeMemo={removeMemo}
          />
        )}
      </SafeAreaView>

      <BottomTabBar active={tab} onTab={setTab} />
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
  tabIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  tabIconActive: { backgroundColor: A.accentSoft },
  tabLabel: { fontSize: 12, color: A.muted, fontWeight: '500', letterSpacing: 0.2 },
  tabLabelActive: { color: A.accent, fontWeight: '700' },

  // ── 各画面共通のヘッダー行（右上にアクションピルを同じ位置で固定）
  screenHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },

  // ── レジヘッダー
  headerArea: { paddingHorizontal: 24, paddingTop: 20 },
  totalLabel: { fontSize: 13, color: A.muted, fontWeight: '700', letterSpacing: 1.6 },
  totalAmountRow: {
    flexDirection: 'row', alignItems: 'baseline', marginTop: 6,
  },
  totalValue: {
    fontSize: 58, fontWeight: '700', color: A.ink,
    letterSpacing: -2.6, lineHeight: 66,
    fontVariant: ['tabular-nums'] as any,
  },
  yenSign: { paddingRight: 5 },
  yenSignText: { fontSize: 33, fontWeight: '600', color: A.faint },
  // 各ヘッダーの「追加」アクション（リセットと同じピル：アイコン＋ラベル）
  headerPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth, borderColor: A.accentLine,
    backgroundColor: A.accentSoft,
  },
  headerPillText: { fontSize: 14, fontWeight: '700', color: A.accent },
  statsRow: {
    flexDirection: 'row', gap: 18, marginTop: 16, paddingBottom: 18,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: A.line,
  },
  stat: { fontSize: 15, color: A.muted },
  statBold: { color: A.ink, fontWeight: '700' },

  // ── 検索・並び替え
  toolArea: {
    paddingHorizontal: 24, paddingTop: 14, paddingBottom: 12, gap: 12,
  },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: A.field,
    borderWidth: 1.5, borderColor: 'transparent',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
  },
  fieldFocused: { borderColor: A.accent, backgroundColor: A.accentSoft },
  searchInput: { flex: 1, fontSize: 16, color: A.ink, padding: 0 },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sortLabel: { fontSize: 13, color: A.muted, fontWeight: '600' },
  sortSegment: {
    flex: 1, flexDirection: 'row',
    backgroundColor: A.field, borderRadius: 12, padding: 3,
  },
  sortSeg: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  sortSegActive: { backgroundColor: A.surface },
  sortSegText: { fontSize: 13.5, color: A.muted, fontWeight: '600' },
  sortSegTextActive: { color: A.accent, fontWeight: '700' },

  // ── リスト行
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 28 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 8, paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: A.line,
    backgroundColor: A.bg,
  },
  rowActive: {
    backgroundColor: A.surface, borderRadius: 14, borderBottomColor: 'transparent',
  },
  swipeDelete: {
    width: 84, backgroundColor: '#E5484D',
    alignItems: 'center', justifyContent: 'center', gap: 3,
  },
  swipeDeleteText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  rowInfo: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  dragHandle: { marginRight: 6 },
  itemName: { fontSize: 19.5, fontWeight: '600', color: A.ink, flexShrink: 1 },
  editHint: { marginLeft: 6 },
  rowMeta: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', alignItems: 'baseline', marginTop: 5 },
  itemPrice: { fontSize: 16, color: A.muted },
  itemRevenue: { fontSize: 15.5 },
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 24, paddingTop: 20, paddingBottom: 6,
  },
  memoSubtitle: { fontSize: 14, color: A.muted },
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
    width: '100%', minHeight: 96, borderWidth: 1.5, borderColor: A.line, borderRadius: 14,
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
  emptyCta: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 18, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 14, backgroundColor: A.accent,
  },
  emptyCtaText: { fontSize: 15, color: '#fff', fontWeight: '700' },

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
    width: '100%', borderWidth: 1.5, borderColor: A.line, borderRadius: 14,
    padding: 14, fontSize: 27, fontWeight: '700', color: A.ink, textAlign: 'center',
    fontVariant: ['tabular-nums'] as any,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  btnCancel: {
    flex: 1, padding: 14, borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth, borderColor: A.line,
    backgroundColor: A.surface, alignItems: 'center', justifyContent: 'center',
  },
  btnCancelText: { fontSize: 16.5, color: A.muted, fontWeight: '600' },
  btnAccent: { flex: 1, padding: 14, borderRadius: 13, backgroundColor: A.accent, alignItems: 'center', justifyContent: 'center' },
  btnAccentText: { fontSize: 16.5, color: '#fff', fontWeight: '700' },
});

export default MainScreen;
