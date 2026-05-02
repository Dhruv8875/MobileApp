import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Plus, Eye, Users, Wallet, Edit3, Trash2, RefreshCw, Star } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../../src/theme';
import { Button, Pill, Card } from '../../src/ui';
import { api, useAuth } from '../../src/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ active: 0, visits: 0, leads: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/listings/mine/list');
      const mine = data.results || [];
      setItems(mine);
      const active = mine.filter((l: any) => l.isLive).length;
      const visits = mine.reduce((s: number, l: any) => s + (l.profileVisits || 0), 0);
      const leads = mine.reduce((s: number, l: any) => s + (l.leads || 0), 0);
      setStats({ active, visits, leads });
    } catch {} finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = async (id: string) => {
    Alert.alert('Delete listing?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await api.delete(`/listings/${id}`); load(); } },
    ]);
  };

  const renew = async (id: string) => {
    try {
      const { data } = await api.post('/payments/create-order', { purpose: 'listing_renewal', listingId: id });
      const res = await api.post('/payments/verify', { paymentId: data.paymentId, mock: true });
      const until = res?.data?.payment?.updatedAt ? '' : '';
      Alert.alert('✅ Renewed for 30 days', 'Listing extended. (Payment mocked — add Razorpay keys later to charge real money.)');
      load();
    } catch (e: any) { Alert.alert('Error', e?.response?.data?.detail || e?.message || 'Failed'); }
  };

  const feature = async (id: string) => {
    try {
      const { data } = await api.post('/payments/create-order', { purpose: 'featured_listing', listingId: id });
      await api.post('/payments/verify', { paymentId: data.paymentId, mock: true });
      Alert.alert('⭐ Featured!', 'Listing is now top-placed for 30 days. (Payment mocked.)');
      load();
    } catch (e: any) { Alert.alert('Error', e?.response?.data?.detail || e?.message || 'Failed'); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 40 }}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: Colors.text, letterSpacing: -0.6 }}>Dashboard</Text>
        <Text style={{ color: Colors.textMuted, marginTop: 2 }}>Hi {user?.name?.split(' ')[0]}, here's your activity</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: Spacing.md }}>
          <StatCard icon={<Eye size={18} color={Colors.primary} />} label="Profile visits" value={stats.visits} />
          <StatCard icon={<Users size={18} color={Colors.primary} />} label="Total leads" value={stats.leads} />
          <StatCard icon={<Wallet size={18} color={Colors.primary} />} label="Active listings" value={stats.active} />
          <StatCard icon={<Star size={18} color={Colors.primary} />} label="Verified" value={user?.isVerifiedOwner ? 'Yes' : 'No'} />
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: Spacing.lg }}>
          <Button title="+ Add new listing" onPress={() => router.push('/owner/add-listing')} testID="add-listing-btn" style={{ flex: 1 }} />
          <Button title="Leads" variant="secondary" onPress={() => router.push('/owner/leads')} testID="view-leads-btn" />
        </View>

        {!user?.isVerifiedOwner && (
          <TouchableOpacity
            onPress={async () => {
              try {
                const { data } = await api.post('/payments/create-order', { purpose: 'owner_verification' });
                await api.post('/payments/verify', { paymentId: data.paymentId, mock: true });
                Alert.alert('Verified!', 'You now have a Verified Owner badge ⭐');
                load();
              } catch (e: any) { Alert.alert('Error', e?.message); }
            }}
            style={{ marginTop: Spacing.md, padding: Spacing.md, borderRadius: Radius.xl, backgroundColor: Colors.primaryLight, flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            <Star size={22} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: Colors.text }}>Get Verified Owner badge</Text>
              <Text style={{ fontSize: 12, color: Colors.textMuted }}>₹199 — boost trust & lead conversions</Text>
            </View>
          </TouchableOpacity>
        )}

        <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.text, marginTop: Spacing.xl }}>Your listings</Text>
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
        ) : items.length === 0 ? (
          <Text style={{ color: Colors.textMuted, marginTop: 12 }}>No listings yet. Add your first one!</Text>
        ) : (
          items.map((l) => (
            <Card key={l.id} style={{ marginTop: 12, padding: Spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.text }}>{l.title}</Text>
                  <Text style={{ color: Colors.textMuted, marginTop: 2 }}>{l.area}, {l.city} · ₹{l.monthlyRent.toLocaleString('en-IN')}/mo</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                    <Pill text={l.isLive ? 'LIVE' : 'EXPIRED'} bg={l.isLive ? '#ECFDF5' : '#FEE2E2'} color={l.isLive ? '#10B981' : '#DC2626'} />
                    {l.isFeatured && <Pill text="⭐ FEATURED" bg={Colors.primaryLight} color={Colors.primary} />}
                  </View>
                  <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 6 }}>👁 {l.profileVisits || 0} visits · 📞 {l.leads || 0} leads</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: Spacing.md, flexWrap: 'wrap' }}>
                <ActionBtn icon={<RefreshCw size={14} color={Colors.text} />} label="Renew ₹99" onPress={() => renew(l.id)} testID={`renew-${l.id}`} />
                <ActionBtn icon={<Star size={14} color={Colors.text} />} label="Feature ₹299" onPress={() => feature(l.id)} testID={`feature-${l.id}`} />
                <ActionBtn icon={<Trash2 size={14} color="#DC2626" />} label="Delete" onPress={() => remove(l.id)} danger testID={`delete-${l.id}`} />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value }: any) {
  return (
    <View style={{ width: '48%', backgroundColor: Colors.bgAlt, borderRadius: Radius.xl, padding: Spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>{icon}<Text style={{ fontSize: 12, color: Colors.textMuted, fontWeight: '600' }}>{label}</Text></View>
      <Text style={{ fontSize: 26, fontWeight: '900', color: Colors.text, marginTop: 6, letterSpacing: -0.5 }}>{value}</Text>
    </View>
  );
}

function ActionBtn({ icon, label, onPress, danger, testID }: any) {
  return (
    <TouchableOpacity onPress={onPress} testID={testID}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1, borderColor: danger ? '#FEE2E2' : Colors.border, backgroundColor: danger ? '#FEF2F2' : Colors.bg }}>
      {icon}<Text style={{ fontSize: 12, fontWeight: '700', color: danger ? '#DC2626' : Colors.text }}>{label}</Text>
    </TouchableOpacity>
  );
}
