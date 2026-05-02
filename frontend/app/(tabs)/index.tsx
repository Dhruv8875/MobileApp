import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal, MapPin, Sparkles } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../../src/theme';
import { Chip, Input } from '../../src/ui';
import { ListingCard } from '../../src/ListingCard';
import { api, useAuth, formatErr } from '../../src/api';

const PROPERTY_TYPES = [
  { v: '', l: 'All' },
  { v: 'flat', l: 'Flats' },
  { v: 'pg', l: 'PGs' },
  { v: 'room', l: 'Rooms' },
  { v: 'bed', l: 'Bed Space' },
];
const TENANT_TYPES = [
  { v: '', l: 'Anyone' },
  { v: 'boys', l: 'Boys' },
  { v: 'girls', l: 'Girls' },
  { v: 'family', l: 'Family' },
];
const FURNISHING = [
  { v: '', l: 'Any' },
  { v: 'furnished', l: 'Furnished' },
  { v: 'semi', l: 'Semi' },
  { v: 'unfurnished', l: 'Unfurnished' },
];

export default function Discover() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [preferredTenant, setPreferredTenant] = useState('');
  const [furnishing, setFurnishing] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let results: any[] = [];
      if (user?.role === 'owner') {
        // Owner sees only their own listings
        const { data } = await api.get('/listings/mine/list');
        results = data.results || [];
        // client-side filter so owner chips still work
        if (city) results = results.filter((r) => (r.city || '').toLowerCase().includes(city.toLowerCase()) || (r.area || '').toLowerCase().includes(city.toLowerCase()) || (r.pincode || '') === city);
        if (propertyType) results = results.filter((r) => r.propertyType === propertyType);
        if (preferredTenant) results = results.filter((r) => r.preferredTenant === preferredTenant);
        if (furnishing) results = results.filter((r) => r.furnishing === furnishing);
      } else {
        const params: any = {};
        if (city) params.city = city;
        if (propertyType) params.propertyType = propertyType;
        if (preferredTenant) params.preferredTenant = preferredTenant;
        if (furnishing) params.furnishing = furnishing;
        const { data } = await api.get('/listings', { params });
        results = data.results || [];
      }
      setItems(results);
    } catch (e) { console.log('load err', formatErr(e)); }
    finally { setLoading(false); setRefreshing(false); }
  }, [city, propertyType, preferredTenant, furnishing, user?.role]);

  useEffect(() => { load(); }, [load]);

  const toggleFav = async (id: string) => {
    if (!user) return;
    try { await api.post(`/users/favorites/${id}`); } catch {}
  };

  const isFav = (id: string) => user?.favorites?.includes(id);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <View style={{ paddingHorizontal: Spacing.md, paddingTop: 6, paddingBottom: 8 }}>
        <Text style={{ fontSize: 26, fontWeight: '900', color: Colors.text, letterSpacing: -0.6 }}>
          {user?.role === 'owner' ? `Hi ${user?.name?.split(' ')[0] || 'Owner'} 🏠` : `Hi ${user?.name?.split(' ')[0] || 'there'} 👋`}
        </Text>
        <Text style={{ color: Colors.textMuted, marginTop: 2 }}>
          {user?.role === 'owner' ? 'Manage your properties' : 'Find your perfect room nearby'}
        </Text>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: Spacing.md }}>
          <View style={{ flex: 1, position: 'relative' }}>
            <View style={{ position: 'absolute', left: 14, top: 0, bottom: 0, justifyContent: 'center', zIndex: 1 }}>
              <Search size={18} color={Colors.textMuted} />
            </View>
            <View style={{ backgroundColor: Colors.bgAlt, borderRadius: Radius.full, paddingHorizontal: 40, paddingVertical: 12 }}>
              <Input value={city} onChangeText={setCity} placeholder="City, area or pincode" testID="search-input" />
            </View>
          </View>
          <TouchableOpacity
            testID="filters-toggle"
            onPress={() => setShowFilters(!showFilters)}
            style={{ width: 50, height: 50, borderRadius: Radius.full, backgroundColor: showFilters ? Colors.text : Colors.bgAlt, alignItems: 'center', justifyContent: 'center' }}
          >
            <SlidersHorizontal size={20} color={showFilters ? '#fff' : Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 12 }}>
          {PROPERTY_TYPES.map((t) => (
            <Chip key={t.v} label={t.l} active={propertyType === t.v} onPress={() => setPropertyType(t.v)} testID={`pt-${t.v || 'all'}`} />
          ))}
        </ScrollView>

        {showFilters && (
          <View style={{ backgroundColor: Colors.bgAlt, padding: Spacing.md, borderRadius: Radius.xl, marginBottom: 8 }}>
            <Text style={{ fontWeight: '700', marginBottom: 6, color: Colors.text }}>Preferred for</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {TENANT_TYPES.map((t) => (
                <Chip key={t.v} label={t.l} active={preferredTenant === t.v} onPress={() => setPreferredTenant(t.v)} testID={`tt-${t.v || 'any'}`} />
              ))}
            </View>
            <Text style={{ fontWeight: '700', marginTop: 12, marginBottom: 6, color: Colors.text }}>Furnishing</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {FURNISHING.map((t) => (
                <Chip key={t.v} label={t.l} active={furnishing === t.v} onPress={() => setFurnishing(t.v)} testID={`fu-${t.v || 'any'}`} />
              ))}
            </View>
          </View>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          renderItem={({ item }) => (
            <ListingCard item={item} onFavorite={user?.role === 'tenant' ? () => toggleFav(item.id) : undefined} isFavorited={isFav(item.id)} />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', padding: 40 }}>
              <Sparkles size={32} color={Colors.textMuted} />
              <Text style={{ marginTop: 12, color: Colors.textMuted, textAlign: 'center' }}>No listings match your filters yet. Try widening your search.</Text>
            </View>
          }
          ListHeaderComponent={
            items.length > 0 ? (
              <Text style={{ fontWeight: '700', marginBottom: 10, color: Colors.text }}>{items.length} {items.length === 1 ? 'home' : 'homes'} available</Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
