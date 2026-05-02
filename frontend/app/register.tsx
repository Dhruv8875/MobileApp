import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button, Input } from '../src/ui';
import { Colors, Spacing } from '../src/theme';
import { useAuth, formatErr } from '../src/api';
import { ArrowLeft, Home, Building2 } from 'lucide-react-native';

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'tenant' | 'owner'>('tenant');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setErr('');
    if (!name.trim() || !email.trim() || password.length < 6) { setErr('All fields required, password ≥ 6 chars'); return; }
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim().toLowerCase(), password, role, phone: phone.trim() });
      router.replace('/(tabs)');
    } catch (e: any) { setErr(formatErr(e)); } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, flexGrow: 1, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} testID="back-btn" style={{ width: 44, height: 44, justifyContent: 'center' }}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 32, fontWeight: '900', color: Colors.text, marginTop: 12 }}>Create account</Text>
          <Text style={{ color: Colors.textMuted, marginTop: 6 }}>Join Roomzy in 30 seconds.</Text>

          <Text style={{ fontWeight: '700', marginTop: Spacing.xl, marginBottom: 8, color: Colors.text }}>I am a…</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <RolePick active={role === 'tenant'} onPress={() => setRole('tenant')} icon={<Home size={22} color={role === 'tenant' ? '#fff' : Colors.text} />} label="Tenant" sub="Looking for a room" testID="role-tenant" />
            <RolePick active={role === 'owner'} onPress={() => setRole('owner')} icon={<Building2 size={22} color={role === 'owner' ? '#fff' : Colors.text} />} label="Owner" sub="Listing my property" testID="role-owner" />
          </View>

          <View style={{ marginTop: Spacing.lg, gap: Spacing.md }}>
            <Input value={name} onChangeText={setName} placeholder="Full name" testID="reg-name" />
            <Input value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" testID="reg-email" />
            <Input value={phone} onChangeText={setPhone} placeholder="Phone (optional)" keyboardType="phone-pad" testID="reg-phone" />
            <Input value={password} onChangeText={setPassword} placeholder="Password (min 6 chars)" secureTextEntry testID="reg-password" />
            {err ? <Text testID="reg-error" style={{ color: Colors.error }}>{err}</Text> : null}
            <Button title="Create account" onPress={submit} loading={loading} testID="reg-submit" />
            <TouchableOpacity onPress={() => router.push('/login')} testID="go-login">
              <Text style={{ textAlign: 'center', color: Colors.textMuted, marginTop: 8 }}>
                Already have an account? <Text style={{ color: Colors.primary, fontWeight: '700' }}>Log in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RolePick({ active, onPress, icon, label, sub, testID }: any) {
  return (
    <TouchableOpacity testID={testID} onPress={onPress} activeOpacity={0.85}
      style={{
        flex: 1, padding: 16, borderRadius: 16,
        backgroundColor: active ? Colors.text : Colors.bgAlt,
        borderWidth: 1.5, borderColor: active ? Colors.text : 'transparent',
      }}
    >
      {icon}
      <Text style={{ marginTop: 8, fontWeight: '800', color: active ? '#fff' : Colors.text }}>{label}</Text>
      <Text style={{ fontSize: 12, color: active ? 'rgba(255,255,255,0.7)' : Colors.textMuted, marginTop: 2 }}>{sub}</Text>
    </TouchableOpacity>
  );
}
