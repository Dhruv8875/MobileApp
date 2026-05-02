// Map screen for tenants - shows nearby listings as pins
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Linking } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { Colors, Spacing, Radius } from '../../src/theme';
import Header from '../../src/Header';
import { api } from '../../src/api';
import { Locate, List, X } from 'lucide-react-native';
import { Pill } from '../../src/ui';
import MapViewWrap, { MapPoint } from '../../src/MapViewWrap';

export default function MapScreen() {
  const [loc, setLoc] = useState<{ latitude: number; longitude: number } | null>(null);
  const [status, setStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [listings, setListings] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<any>(null);

  useEffect(() => { (async () => { await requestLocation(); })(); }, []);

  async function requestLocation() {
    setStatus('requesting');
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        const fallback = { latitude: 12.9716, longitude: 77.5946 };
        setLoc(fallback); setStatus('denied'); await fetchListings(fallback); return;
      }
      const here = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const point = { latitude: here.coords.latitude, longitude: here.coords.longitude };
      setLoc(point); setStatus('granted'); await fetchListings(point);
    } catch {
      const fallback = { latitude: 12.9716, longitude: 77.5946 };
      setLoc(fallback); setStatus('denied'); await fetchListings(fallback);
    }
  }

  async function fetchListings(point: { latitude: number; longitude: number }) {
    setLoading(true);
    try {
      const { data } = await api.get('/listings/nearby', { params: { lat: point.latitude, lng: point.longitude, radiusKm: 30, limit: 50 } });
      let results = data.results || [];
      if (!results.length) {
        const r2 = await api.get('/listings', { params: { limit: 50 } });
        results = r2.data.results || [];
      }
      results = results.filter((l: any) => {
        const c = l?.location?.coordinates;
        return Array.isArray(c) && c.length === 2 && (c[0] !== 0 || c[1] !== 0);
      });
      setListings(results);
    } catch { setListings([]); }
    finally { setLoading(false); }
  }

  const recenter = () => {
    if (loc && mapRef.current?.animateToRegion) {
      mapRef.current.animateToRegion({ ...loc, latitudeDelta: 0.08, longitudeDelta: 0.08 }, 500);
    }
  };

  const points: MapPoint[] = listings.map((l) => ({
    id: l.id,
    latitude: l.location.coordinates[1],
    longitude: l.location.coordinates[0],
    label: `₹${Math.round(l.monthlyRent / 1000)}k`,
    data: l,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <Header title="Map" right={
        <TouchableOpacity onPress={() => router.push('/(tabs)')} testID="go-list" style={styles.hdrBtn}>
          <List size={18} color={Colors.text} />
        </TouchableOpacity>
      } />

      {!loc ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <View style={{ flex: 1 }}>
          <MapViewWrap ref={mapRef} center={loc} points={points} onPressPoint={(p) => setSelected(p.data)} />

          {status === 'denied' && (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>📍 Location denied · showing Bengaluru</Text>
              <TouchableOpacity onPress={() => Linking.openSettings()}><Text style={styles.bannerLink}>Enable</Text></TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.fab} onPress={recenter} testID="recenter">
            <Locate size={20} color="#fff" />
          </TouchableOpacity>

          {loading && (
            <View style={styles.loadingPill}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={{ color: '#fff', marginLeft: 8 }}>Loading nearby</Text>
            </View>
          )}

          {selected && <PreviewCard item={selected} onClose={() => setSelected(null)} onOpen={() => router.push(`/listing/${selected.id}`)} />}
        </View>
      )}
    </View>
  );
}

function PreviewCard({ item, onClose, onOpen }: any) {
  return (
    <View style={styles.previewWrap}>
      <TouchableOpacity activeOpacity={0.95} onPress={onOpen} style={styles.preview}>
        {item.photos?.[0] ? <Image source={{ uri: item.photos[0] }} style={styles.previewImg} /> : <View style={[styles.previewImg, { backgroundColor: Colors.bgAlt }]} />}
        <View style={{ flex: 1, padding: 12 }}>
          <Text style={{ fontWeight: '800', color: Colors.text, fontSize: 14 }} numberOfLines={1}>{item.title}</Text>
          <Text style={{ color: Colors.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{item.area}, {item.city}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
            <Text style={{ fontWeight: '900', color: Colors.text, fontSize: 16 }}>₹{item.monthlyRent.toLocaleString('en-IN')}</Text>
            <Text style={{ color: Colors.textMuted, fontSize: 11 }}>/mo</Text>
            <View style={{ flex: 1 }} />
            <Pill text={item.propertyType.toUpperCase()} bg={Colors.primaryLight} color={Colors.primary} />
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}><X size={16} color={Colors.text} /></TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hdrBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgAlt, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', right: 16, bottom: 120, width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 5 },
  loadingPill: { position: 'absolute', top: 12, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  banner: { position: 'absolute', top: 12, left: 12, right: 12, backgroundColor: Colors.warning + '22', borderWidth: 1, borderColor: Colors.warning, padding: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bannerText: { color: Colors.text, fontSize: 12, fontWeight: '600', flex: 1 },
  bannerLink: { color: Colors.primary, fontWeight: '800', fontSize: 12 },
  previewWrap: { position: 'absolute', bottom: 20, left: 12, right: 12 },
  preview: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.xl, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8, borderWidth: 1, borderColor: Colors.border },
  previewImg: { width: 100, height: 100 },
  closeBtn: { position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.bgAlt, alignItems: 'center', justifyContent: 'center' },
});
