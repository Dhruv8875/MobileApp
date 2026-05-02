import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LogOut, Mail, Phone, ShieldCheck, ChevronRight, Sun, Moon, Smartphone } from 'lucide-react-native';
import Header from '../../src/Header';
import { Colors, Spacing, Radius } from '../../src/theme';
import { Card, Pill } from '../../src/ui';
import { useAuth } from '../../src/api';
import { useAppTheme } from '../../src/ThemeProvider';

export default function Profile() {
  const { user, logout } = useAuth();
  const { mode, effective, setMode } = useAppTheme();
  if (!user) return null;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={[]}>
      <Header />
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 40 }}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: Colors.text, letterSpacing: -0.6 }}>Profile</Text>

        <Card style={{ marginTop: Spacing.md, padding: Spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: Colors.primary }}>{(user.name?.[0] || 'R').toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.text }}>{user.name}</Text>
              <Text style={{ color: Colors.textMuted, marginTop: 2 }}>{user.email}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                <Pill text={user.role.toUpperCase()} bg={Colors.primaryLight} color={Colors.primary} />
                {user.isVerifiedOwner && <Pill text="⭐ VERIFIED" bg={Colors.accentLight} color={Colors.accent} />}
              </View>
            </View>
          </View>
        </Card>

        <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.6, marginTop: Spacing.lg, marginBottom: 8, marginLeft: 4 }}>APPEARANCE</Text>
        <Card>
          <View style={{ flexDirection: 'row', padding: 6, gap: 6 }}>
            <ThemeChip active={mode === 'light'} label="Light" icon={<Sun size={16} color={mode === 'light' ? '#fff' : Colors.text} />} onPress={() => setMode('light')} testID="theme-light" />
            <ThemeChip active={mode === 'dark'} label="Dark" icon={<Moon size={16} color={mode === 'dark' ? '#fff' : Colors.text} />} onPress={() => setMode('dark')} testID="theme-dark" />
            <ThemeChip active={mode === 'system'} label="System" icon={<Smartphone size={16} color={mode === 'system' ? '#fff' : Colors.text} />} onPress={() => setMode('system')} testID="theme-system" />
          </View>
          <View style={{ paddingHorizontal: Spacing.md, paddingBottom: 12 }}>
            <Text style={{ fontSize: 12, color: Colors.textMuted }}>Currently: {effective === 'dark' ? '🌙 Dark' : '☀️ Light'} mode</Text>
          </View>
        </Card>

        <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.6, marginTop: Spacing.lg, marginBottom: 8, marginLeft: 4 }}>CONTACT</Text>
        <Card>
          <Row icon={<Mail size={18} color={Colors.text} />} label="Email" value={user.email} />
          <Row icon={<Phone size={18} color={Colors.text} />} label="Phone" value={user.phone || 'Not set'} last />
          {user.role === 'owner' && (
            <Row icon={<ShieldCheck size={18} color={Colors.text} />} label="Verified Owner" value={user.isVerifiedOwner ? 'Yes' : 'No'} last />
          )}
        </Card>

        {user.role === 'owner' && (
          <Card style={{ marginTop: Spacing.md }}>
            <NavRow label="My Payments" onPress={() => router.push('/owner/payments')} testID="row-payments" />
            <NavRow label="My Leads" onPress={() => router.push('/owner/leads')} testID="row-leads" last />
          </Card>
        )}

        <TouchableOpacity
          testID="logout-btn"
          onPress={() => Alert.alert('Log out?', '', [{ text: 'Cancel', style: 'cancel' }, { text: 'Log out', style: 'destructive', onPress: () => { logout(); } }])}
          style={{ marginTop: Spacing.lg, padding: Spacing.md, borderRadius: Radius.xl, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' }}
        >
          <LogOut size={18} color={Colors.error} />
          <Text style={{ color: Colors.error, fontWeight: '700' }}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function ThemeChip({ active, label, icon, onPress, testID }: any) {
  return (
    <TouchableOpacity testID={testID} onPress={onPress}
      style={{
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 10, borderRadius: Radius.md,
        backgroundColor: active ? Colors.primary : 'transparent',
      }}>
      {icon}
      <Text style={{ color: active ? '#fff' : Colors.text, fontWeight: '700', fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  );
}

function Row({ icon, label, value, last }: any) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: last ? 0 : 1, borderColor: Colors.border, gap: 12 }}>
      {icon}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: Colors.textMuted, fontWeight: '600' }}>{label}</Text>
        <Text style={{ fontSize: 15, color: Colors.text, marginTop: 2 }}>{value}</Text>
      </View>
    </View>
  );
}
function NavRow({ label, onPress, testID, last }: any) {
  return (
    <TouchableOpacity testID={testID} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: last ? 0 : 1, borderColor: Colors.border }}>
      <Text style={{ fontWeight: '600', color: Colors.text }}>{label}</Text>
      <ChevronRight size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}
