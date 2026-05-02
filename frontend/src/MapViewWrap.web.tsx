// Web fallback - react-native-maps doesn't support web. Just renders an info card.
import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Colors } from './theme';

export type MapPoint = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  data?: any;
};

type Props = {
  center: { latitude: number; longitude: number };
  points: MapPoint[];
  onPressPoint?: (p: MapPoint) => void;
};

const MapViewWrap = forwardRef<any, Props>(() => {
  return (
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgAlt, padding: 24 }]}>
      <MapPin size={40} color={Colors.primary} />
      <Text style={{ fontWeight: '800', color: Colors.text, marginTop: 12, fontSize: 16 }}>Map view is mobile-only</Text>
      <Text style={{ color: Colors.textMuted, textAlign: 'center', marginTop: 6, fontSize: 13, maxWidth: 300 }}>
        Open Roomzy in Expo Go or the published APK to see listings on a live Google Map.
      </Text>
    </View>
  );
});

export default MapViewWrap;
