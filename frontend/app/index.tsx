import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../src/ui';
import { Colors, Spacing, Radius } from '../src/theme';
import { useAuth } from '../src/api';
import { Search, Shield, Zap, ArrowRight, MapPin } from 'lucide-react-native';

const { width: W, height: H } = Dimensions.get('window');
const isSmall = H < 700;

export default function Index() {
  const { user } = useAuth();
  const styles = makeStyles();

  useEffect(() => {
    if (user) router.replace('/(tabs)');
  }, [user]);

  if (user === undefined) {
    return (
      <View style={[styles.container, { justifyContent: 'center', backgroundColor: '#000' }]}>
        <Image source={require('../assets/images/roomzy-logo-transparent.png')} style={{ width: 200, height: 160, resizeMode: 'contain' }} />
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroWrap}>
          <LinearGradient colors={['#000', '#0B1233', '#000']} style={StyleSheet.absoluteFill} />
          {/* Decorative orbs */}
          <View style={[styles.orb, { top: 60, left: -40, backgroundColor: Colors.primary + '33' }]} />
          <View style={[styles.orb, { top: 200, right: -60, backgroundColor: Colors.accent + '22', width: 180, height: 180 }]} />

          <SafeAreaView edges={['top']} style={styles.heroContent}>
            <View style={styles.pill}>
              <View style={styles.pillDot} />
              <Text style={styles.pillText}>Live in 50+ Indian cities</Text>
            </View>
            <Image source={require('../assets/images/roomzy-logo-transparent.png')} style={styles.logo} />
          </SafeAreaView>
          <View style={styles.curve} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.bigTitle}>
            Find your{'\n'}<Text style={{ color: Colors.primary }}>perfect</Text> <Text style={{ color: Colors.accent }}>room</Text>
            <Text style={{ color: Colors.text }}>.</Text>
          </Text>
          <Text style={styles.sub}>Trusted PGs, flats and shared rooms across India. Built for students, professionals & families.</Text>

          <View style={styles.featureRow}>
            <Feature icon={<Search size={20} color={Colors.primary} />} label="Smart search" desc="Filter by rent, gender, amenities" />
            <Feature icon={<MapPin size={20} color={Colors.accent} />} label="Nearby listings" desc="See homes on a live map" />
            <Feature icon={<Shield size={20} color={Colors.primary} />} label="Verified owners" desc="No brokers, no fake listings" />
          </View>

          <View style={{ marginTop: Spacing.xl }}>
            <Button title="Get Started →" onPress={() => router.push('/register')} testID="cta-get-started" />
            <TouchableOpacity testID="cta-have-account" onPress={() => router.push('/login')} style={styles.ghostBtn}>
              <Text style={styles.ghostBtnText}>I already have an account</Text>
            </TouchableOpacity>
          </View>

          {/* Social proof */}
          <View style={styles.statRow}>
            <Stat big="10k+" small="Listings" />
            <View style={styles.statDivider} />
            <Stat big="50+" small="Cities" />
            <View style={styles.statDivider} />
            <Stat big="4.8★" small="Rated" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Feature({ icon, label, desc }: any) {
  return (
    <View style={featureStyles.row}>
      <View style={[featureStyles.iconWrap, { backgroundColor: Colors.bgAlt }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: Colors.text, fontWeight: '700', fontSize: 14 }}>{label}</Text>
        <Text style={{ color: Colors.textMuted, fontSize: 12, marginTop: 2 }}>{desc}</Text>
      </View>
    </View>
  );
}
function Stat({ big, small }: any) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.text }}>{big}</Text>
      <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>{small}</Text>
    </View>
  );
}

const featureStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});

const makeStyles = () => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  heroWrap: { height: isSmall ? 300 : 380, position: 'relative', overflow: 'hidden' },
  heroContent: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 24 },
  orb: { position: 'absolute', width: 200, height: 200, borderRadius: 100, opacity: 0.7 },
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  pillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  pillText: { color: '#fff', fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  logo: { width: isSmall ? 200 : 260, height: isSmall ? 160 : 210, resizeMode: 'contain' },
  curve: { position: 'absolute', bottom: -1, left: 0, right: 0, height: 32, backgroundColor: Colors.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  content: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  bigTitle: { fontSize: isSmall ? 32 : 38, fontWeight: '900', color: Colors.text, letterSpacing: -1.2, lineHeight: isSmall ? 36 : 42 },
  sub: { fontSize: 14, color: Colors.textMuted, marginTop: 12, lineHeight: 21 },
  featureRow: { marginTop: Spacing.xl },
  ghostBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  ghostBtnText: { color: Colors.text, fontWeight: '700', fontSize: 14 },
  statRow: { flexDirection: 'row', marginTop: Spacing.xl, paddingVertical: 16, backgroundColor: Colors.bgAlt, borderRadius: Radius.xl, alignItems: 'center' },
  statDivider: { width: 1, height: 24, backgroundColor: Colors.border },
});
