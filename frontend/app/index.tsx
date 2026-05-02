import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../src/ui';
import { Colors, Spacing } from '../src/theme';
import { useAuth } from '../src/api';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.heroWrap}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1771327811766-5f4149190b3d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBiZWRyb29tJTIwaW50ZXJpb3IlMjBpbmRpYXxlbnwwfHx8fDE3Nzc3MTcwMjF8MA&ixlib=rb-4.1.0&q=85' }}
          style={styles.hero}
        />
        <View style={styles.gradient} />
      </View>
      <View style={styles.content}>
        <Text style={styles.brand} testID="app-brand">Roomzy</Text>
        <Text style={styles.tagline}>Find your next home in seconds</Text>
        <Text style={styles.sub}>Discover trusted PGs, flats, and shared rooms across India — built for students, professionals & families.</Text>
        <View style={{ marginTop: Spacing.lg, gap: Spacing.sm }}>
          <Button title="Get Started" onPress={() => router.push('/register')} testID="cta-get-started" />
          <Button title="I already have an account" variant="secondary" onPress={() => router.push('/login')} testID="cta-have-account" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  heroWrap: { height: '52%', position: 'relative' },
  hero: { width: '100%', height: '100%' },
  gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, backgroundColor: 'rgba(255,255,255,0.0)' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 28 },
  brand: { fontSize: 38, fontWeight: '900', color: Colors.text, letterSpacing: -1.2 },
  tagline: { fontSize: 22, fontWeight: '800', color: Colors.text, marginTop: 8, letterSpacing: -0.4 },
  sub: { fontSize: 15, color: Colors.textMuted, marginTop: 12, lineHeight: 22 },
});
