import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/ui';
import { Colors, Spacing } from '../src/theme';
import { useAuth } from '../src/api';
import { Search, Shield, Zap } from 'lucide-react-native';

export default function Index() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) router.replace('/(tabs)');
  }, [user]);

  if (user === undefined) {
    return (
      <View style={[styles.container, { justifyContent: 'center', backgroundColor: '#000' }]}>
        <Image source={require('../assets/images/roomzy-logo.png')} style={{ width: 200, height: 160, resizeMode: 'contain' }} />
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <View style={styles.heroWrap}>
          <SafeAreaView edges={['top']} style={styles.logoWrap}>
            <Image
              source={require('../assets/images/roomzy-logo.png')}
              style={styles.logo}
            />
          </SafeAreaView>
          <View style={styles.curve} />
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
  heroWrap: { height: 360, backgroundColor: '#000', position: 'relative', alignItems: 'center', justifyContent: 'flex-start' },
  logoWrap: { width: '100%', alignItems: 'center', paddingTop: 20, flex: 1, justifyContent: 'center' },
  logo: { width: 260, height: 220, resizeMode: 'contain' },
  curve: { position: 'absolute', bottom: -1, left: 0, right: 0, height: 32, backgroundColor: Colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  content: { paddingHorizontal: 28, paddingTop: 16, paddingBottom: 32 },
  bigTitle: { fontSize: 40, fontWeight: '900', color: Colors.text, letterSpacing: -1.4, lineHeight: 44 },
  sub: { fontSize: 15, color: Colors.textMuted, marginTop: 14, lineHeight: 22 },
  featureRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.xl, gap: 8 },
  feature: { flex: 1, alignItems: 'flex-start' },
  featureIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  featureText: { fontSize: 12, fontWeight: '700', color: Colors.text },
  ghostBtn: { paddingVertical: 14, alignItems: 'center' },
  ghostBtnText: { color: Colors.text, fontWeight: '700', fontSize: 15 },
});
