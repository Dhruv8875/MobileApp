import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LogOut, Mail, Phone, ShieldCheck, ChevronRight } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../../src/theme';
import { Card, Pill } from '../../src/ui';
import { useAuth } from '../../src/api';

export default function Profile() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 40 }}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: Colors.text, letterSpacing: -0.6 }}>Profile</Text>

        <Card style={{ marginTop: Spacing.md, padding: Spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Image
              source={{ uri: user.avatar || 'https://images.unsplash.com/photo-1737574821698-862e77f044c1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNzl8MHwxfHNlYXJjaHwzfHx5b3VuZyUyMHByb2Zlc3Npb25hbCUyMHBvcnRyYWl0fGVufDB8fHx8MTc3NzcxNzAyMXww&ixlib=rb-4.1.0&q=85' }}
              style={{ width: 64, height: 64, borderRadius: 32 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.text }}>{user.name}</Text>
              <Text style={{ color: Colors.textMuted, marginTop: 2 }}>{user.email}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                <Pill text={user.role.toUpperCase()} bg={Colors.primaryLight} color={Colors.primary} />
                {user.isVerifiedOwner && <Pill text="⭐ VERIFIED" bg="#ECFDF5" color="#10B981" />}
              </View>
            </View>
          </View>
        </Card>

        <Card style={{ marginTop: Spacing.md }}>
          <Row icon={<Mail size={18} color={Colors.text} />} label="Email" value={user.email} />
          <Row icon={<Phone size={18} color={Colors.text} />} label="Phone" value={user.phone || 'Not set'} />
          {user.role === 'owner' && (
            <Row icon={<ShieldCheck size={18} color={Colors.text} />} label="Verified Owner" value={user.isVerifiedOwner ? 'Yes' : 'No'} />
          )}
        </Card>

        {user.role === 'owner' && (
          <Card style={{ marginTop: Spacing.md }}>
            <NavRow label="My Payments" onPress={() => router.push('/owner/payments')} testID="row-payments" />
            <NavRow label="My Leads" onPress={() => router.push('/owner/leads')} testID="row-leads" />
          </Card>
        )}

        <TouchableOpacity
          testID="logout-btn"
          onPress={() => Alert.alert('Log out?', '', [{ text: 'Cancel', style: 'cancel' }, { text: 'Log out', style: 'destructive', onPress: async () => { await logout(); router.replace('/'); } }])}
          style={{ marginTop: Spacing.lg, padding: Spacing.md, borderRadius: Radius.xl, backgroundColor: '#FEF2F2', flexDirection: 'row', alignItems: 'center', gap: 10 }}
        >
          <LogOut size={18} color="#DC2626" />
          <Text style={{ color: '#DC2626', fontWeight: '700' }}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ icon, label, value }: any) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderColor: Colors.border, gap: 12 }}>
      {icon}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: Colors.textMuted, fontWeight: '600' }}>{label}</Text>
        <Text style={{ fontSize: 15, color: Colors.text, marginTop: 2 }}>{value}</Text>
      </View>
    </View>
  );
}
function NavRow({ label, onPress, testID }: any) {
  return (
    <TouchableOpacity testID={testID} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1, borderColor: Colors.border }}>
      <Text style={{ fontWeight: '600', color: Colors.text }}>{label}</Text>
      <ChevronRight size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}
