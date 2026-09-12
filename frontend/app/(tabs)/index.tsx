import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Search, SlidersHorizontal, MapPin, Sparkles, Navigation } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../../src/theme';
import { Chip, Input } from '../../src/ui';
import Header from '../../src/Header';
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

// Distance options for the "near me" default view (km).
const RADII = [2, 4, 6, 10, 25];
const DEFAULT_RADIUS = 4;
// Fallback centre (Bengaluru) when location permission is denied/unavailable.
const FALLBACK_COORDS = { latitude: 12.9716, longitude: 77.5946 };

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

  // Location state (tenant "near me" view)
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locStatus, setLocStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [locLabel, setLocLabel] = useState('Near you');
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS);

  const isTenant = user?.role !== 'owner';
  const searching = city.trim().length > 0; // manual location/city search overrides "near me"

  // Ask for location once (tenants only). On denial, fall back to Bengaluru.
  useEffect(() => {
    if (!isTenant) return;
    let cancelled = false;
    (async () => {
      setLocStatus('requesting');
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) { setLocStatus('denied'); setLocLabel('Bengaluru'); setCoords(FALLBACK_COORDS); }
          return;
        }
        const here = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const c = { latitude: here.coords.latitude, longitude: here.coords.longitude };
        if (cancelled) return;
        setCoords(c);
        setLocStatus('granted');
        try {
          const geo = await Location.reverseGeocodeAsync(c);
          const g = geo?.[0];
          const name = g?.district || g?.subregion || g?.city || g?.name;
          if (name && !cancelled) setLocLabel(name);
        } catch { /* reverse geocode is best-effort */ }
      } catch {
        if (!cancelled) { setLocStatus('denied'); setLocLabel('Bengaluru'); setCoords(FALLBACK_COORDS); }
      }
    })();
    return () => { cancelled = true; };
  }, [isTenant]);

  const load = useCallback(async () => {
    // Tenant "near me" view: wait until we have a location fix before first fetch.
    if (isTenant && !searching && !coords) return;
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
        if (propertyType) params.propertyType = propertyType;
        if (preferredTenant) params.preferredTenant = preferredTenant;
        if (furnishing) params.furnishing = furnishing;
        if (searching) {
          // Manual search: backend matches city OR area OR pincode OR title
          params.search = city.trim();
          const { data } = await api.get('/listings', { params });
          results = data.results || [];
        } else {
          // Default: properties near the tenant's current location
          params.lat = coords!.latitude;
          params.lng = coords!.longitude;
          params.radiusKm = radiusKm;
          const { data } = await api.get('/listings/nearby', { params });
          results = data.results || [];
        }
      }
      setItems(results);
    } catch (e) { console.log('load err', formatErr(e)); }
    finally { setLoading(false); setRefreshing(false); }
  }, [city, propertyType, preferredTenant, furnishing, user?.role, isTenant, searching, coords, radiusKm]);

  useEffect(() => { load(); }, [load]);

  const toggleFav = async (id: string) => {
    if (!user) return;
    try { await api.post(`/users/favorites/${id}`); } catch {}
  };

  const isFav = (id: string) => user?.favorites?.includes(id);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={[]}>
      <Header right={<View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 12, fontWeight: '900', color: Colors.primary }}>{(user?.name?.[0] || 'R').toUpperCase()}</Text></View>} />
      <View style={{ paddingHorizontal: Spacing.md, paddingTop: 6, paddingBottom: 8 }}>


        <View style={{ flexDirection: 'row', gap: 10, marginTop: Spacing.md, alignItems: 'center' }}>

  {/* SEARCH */}
  <View style={{ flex: 1, position: 'relative' }}>

    {/* Icon */}
    <View style={{
      position: 'absolute',
      left: 14,
      height: '100%',
      justifyContent: 'center',
      zIndex: 1
    }}>
      <Search size={18} color={Colors.textMuted} />
    </View>

    {/* Input wrapper */}
    <View style={{
      height: 50, // 🔥 FIXED HEIGHT
      backgroundColor: Colors.bgAlt,
      borderRadius: Radius.full,
      justifyContent: 'center',
      paddingLeft: 40,
      paddingRight: 12
    }}>
      <Input
        value={city}
        onChangeText={setCity}
        placeholder="City, area or pincode"
        testID="search-input"
        style={{ padding: 0 }} // 🔥 remove extra spacing
      />
    </View>

  </View>

  {/* FILTER BUTTON */}
  <TouchableOpacity
    testID="filters-toggle"
    onPress={() => setShowFilters(!showFilters)}
    style={{
      width: 50,
      height: 50,
      borderRadius: Radius.full,
      backgroundColor: showFilters ? Colors.text : Colors.bgAlt,
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    <SlidersHorizontal size={20} color={showFilters ? '#fff' : Colors.text} />
  </TouchableOpacity>

</View>

        {/* LOCATION BAR (tenant only) */}
        {isTenant && (
          <View style={{ marginTop: 12 }}>
            {searching ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MapPin size={15} color={Colors.textMuted} />
                <Text style={{ marginLeft: 6, color: Colors.textMuted, fontSize: 13, flex: 1 }} numberOfLines={1}>
                  Showing results for “{city.trim()}”
                </Text>
                <TouchableOpacity testID="use-my-location" onPress={() => setCity('')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Navigation size={13} color={Colors.primary} />
                  <Text style={{ color: Colors.primary, fontWeight: '800', fontSize: 12 }}>Near me</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MapPin size={15} color={Colors.primary} />
                  <Text style={{ marginLeft: 6, color: Colors.text, fontSize: 13, fontWeight: '700', flex: 1 }} numberOfLines={1}>
                    {locLabel} · within {radiusKm} km
                    {locStatus === 'denied' ? '  (location off)' : ''}
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 10 }}>
                  {RADII.map((km) => (
                    <Chip key={km} label={`${km} km`} active={radiusKm === km} onPress={() => setRadiusKm(km)} testID={`radius-${km}`} />
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        )}

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
              <Text style={{ marginTop: 12, color: Colors.textMuted, textAlign: 'center' }}>
                {isTenant && !searching
                  ? `No homes within ${radiusKm} km. Try a bigger distance or search a city above.`
                  : 'No listings match your filters yet. Try widening your search.'}
              </Text>
            </View>
          }
          ListHeaderComponent={
            items.length > 0 ? (
              <Text style={{ fontWeight: '700', marginBottom: 10, color: Colors.text }}>
                {items.length} {items.length === 1 ? 'home' : 'homes'}{isTenant && !searching ? ` within ${radiusKm} km` : ' available'}
              </Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
