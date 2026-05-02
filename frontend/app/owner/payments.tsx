import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Colors, Spacing } from '../../src/theme';
import { Card, Pill } from '../../src/ui';
import { api } from '../../src/api';

export default function Payments() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { const { data } = await api.get('/payments/my'); setItems(data.results || []); } finally { setLoading(false); } })(); }, []);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} color={Colors.text} /></TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900', color: Colors.text }}>Payments</Text>
      </View>
      {loading ? <ActivityIndicator color={Colors.primary} /> : (
        <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 40 }}>
          {items.length === 0 ? <Text style={{ color: Colors.textMuted, textAlign: 'center', marginTop: 40 }}>No payments yet.</Text> :
            items.map((p) => (
              <Card key={p.id} style={{ padding: Spacing.md, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontWeight: '800', color: Colors.text }}>{p.purpose.replace('_', ' ')}</Text>
                    <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>{p.listing?.title || ''}</Text>
                    <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>{new Date(p.createdAt).toLocaleString()}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontWeight: '900', fontSize: 18, color: Colors.text }}>₹{p.amount}</Text>
                    <Pill text={p.status.toUpperCase()} bg={p.status === 'paid' ? '#ECFDF5' : Colors.bgAlt} color={p.status === 'paid' ? '#10B981' : Colors.text} />
                  </View>
                </View>
              </Card>
            ))
          }
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
