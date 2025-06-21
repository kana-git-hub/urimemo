import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { Appbar, Dialog, Portal, Button as PaperButton, Card, Text as PaperText } from 'react-native-paper';

export default function ItemListScreen({ navigation }) {
  const isFocused = useIsFocused();
  const [items, setItems] = useState([]);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  useEffect(() => {
    loadItems();
  }, [isFocused]);

  const loadItems = async () => {
    const data = await AsyncStorage.getItem('items');
    console.log('ストレージから読み込んだデータ:', data); // デバッグ用
    if (data) {
      const parsed = JSON.parse(data);
      console.log('パースしたアイテム数:', parsed.length); // デバッグ用
      setItems(parsed);
    }
  };

  const saveItems = async (newItems) => {
    setItems(newItems);
    await AsyncStorage.setItem('items', JSON.stringify(newItems));
  };

  const increaseCount = (id) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, count: (item.count || 0) + 1 } : item
    );
    saveItems(updated);
  };

  const decreaseCount = (id) => {
    const updated = items.map((item) =>
      item.id === id && item.count > 0 ? { ...item, count: item.count - 1 } : item
    );
    saveItems(updated);
  };

  const deleteItem = async (id) => {
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
    await AsyncStorage.setItem('items', JSON.stringify(updated));
  };

  const getTotal = () => {
    return items.reduce(
      (total, item) => total + (item.price * (item.count || 0)),
      0
    );
  };

  const confirmDeleteItem = (id) => {
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

  const renderItem = ({ item, index }) => (
    <Card style={{ width: '98%', marginHorizontal: '1%', marginVertical: 10, borderRadius: 16, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 1, backgroundColor: '#fff' }} onPress={() => navigation.navigate('ItemDetail', { item, index })}>
      <Card.Content style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 16 }}>
        <View style={{ flex: 2, justifyContent: 'flex-start', minWidth: 0, marginRight: 12 }}>
          <PaperText variant="titleLarge" style={[styles.itemText, { marginBottom: 8, flexShrink: 1 }]} numberOfLines={1} ellipsizeMode="tail">{item.name}</PaperText>
          <View style={{ minHeight: 60, marginBottom: 8, justifyContent: 'center' }}>
            <View style={{ alignItems: 'flex-start', justifyContent: 'center', width: '100%' }}>
              <PaperText style={{ fontSize: 22, fontWeight: 'bold', color: '#388e3c', marginBottom: 2, textAlign: 'left', width: '100%' }}>売上: ¥{(item.price * (item.count || 0)).toLocaleString()}</PaperText>
              <PaperText style={{ fontSize: 22, fontWeight: 'bold', color: '#1976d2', textAlign: 'left', width: '100%' }}>販売数: {item.count || 0}</PaperText>
            </View>
            <View>
              <PaperText style={{ fontSize: 12, color: '#888', textAlign: 'left', width: '100%' }}>単価: ¥{item.price.toLocaleString()}</PaperText>
            </View>
          </View>
        </View>
        <View style={[styles.buttons, { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', marginLeft: 8, minWidth: 0, justifyContent: 'center', flexWrap: 'wrap' }]}> 
          <PaperButton mode="contained-tonal" icon="plus" onPress={() => increaseCount(item.id)} style={{ minWidth: 44, paddingHorizontal: 0 }}>
            増やす
          </PaperButton>
          <PaperButton mode="contained-tonal" icon="minus" onPress={() => decreaseCount(item.id)} style={{ marginHorizontal: 6, minWidth: 44, paddingHorizontal: 0 }}>
            減らす
          </PaperButton>
          <PaperButton mode="contained" buttonColor="#e53935" textColor="white" icon="delete" onPress={() => confirmDeleteItem(item.id)} style={{ marginHorizontal: 6, minWidth: 44, paddingHorizontal: 4 }}>
            削除
          </PaperButton>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.totalContainer}>
        <Card style={styles.totalCard}>
          <Card.Content>
            <PaperText variant="titleLarge" style={styles.totalText}>本日の合計売上: ¥{getTotal().toLocaleString()}</PaperText>
          </Card.Content>
        </Card>
      </View>
      <PaperButton mode="contained" icon="plus" onPress={() => navigation.navigate('AddItem')} style={{ marginBottom: 12 }} buttonColor="#1976d2">
        商品を登録する
      </PaperButton>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>削除の確認</Dialog.Title>
          <Dialog.Content>
            <PaperText>本当にこの商品を削除しますか？</PaperText>
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton onPress={() => setDeleteDialogVisible(false)}>キャンセル</PaperButton>
            <PaperButton onPress={handleDeleteConfirmed} textColor="#e53935">削除</PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  itemText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttons: {
    justifyContent: 'center',
    marginLeft: 12,
  },
  totalText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1976d2',
    letterSpacing: 1,
  },
  totalContainer: {
    marginBottom: 16,
    marginTop: 4,
  },
  totalCard: {
    borderRadius: 16,
    elevation: 4,
    backgroundColor: '#e3f2fd',
    shadowColor: '#1976d2',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
});