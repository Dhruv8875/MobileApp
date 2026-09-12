// Map screen for tenants - pins every listing near the current location.
// Tapping a pin shows a small info popup on the map; "View more details" opens the listing.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Image } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { Colors } from '../../src/theme';
import Header from '../../src/Header';
import { api } from '../../src/api';
import { Locate, List, X, MapPin } from 'lucide-react-native';
import MapViewWrap, { MapPoint } from '../../src/MapViewWrap';

const RADIUS_KM = 10; // "near me" radius — 2km was too tight (GPS drift indoors showed nothing)
const FALLBACK_COORDS = { latitude: 12.9716, longitude: 77.5946 }; // Bengaluru

export default function MapScreen() {
  const styles = makeStyles();
  const [loc, setLoc] = useState<{ latitude: number; longitude: number } | null>(null);
  const [status, setStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null); // tapped listing shown in the map popup
  const mapRef = useRef<any>(null);

  useEffect(() => { (async () => { await requestLocation(); })(); }, []);

  async function requestLocation() {
    setStatus('requesting');
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setLoc(FALLBACK_COORDS); setStatus('denied'); await fetchListings(FALLBACK_COORDS); return;
      }
      const here = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const point = { latitude: here.coords.latitude, longitude: here.coords.longitude };
      setLoc(point); setStatus('granted'); await fetchListings(point);
    } catch {
      setLoc(FALLBACK_COORDS); setStatus('denied'); await fetchListings(FALLBACK_COORDS);
    }
  }

  async function fetchListings(point: { latitude: number; longitude: number }) {
    setLoading(true);
    try {
      const { data } = await api.get('/listings/nearby', {
        params: { lat: point.latitude, lng: point.longitude, radiusKm: RADIUS_KM, limit: 50 },
      });
      const results = (data.results || []).filter((l: any) => {
        const c = l?.location?.coordinates;
        return Array.isArray(c) && c.length === 2 && (c[0] !== 0 || c[1] !== 0);
      });
      setListings(results);
    } catch { setListings([]); }
    finally { setLoading(false); }
  }

  const recenter = () => {
    if (loc && mapRef.current?.animateToRegion) {
      mapRef.current.animateToRegion({ ...loc, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 500);
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
          <MapViewWrap
            ref={mapRef}
            center={loc}
            points={points}
            onPressPoint={(p) => setSelected(p.data)}
          />

          {status === 'denied' && (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>📍 Location denied · showing Bengaluru</Text>
              <TouchableOpacity onPress={() => Linking.openSettings()}><Text style={styles.bannerLink}>Enable</Text></TouchableOpacity>
            </View>
          )}

          {!selected && (
            <TouchableOpacity style={styles.fab} onPress={recenter} testID="recenter">
              <Locate size={20} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Basic info popup shown on the map when a pin is tapped */}
          {selected && (
            <View style={styles.popup} testID="map-popup">
              <TouchableOpacity onPress={() => setSelected(null)} style={styles.popupClose} testID="popup-close">
                <X size={16} color={Colors.text} />
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {selected.photos?.[0] ? (
                  <Image source={{ uri: selected.photos[0] }} style={styles.popupImg} />
                ) : (
                  <View style={[styles.popupImg, styles.popupImgPh]}>
                    <MapPin size={22} color={Colors.primary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={styles.popupTitle}>{selected.title}</Text>
                  <Text style={styles.popupRent}>₹{Number(selected.monthlyRent || 0).toLocaleString('en-IN')}/mo</Text>
                  <Text numberOfLines={1} style={styles.popupLoc}>{[selected.area, selected.city].filter(Boolean).join(', ')}</Text>
                  {!!selected.propertyType && (
                    <View style={styles.popupTypePill}>
                      <Text style={styles.popupTypeText}>{String(selected.propertyType).toUpperCase()}</Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={() => router.push(`/listing/${selected.id}`)} style={styles.popupBtn} testID="popup-view-more">
                <Text style={styles.popupBtnText}>View more details →</Text>
              </TouchableOpacity>
            </View>
          )}

          {loading ? (
            <View style={styles.loadingPill}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={{ color: '#fff', marginLeft: 8 }}>Loading nearby</Text>
            </View>
          ) : (
            <View style={styles.countPill}>
              <Text style={styles.countText}>
                {points.length ? `${points.length} within ${RADIUS_KM} km · tap a pin` : `No homes within ${RADIUS_KM} km`}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const makeStyles = () => StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hdrBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgAlt, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', right: 16, bottom: 120, width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 5 },
  loadingPill: { position: 'absolute', top: 12, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  countPill: { position: 'absolute', top: 12, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  countText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  banner: { position: 'absolute', top: 56, left: 12, right: 12, backgroundColor: Colors.warning + '22', borderWidth: 1, borderColor: Colors.warning, padding: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bannerText: { color: Colors.text, fontSize: 12, fontWeight: '600', flex: 1 },
  bannerLink: { color: Colors.primary, fontWeight: '800', fontSize: 12 },
  popup: { position: 'absolute', left: 12, right: 12, bottom: 24, backgroundColor: Colors.surface, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  popupClose: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.bgAlt, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  popupImg: { width: 64, height: 64, borderRadius: 12, backgroundColor: Colors.bgAlt },
  popupImgPh: { alignItems: 'center', justifyContent: 'center' },
  popupTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, paddingRight: 28 },
  popupRent: { fontSize: 14, fontWeight: '900', color: Colors.primary, marginTop: 2 },
  popupLoc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  popupTypePill: { alignSelf: 'flex-start', marginTop: 6, backgroundColor: Colors.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  popupTypeText: { fontSize: 10, fontWeight: '800', color: Colors.primary, letterSpacing: 0.4 },
  popupBtn: { marginTop: 12, backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  popupBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});