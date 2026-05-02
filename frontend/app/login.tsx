import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button, Input } from '../src/ui';
import { Colors, Spacing } from '../src/theme';
import { useAuth, formatErr } from '../src/api';
import { ArrowLeft } from 'lucide-react-native';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('tenant@roomzy.in');
  const [password, setPassword] = useState('tenant123');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setErr(''); setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      setErr(formatErr(e));
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} testID="back-btn" style={{ width: 44, height: 44, justifyContent: 'center' }}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 32, fontWeight: '900', color: Colors.text, marginTop: 12 }}>Welcome back</Text>
          <Text style={{ color: Colors.textMuted, marginTop: 6 }}>Log in to continue your home search.</Text>

          <View style={{ marginTop: Spacing.xl, gap: Spacing.md }}>
            <Input value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" testID="login-email" />
            <Input value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry testID="login-password" />
            {err ? <Text testID="login-error" style={{ color: Colors.error }}>{err}</Text> : null}
            <Button title="Log in" onPress={submit} loading={loading} testID="login-submit" />
            <TouchableOpacity onPress={() => router.push('/register')} testID="go-register">
              <Text style={{ textAlign: 'center', color: Colors.textMuted, marginTop: 8 }}>
                New here? <Text style={{ color: Colors.primary, fontWeight: '700' }}>Create an account</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: Spacing.xl, padding: Spacing.md, backgroundColor: Colors.bgAlt, borderRadius: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.5 }}>DEMO ACCOUNTS</Text>
            <Text style={{ marginTop: 6, color: Colors.text }}>Tenant: tenant@roomzy.in / tenant123</Text>
            <Text style={{ color: Colors.text }}>Owner: owner@roomzy.in / owner123</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
