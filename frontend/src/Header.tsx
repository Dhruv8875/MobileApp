// Shared app header with Roomzy logo
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Colors, Spacing } from './theme';
import { useAuth } from './api';

type Props = {
  showBack?: boolean;
  title?: string;
  right?: React.ReactNode;
  hideLogo?: boolean;
};

export default function Header({ showBack, title, right, hideLogo = false }: Props) {

  return (
   <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.headerBg }}>
  <View style={[
    styles.bar,
    {
      backgroundColor: Colors.headerBg,
      borderBottomColor: Colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12, // 🔥 spacing fix
    }
  ]}>

    {/* 🔹 LEFT (Back + Logo) */}
    <View style={[styles.side, { flexDirection: 'row', alignItems: 'center', gap:8 , flexShrink: 1 }]}>
      {showBack ? (
        <TouchableOpacity
          onPress={() => router.back()}
          testID="header-back"
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={22} color={Colors.headerFg} />
        </TouchableOpacity>
      ) : null}

   {!hideLogo && (
  <View
    style={[
      styles.brand,
      {
        marginLeft: showBack ? 4 : 0,
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1, // 🔥 important
      },
    ]}
  >
    {/* Image intentionally commented */}
    <Image source={require('../assets/images/roomzy-mark.png')} style={styles.mark} />

    <Text
      style={[
        styles.brandText,
        {
          color: Colors.headerFg,
          fontSize: 24,
          fontWeight: '900',
          letterSpacing: -0.5,
          flexShrink: 1, // 🔥 important
        },
      ]}
      numberOfLines={1}
      ellipsizeMode="clip" // 🔥 no "..."
    >
      <Text style={{ color: Colors.primary }}>Room</Text>
      <Text style={{ color: Colors.accent }}>zy</Text> 
    </Text>
  </View>
)}
    </View>

    {/* 🔹 CENTER */}
    <View style={styles.center}>
      {hideLogo && title ? (
        <Text style={[styles.title, { color: Colors.headerFg }]} numberOfLines={1}>
          {title}
        </Text>
      ) : null}
    </View>

    {/* 🔹 RIGHT (Only avatar via right prop) */}
    <View style={[styles.side, { alignItems: 'flex-end' }]}>
      {right || null}
    </View>

  </View>
</SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    height: 64,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
side: { justifyContent: 'center' }, 
  backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: { width: 40, height: 40, resizeMode: 'contain' },
  brandText: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  title: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2, maxWidth: 200 },
});
