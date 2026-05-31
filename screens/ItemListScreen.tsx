import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { 
  Dialog, 
  Portal, 
  Button as PaperButton, 
  Text as PaperText,
  FAB,
  IconButton,
  TextInput,
  Searchbar,
  Chip,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

interface Item {
  id: string;
  name: string;
  price: number;
  count: number;
}

interface ItemListScreenProps {
  navigation: any;
}

const ItemListScreen: React.FC<ItemListScreenProps> = ({ navigation }) => {
  const isFocused = useIsFocused();
  const [items, setItems] = useState<Item[]>([]);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [quickEditVisible, setQuickEditVisible] = useState(false);
  const [quickEditItem, setQuickEditItem] = useState<Item | null>(null);
  const [quickEditValue, setQuickEditValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'revenue'>('name');
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [resetDialogVisible, setResetDialogVisible] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);

  useEffect(() => {
    loadItems();
  }, [isFocused]);

  useEffect(() => {
    filterAndSortItems();
  }, [items, searchQuery, sortBy]);

  const filterAndSortItems = () => {
    let filtered = items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return b.price - a.price;
        case 'revenue':
          return (b.price * (b.count || 0)) - (a.price * (a.count || 0));
        default:
          return 0;
      }
    });

    setFilteredItems(filtered);
  };

  const loadItems = async () => {
    try {
      const data = await AsyncStorage.getItem('items');
      if (data) {
        const parsed = JSON.parse(data);
        setItems(parsed);
      }
    } catch (error) {
      console.error('データの読み込みエラー:', error);
    }
  };

  const saveItems = async (newItems: Item[]) => {
    try {
      setItems(newItems);
      await AsyncStorage.setItem('items', JSON.stringify(newItems));
    } catch (error) {
      console.error('データの保存エラー:', error);
    }
  };

  const increaseCount = (id: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, count: (item.count || 0) + 1 } : item
    );
    saveItems(updated);
  };

  const decreaseCount = (id: string) => {
    const updated = items.map((item) =>
      item.id === id && item.count > 0 ? { ...item, count: item.count - 1 } : item
    );
    saveItems(updated);
  };

  const deleteItem = async (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    await saveItems(updated);
  };

  const getTotal = () => {
    return items.reduce(
      (total, item) => total + (item.price * (item.count || 0)),
      0
    );
  };

  const getTotalItemsSold = () => {
    return items.reduce(
      (total, item) => total + (item.count || 0),
      0
    );
  };

  const confirmDeleteItem = (id: string) => {
    setDeleteTargetId(id);
    setDeleteDialogVisible(true);
  };

  const handleDeleteConfirmed = async () => {
    if (deleteTargetId) {
      await deleteItem(deleteTargetId);
      setDeleteDialogVisible(false);
      setDeleteTargetId(null);
    }
  };

  const openQuickEdit = (item: Item) => {
    setQuickEditItem(item);
    setQuickEditValue((item.count || 0).toString());
    setQuickEditVisible(true);
  };

  const handleQuickEditSave = async () => {
    if (!quickEditItem) return;
    
    const newCount = parseInt(quickEditValue, 10);
    if (isNaN(newCount) || newCount < 0) return;

    const updated = items.map((item) =>
      item.id === quickEditItem.id ? { ...item, count: newCount } : item
    );
    await saveItems(updated);
    setQuickEditVisible(false);
    setQuickEditItem(null);
  };

  const confirmResetAllCounts = () => {
    setResetDialogVisible(true);
  };

  const resetAllCounts = async () => {
    const updated = items.map(item => ({ ...item, count: 0 }));
    await saveItems(updated);
    setResetDialogVisible(false);
  };

  const toggleSearch = () => {
    setSearchExpanded(!searchExpanded);
    if (searchExpanded && searchQuery) {
      setSearchQuery('');
    }
  };

  const renderItem = ({ item, index }: { item: Item; index: number }) => (
    <TouchableOpacity
      style={styles.itemCard}
      activeOpacity={0.8}
    >
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <PaperText style={styles.itemName} numberOfLines={1}>
              {item.name}
            </PaperText>
            <PaperText style={styles.itemPrice}>
              ¥{item.price.toLocaleString()}
            </PaperText>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => navigation.navigate('ItemDetail', { item, index })}
            >
              <IconButton
                icon="pencil"
                size={16}
                iconColor="#667eea"
                style={styles.actionIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => confirmDeleteItem(item.id)}
            >
              <IconButton
                icon="delete"
                size={16}
                iconColor="#ef4444"
                style={styles.actionIcon}
              />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.statsAndControls}>
          <View style={styles.itemStatsCompact}>
            <View style={styles.statItem}>
              <View style={styles.statBadge}>
                <PaperText style={styles.statLabelCompact}>販売</PaperText>
                <PaperText style={styles.statValueCompact}>{item.count || 0}</PaperText>
              </View>
            </View>
            <View style={styles.statItem}>
              <View style={styles.revenueBadge}>
                <PaperText style={styles.statLabelCompact}>売上</PaperText>
                <PaperText style={styles.revenueValueCompact}>
                  ¥{(item.price * (item.count || 0)).toLocaleString()}
                </PaperText>
              </View>
            </View>
          </View>

          <View style={styles.quantityControlsCompact}>
            <TouchableOpacity
              style={[styles.quantityButton, styles.decreaseButton]}
              onPress={() => decreaseCount(item.id)}
              disabled={item.count === 0}
            >
              <IconButton
                icon="minus"
                size={18}
                iconColor="#f59e0b"
                style={styles.quantityIcon}
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quantityDisplay}
              onPress={() => openQuickEdit(item)}
            >
              <PaperText style={styles.quantityText}>{item.count || 0}</PaperText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quantityButton, styles.increaseButton]}
              onPress={() => increaseCount(item.id)}
            >
              <IconButton
                icon="plus"
                size={18}
                iconColor="#10b981"
                style={styles.quantityIcon}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <IconButton
          icon="package-variant"
          size={64}
          iconColor="#e2e8f0"
          style={styles.emptyIcon}
        />
      </View>
      <PaperText style={styles.emptyTitle}>商品がありません</PaperText>
      <PaperText style={styles.emptySubtitle}>
        「+」ボタンから商品を登録してください
      </PaperText>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.totalContainer}>
            <View style={styles.totalHeader}>
              <View style={styles.leftSection}>
                <View style={styles.trendIconContainer}>
                  <IconButton
                    icon="trending-up"
                    size={22}
                    iconColor="#10b981"
                    style={styles.trendIcon}
                  />
                </View>
                <PaperText style={styles.totalLabel}>本日の売上</PaperText>
              </View>
              <TouchableOpacity
                style={styles.resetButtonContainer}
                onPress={confirmResetAllCounts}
              >
                <IconButton
                  icon="refresh"
                  size={20}
                  iconColor="#ef4444"
                  style={styles.resetIcon}
                />
              </TouchableOpacity>
            </View>
            <PaperText style={styles.totalValue}>
              ¥{getTotal().toLocaleString()}
            </PaperText>
            <View style={styles.totalBadge}>
              <PaperText style={styles.badgeText}>
                {getTotalItemsSold()}個 販売済み
              </PaperText>
            </View>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchHeader}>
            <TouchableOpacity 
              style={[styles.searchIconButton, searchExpanded && styles.searchIconButtonActive]}
              onPress={toggleSearch}
            >
              <IconButton
                icon={searchExpanded ? "close" : "magnify"}
                size={20}
                iconColor="#ffffff"
                style={styles.searchIcon}
              />
            </TouchableOpacity>

            <View style={styles.sortChipsCompact}>
              <TouchableOpacity
                style={[styles.sortChip, sortBy === 'name' && styles.selectedChip]}
                onPress={() => setSortBy('name')}
              >
                <PaperText style={[styles.chipText, sortBy === 'name' && styles.selectedChipText]}>
                  名前
                </PaperText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortChip, sortBy === 'price' && styles.selectedChip]}
                onPress={() => setSortBy('price')}
              >
                <PaperText style={[styles.chipText, sortBy === 'price' && styles.selectedChipText]}>
                  価格
                </PaperText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortChip, sortBy === 'revenue' && styles.selectedChip]}
                onPress={() => setSortBy('revenue')}
              >
                <PaperText style={[styles.chipText, sortBy === 'revenue' && styles.selectedChipText]}>
                  売上
                </PaperText>
              </TouchableOpacity>
            </View>
          </View>

          {searchExpanded && (
            <View style={styles.searchBarContainer}>
              <Searchbar
                placeholder="商品を検索..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
                inputStyle={styles.searchInput}
                iconColor="#667eea"
                autoFocus
                onBlur={() => {
                  if (!searchQuery) {
                    setSearchExpanded(false);
                  }
                }}
              />
            </View>
          )}
        </View>

        <View style={styles.listContainer}>
          {filteredItems.length === 0 ? (
            searchQuery ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <IconButton
                    icon="magnify"
                    size={64}
                    iconColor="#e2e8f0"
                    style={styles.emptyIcon}
                  />
                </View>
                <PaperText style={styles.emptyTitle}>検索結果がありません</PaperText>
                <PaperText style={styles.emptySubtitle}>
                  別のキーワードで検索してみてください
                </PaperText>
              </View>
            ) : (
              <EmptyState />
            )
          ) : (
            <FlatList
              data={filteredItems}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => navigation.navigate('AddItem')}
          color="#667eea"
        />

        <Portal>
          <Dialog 
            visible={deleteDialogVisible} 
            onDismiss={() => setDeleteDialogVisible(false)}
            style={styles.dialog}
          >
            <Dialog.Title style={styles.dialogTitle}>削除の確認</Dialog.Title>
            <Dialog.Content>
              <PaperText style={styles.dialogContent}>
                この商品を削除してもよろしいですか？
              </PaperText>
            </Dialog.Content>
            <Dialog.Actions style={styles.dialogActions}>
              <PaperButton 
                onPress={() => setDeleteDialogVisible(false)}
                textColor="#64748b"
                labelStyle={styles.dialogButtonLabel}
                style={styles.cancelDialogButton}
              >
                キャンセル
              </PaperButton>
              <PaperButton 
                onPress={handleDeleteConfirmed} 
                textColor="#ef4444"
                style={styles.deleteConfirmButton}
                labelStyle={styles.dialogButtonLabel}
              >
                削除
              </PaperButton>
            </Dialog.Actions>
          </Dialog>

          <Dialog 
            visible={resetDialogVisible} 
            onDismiss={() => setResetDialogVisible(false)}
            style={styles.dialog}
          >
            <Dialog.Title>
              <View style={styles.resetDialogTitleContainer}>
                <View style={styles.warningIconContainer}>
                  <IconButton
                    icon="alert"
                    size={24}
                    iconColor="#f59e0b"
                    style={styles.warningIcon}
                  />
                </View>
                <PaperText style={styles.resetDialogTitle}>売上リセットの確認</PaperText>
              </View>
            </Dialog.Title>
            <Dialog.Content>
              <PaperText style={styles.dialogContent}>
                全商品の販売数をリセットしますか？
              </PaperText>
              <View style={styles.resetSummary}>
                <View style={styles.summaryRow}>
                  <PaperText style={styles.summaryLabel}>現在の総売上:</PaperText>
                  <PaperText style={styles.summaryValue}>¥{getTotal().toLocaleString()}</PaperText>
                </View>
                <View style={styles.summaryRow}>
                  <PaperText style={styles.summaryLabel}>総販売数:</PaperText>
                  <PaperText style={styles.summaryValue}>{getTotalItemsSold()}個</PaperText>
                </View>
              </View>
              <View style={styles.warningContainer}>
                <PaperText style={styles.warningText}>
                  ⚠️ この操作は取り消せません
                </PaperText>
              </View>
            </Dialog.Content>
            <Dialog.Actions style={styles.dialogActions}>
              <PaperButton 
                onPress={() => setResetDialogVisible(false)}
                textColor="#64748b"
                labelStyle={styles.dialogButtonLabel}
                style={styles.cancelDialogButton}
              >
                キャンセル
              </PaperButton>
              <PaperButton 
                onPress={resetAllCounts} 
                textColor="#f59e0b"
                style={styles.resetConfirmButton}
                labelStyle={styles.dialogButtonLabel}
                icon="refresh"
              >
                リセット実行
              </PaperButton>
            </Dialog.Actions>
          </Dialog>

          <Dialog 
            visible={quickEditVisible} 
            onDismiss={() => setQuickEditVisible(false)}
            style={styles.dialog}
          >
            <Dialog.Title style={styles.dialogTitle}>数量を変更</Dialog.Title>
            <Dialog.Content>
              <PaperText style={styles.dialogSubtitle}>
                {quickEditItem?.name}
              </PaperText>
              <TextInput
                label="販売数"
                mode="outlined"
                value={quickEditValue}
                onChangeText={setQuickEditValue}
                keyboardType="numeric"
                style={styles.quickEditInput}
                theme={{
                  colors: {
                    primary: '#667eea',
                    background: 'white',
                  }
                }}
                autoFocus
              />
            </Dialog.Content>
            <Dialog.Actions style={styles.dialogActions}>
              <PaperButton 
                onPress={() => setQuickEditVisible(false)}
                textColor="#64748b"
                labelStyle={styles.dialogButtonLabel}
                style={styles.cancelDialogButton}
              >
                キャンセル
              </PaperButton>
              <PaperButton 
                onPress={handleQuickEditSave} 
                textColor="#667eea"
                style={styles.saveButton}
                labelStyle={styles.dialogButtonLabel}
              >
                保存
              </PaperButton>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </LinearGradient>
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
  header: {
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 20,
  },
  totalContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  totalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    width: '100%',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  trendIconContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 4,
    marginRight: 8,
  },
  trendIcon: {
    margin: 0,
  },
  totalLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  resetButtonContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    shadowColor: '#ef4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  resetIcon: {
    margin: 0,
  },
  totalValue: {
    fontSize: 40,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -1,
  },
  totalBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#10b981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchIconButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  searchIconButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  searchIcon: {
    margin: 0,
  },
  sortChipsCompact: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  sortChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectedChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  chipText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  selectedChipText: {
    color: '#667eea',
  },
  searchBarContainer: {
    marginTop: 12,
  },
  searchBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderRadius: 12,
  },
  searchInput: {
    fontSize: 16,
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    paddingTop: 8,
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  itemContent: {
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    borderRadius: 10,
    padding: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  editButton: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  actionIcon: {
    margin: 0,
    width: 32,
    height: 32,
  },
  statsAndControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemStatsCompact: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statBadge: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  revenueBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  statLabelCompact: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 2,
  },
  statValueCompact: {
    fontSize: 16,
    fontWeight: '700',
    color: '#667eea',
  },
  revenueValueCompact: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  quantityControlsCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  decreaseButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  increaseButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  quantityIcon: {
    margin: 0,
    width: 36,
    height: 36,
  },
  quantityDisplay: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 48,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    borderStyle: 'dashed',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#667eea',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: 'white',
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    backgroundColor: 'rgba(226, 232, 240, 0.1)',
    borderRadius: 32,
    padding: 16,
    marginBottom: 16,
  },
  emptyIcon: {
    margin: 0,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
  },
  dialog: {
    borderRadius: 20,
    backgroundColor: 'white',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  dialogTitle: {
    color: '#1f2937',
    fontSize: 20,
    fontWeight: '700',
  },
  dialogContent: {
    color: '#6b7280',
    fontSize: 16,
    lineHeight: 24,
  },
  dialogSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  dialogActions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  cancelDialogButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 4,
  },
  deleteConfirmButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    paddingVertical: 4,
    elevation: 2,
    shadowColor: '#ef4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  saveButton: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 12,
    paddingVertical: 4,
    elevation: 2,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  dialogButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  resetDialogTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetDialogTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 8,
  },
  warningIconContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 4,
  },
  warningIcon: {
    margin: 0,
  },
  resetSummary: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '700',
  },
  warningContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  warningText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    fontWeight: '600',
  },
  resetConfirmButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    paddingVertical: 4,
    elevation: 2,
    shadowColor: '#f59e0b',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  quickEditInput: {
    backgroundColor: 'white',
    marginTop: 16,
    borderRadius: 12,
  },
});

export default ItemListScreen;