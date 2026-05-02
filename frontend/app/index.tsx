import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/ui';
import { Colors, Spacing } from '../src/theme';
import { useAuth } from '../src/api';
import { Search, Shield, Zap, Home as HomeIcon } from 'lucide-react-native';

export default function Index() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) router.replace('/(tabs)');
  }, [user]);

  if (user === undefined) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1771327811766-5f4149190b3d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBiZWRyb29tJTIwaW50ZXJpb3IlMjBpbmRpYXxlbnwwfHx8fDE3Nzc3MTcwMjF8MA&ixlib=rb-4.1.0&q=85' }}
            style={styles.hero}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.1)', '#FFFFFF']}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView edges={['top']} style={styles.brandRow}>
            <View style={styles.brandBadge} testID="app-brand">
              <HomeIcon size={16} color="#FF385C" />
              <Text style={styles.brandBadgeText}>Roomzy</Text>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.content}>
          <Text style={styles.bigTitle}>Find your{'\n'}perfect room.</Text>
          <Text style={styles.sub}>Trusted PGs, flats and shared rooms across India. Built for students, professionals & families.</Text>

          <View style={styles.featureRow}>
            <Feature icon={<Search size={18} color={Colors.primary} />} label="Smart search" />
            <Feature icon={<Shield size={18} color={Colors.primary} />} label="Verified owners" />
            <Feature icon={<Zap size={18} color={Colors.primary} />} label="Instant contact" />
          </View>

          <View style={{ marginTop: Spacing.xl, gap: 10 }}>
            <Button title="Get Started" onPress={() => router.push('/register')} testID="cta-get-started" />
            <TouchableOpacity testID="cta-have-account" onPress={() => router.push('/login')} style={styles.ghostBtn}>
              <Text style={styles.ghostBtnText}>I already have an account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Feature({ icon, label }: any) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIcon}>{icon}</View>
      <Text style={styles.featureText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  heroWrap: { height: 380, position: 'relative' },
  hero: { width: '100%', height: '100%' },
  brandRow: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', paddingHorizontal: Spacing.md, paddingTop: Platform.OS === 'ios' ? 0 : 12 },
  brandBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  brandBadgeText: { fontWeight: '900', color: Colors.text, letterSpacing: -0.3 },
  content: { paddingHorizontal: 28, paddingTop: 8, paddingBottom: 32 },
  bigTitle: { fontSize: 40, fontWeight: '900', color: Colors.text, letterSpacing: -1.4, lineHeight: 44 },
  sub: { fontSize: 15, color: Colors.textMuted, marginTop: 14, lineHeight: 22 },
  featureRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.xl, gap: 8 },
  feature: { flex: 1, alignItems: 'flex-start' },
  featureIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  featureText: { fontSize: 12, fontWeight: '700', color: Colors.text },
  ghostBtn: { paddingVertical: 14, alignItems: 'center' },
  ghostBtnText: { color: Colors.text, fontWeight: '700', fontSize: 15 },
});
