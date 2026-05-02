import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { ListingCard } from '../../src/ListingCard';
import { Colors, Spacing } from '../../src/theme';
import { api, useAuth } from '../../src/api';
import { Heart } from 'lucide-react-native';

export default function Favorites() {
  const { refresh } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/users/favorites');
        setItems(data.results || []);
      } catch {} finally { setLoading(false); }
    })();
  }, []));

  const toggleFav = async (id: string) => {
    await api.post(`/users/favorites/${id}`);
    setItems((cur) => cur.filter((x) => x.id !== id));
    refresh();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <View style={{ paddingHorizontal: Spacing.md, paddingVertical: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: Colors.text, letterSpacing: -0.6 }}>Saved</Text>
        <Text style={{ color: Colors.textMuted, marginTop: 2 }}>Your shortlisted homes</Text>
      </View>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={Colors.primary} /></View>
      ) : items.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <Heart size={40} color={Colors.textMuted} />
          <Text style={{ marginTop: 16, fontSize: 18, fontWeight: '700', color: Colors.text }}>No saved homes yet</Text>
          <Text style={{ color: Colors.textMuted, textAlign: 'center', marginTop: 8 }}>Tap the heart on any listing to save it here.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: 40 }}
          renderItem={({ item }) => <ListingCard item={item} onFavorite={() => toggleFav(item.id)} isFavorited />}
        />
      )}
    </SafeAreaView>
  );
}
