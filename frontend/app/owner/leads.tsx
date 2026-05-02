import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Phone, MessageCircle } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../../src/theme';
import { Card, Pill } from '../../src/ui';
import { api } from '../../src/api';

export default function Leads() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { const { data } = await api.get('/listings/mine/leads'); setItems(data.results || []); } finally { setLoading(false); } })(); }, []);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} color={Colors.text} /></TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900', color: Colors.text }}>Leads</Text>
      </View>
      {loading ? <ActivityIndicator color={Colors.primary} /> : (
        <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 40 }}>
          {items.length === 0 ? <Text style={{ color: Colors.textMuted, textAlign: 'center', marginTop: 40 }}>No leads yet. They'll show up here.</Text> :
            items.map((l) => (
              <Card key={l.id} style={{ padding: Spacing.md, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '800', color: Colors.text }}>{l.tenant?.name || 'Tenant'}</Text>
                    <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>{l.listing?.title}</Text>
                    <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>{new Date(l.createdAt).toLocaleString()}</Text>
                  </View>
                  <Pill text={l.type.toUpperCase()} bg={Colors.primaryLight} color={Colors.primary} />
                </View>
                {l.tenant?.phone && (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${l.tenant.phone}`)} style={{ flexDirection: 'row', gap: 6, padding: 8, borderRadius: 12, backgroundColor: Colors.bgAlt, alignItems: 'center' }}><Phone size={14} color={Colors.text} /><Text style={{ fontSize: 12, fontWeight: '700', color: Colors.text }}>Call</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/91${l.tenant.phone.replace(/\D/g, '')}`)} style={{ flexDirection: 'row', gap: 6, padding: 8, borderRadius: 12, backgroundColor: '#25D366', alignItems: 'center' }}><MessageCircle size={14} color="#fff" /><Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>WhatsApp</Text></TouchableOpacity>
                  </View>
                )}
              </Card>
            ))
          }
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
