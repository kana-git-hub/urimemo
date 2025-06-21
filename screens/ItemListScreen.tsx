import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Animated,
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

  useEffect(() => {
    loadItems();
  }, [isFocused]);

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

  const renderItem = ({ item, index }: { item: Item; index: number }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => navigation.navigate('ItemDetail', { item, index })}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <View style={styles.itemInfo}>
          <PaperText style={styles.itemName} numberOfLines={1}>
            {item.name}
          </PaperText>
          <PaperText style={styles.itemPrice}>
            ¥{item.price.toLocaleString()}
          </PaperText>
        </View>
        
        <View style={styles.itemStats}>
          <View style={styles.statRow}>
            <PaperText style={styles.statLabel}>販売数</PaperText>
            <PaperText style={styles.statValue}>{item.count || 0}</PaperText>
          </View>
          <View style={styles.statRow}>
            <PaperText style={styles.statLabel}>売上</PaperText>
            <PaperText style={styles.revenueValue}>
              ¥{(item.price * (item.count || 0)).toLocaleString()}
            </PaperText>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <IconButton
            icon="plus"
            mode="contained"
            onPress={() => increaseCount(item.id)}
            style={styles.actionButton}
            iconColor="#4caf50"
          />
          <IconButton
            icon="minus"
            mode="contained"
            onPress={() => decreaseCount(item.id)}
            style={styles.actionButton}
            iconColor="#ff9800"
          />
          <IconButton
            icon="delete"
            mode="contained"
            onPress={() => confirmDeleteItem(item.id)}
            style={[styles.actionButton, styles.deleteButton]}
            iconColor="white"
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
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
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.totalContainer}>
            <PaperText style={styles.totalLabel}>本日の売上</PaperText>
            <PaperText style={styles.totalValue}>
              ¥{getTotal().toLocaleString()}
            </PaperText>
          </View>
        </View>

        <View style={styles.listContainer}>
          {items.length === 0 ? (
            <EmptyState />
          ) : (
            <FlatList
              data={items}
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
          color="white"
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
              >
                キャンセル
              </PaperButton>
              <PaperButton 
                onPress={handleDeleteConfirmed} 
                textColor="#f44336"
                style={styles.deleteConfirmButton}
                labelStyle={styles.dialogButtonLabel}
              >
                削除
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  totalContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  totalLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
  },
  listContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  itemContent: {
    padding: 16,
  },
  itemInfo: {
    marginBottom: 12,
  },
  itemName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    color: '#64748b',
  },
  itemStats: {
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 20,
    color: '#64748b',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '600',
    color: '#667eea',
  },
  revenueValue: {
    fontSize: 22,
    fontWeight: '600',
    color: '#4caf50',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 12,
    margin: 0,
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: '#667eea',
    borderRadius: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 20,
    color: '#94a3b8',
    textAlign: 'center',
  },
  dialog: {
    borderRadius: 16,
  },
  dialogTitle: {
    color: '#2c3e50',
  },
  dialogContent: {
    color: '#64748b',
    fontSize: 16,
  },
  dialogActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  deleteConfirmButton: {
    marginLeft: 8,
  },
  dialogButtonLabel: {
    fontSize: 18,
  },
});

export default ItemListScreen;