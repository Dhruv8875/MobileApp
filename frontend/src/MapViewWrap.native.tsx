// Native-only map component (iOS + Android). Web uses MapViewWrap.web.tsx fallback.
import React, { forwardRef } from 'react';
import { Platform, StyleSheet, View, Text } from 'react-native';
import MapViewReact, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Colors } from './theme';

export type MapPoint = {
  id: string;
  latitude: number;
  longitude: number;
  label: string; // e.g. "₹18k"
  data?: any;
};

type Props = {
  center: { latitude: number; longitude: number };
  points: MapPoint[];
  onPressPoint?: (p: MapPoint) => void;
};

const MapViewWrap = forwardRef<any, Props>(({ center, points, onPressPoint }, ref) => {
  return (
    <MapViewReact
      ref={ref}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      style={StyleSheet.absoluteFill}
      initialRegion={{ ...center, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
      showsUserLocation
      showsMyLocationButton={false}
    >
      {points.map((p) => (
        <Marker key={p.id} coordinate={{ latitude: p.latitude, longitude: p.longitude }} onPress={() => onPressPoint?.(p)}>
          <View style={styles.pin}>
            <Text style={styles.pinText}>{p.label}</Text>
          </View>
        </Marker>
      ))}
    </MapViewReact>
  );
});

export default MapViewWrap;

const styles = StyleSheet.create({
  pin: { backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  pinText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});
