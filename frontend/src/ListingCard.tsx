// Listing card component
import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Colors, Radius, Spacing } from './theme';
import { Heart, MapPin, Star } from 'lucide-react-native';
import { Pill } from './ui';
import { router } from 'expo-router';

export type Listing = {
  id: string;
  title: string;
  city: string;
  area: string;
  monthlyRent: number;
  photos: string[];
  propertyType: string;
  preferredTenant: string;
  furnishing: string;
  isFeatured?: boolean;
  amenities?: any;
  owner?: any;
};

const PLACEHOLDER = 'https://images.unsplash.com/photo-1750420556288-d0e32a6f517b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBiZWRyb29tJTIwaW50ZXJpb3IlMjBpbmRpYXxlbnwwfHx8fDE3Nzc3MTcwMjF8MA&ixlib=rb-4.1.0&q=85';

export function ListingCard({ item, onFavorite, isFavorited }: { item: Listing; onFavorite?: () => void; isFavorited?: boolean }) {
  const photo = item.photos?.[0] || PLACEHOLDER;
  return (
    <TouchableOpacity
      testID={`listing-card-${item.id}`}
      activeOpacity={0.9}
      onPress={() => router.push(`/listing/${item.id}`)}
      style={{ backgroundColor: Colors.surface, borderRadius: Radius.xxl, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }}
    >
      <View>
        <Image source={{ uri: photo }} style={{ width: '100%', height: 220 }} />
        {item.isFeatured && (
          <View style={{ position: 'absolute', top: 12, left: 12 }}>
            <Pill text="⭐ FEATURED" color="#fff" bg="rgba(0,0,0,0.7)" />
          </View>
        )}
        {onFavorite && (
          <TouchableOpacity
            testID={`fav-btn-${item.id}`}
            onPress={onFavorite}
            style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: Radius.full, padding: 8 }}
          >
            <Heart size={20} color={isFavorited ? Colors.primary : '#222'} fill={isFavorited ? Colors.primary : 'transparent'} />
          </TouchableOpacity>
        )}
      </View>
      <View style={{ padding: Spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text, flex: 1, marginRight: 8 }} numberOfLines={1}>{item.title}</Text>
          {item.owner?.isVerifiedOwner && <Star size={16} color={Colors.primary} fill={Colors.primary} />}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <MapPin size={13} color={Colors.textMuted} />
          <Text style={{ marginLeft: 4, color: Colors.textMuted, fontSize: 13 }} numberOfLines={1}>{item.area}, {item.city}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6, flexWrap: 'wrap' }}>
          <Pill text={item.propertyType.toUpperCase()} bg={Colors.bgAlt} color={Colors.text} />
          <Pill text={item.furnishing} bg={Colors.bgAlt} color={Colors.text} />
          <Pill text={item.preferredTenant} bg={Colors.bgAlt} color={Colors.text} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: '900', color: Colors.text }}>₹{item.monthlyRent.toLocaleString('en-IN')}</Text>
            <Text style={{ fontSize: 12, color: Colors.textMuted }}>per month</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
