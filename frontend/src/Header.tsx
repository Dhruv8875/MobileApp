// Shared app header with Roomzy logo
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Colors, Spacing } from './theme';

type Props = {
  showBack?: boolean;
  title?: string;
  right?: React.ReactNode;
  hideLogo?: boolean;
};

export default function Header({ showBack, title, right, hideLogo = false }: Props) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.headerBg }}>
      <View style={[styles.bar, { backgroundColor: Colors.headerBg, borderBottomColor: Colors.border }]}>
        <View style={styles.side}>
          {showBack ? (
            <TouchableOpacity onPress={() => router.back()} testID="header-back" style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <ArrowLeft size={22} color={Colors.headerFg} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.center}>
          {!hideLogo ? (
            <View style={styles.brand}>
              <Image source={require('../assets/images/roomzy-mark.png')} style={styles.mark} />
              {title ? <Text style={[styles.title, { color: Colors.headerFg }]} numberOfLines={1}>{title}</Text> : (
                <Text style={[styles.brandText, { color: Colors.headerFg }]}>
                  <Text style={{ color: Colors.primary }}>Room</Text><Text style={{ color: Colors.accent }}>zy</Text>
                </Text>
              )}
            </View>
          ) : (
            title ? <Text style={[styles.title, { color: Colors.headerFg }]} numberOfLines={1}>{title}</Text> : null
          )}
        </View>

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
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  side: { width: 44, justifyContent: 'center' },
  backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: { width: 28, height: 28, resizeMode: 'contain' },
  brandText: { fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
  title: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2, maxWidth: 200 },
});
