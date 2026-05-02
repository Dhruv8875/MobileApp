import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Input } from '../src/ui';
import { Colors, Spacing, Radius } from '../src/theme';
import { useAuth, formatErr } from '../src/api';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('tenant@roomzy.in');
  const [password, setPassword] = useState('tenant123');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const styles = makeStyles();

  const submit = async () => {
    setErr(''); setLoading(true);
    try { await login(email.trim(), password); router.replace('/(tabs)'); }
    catch (e: any) { setErr(formatErr(e)); }
    finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Compact hero */}
      <View style={styles.hero}>
        <LinearGradient colors={['#000', '#0B1233']} style={StyleSheet.absoluteFill} />
        <SafeAreaView edges={['top']} style={{ flex: 1, paddingHorizontal: Spacing.md }}>
          <TouchableOpacity onPress={() => router.back()} testID="back-btn" style={styles.backBtn}>
            <ArrowLeft size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.logoWrap}>
            <Image source={require('../assets/images/roomzy-logo-transparent.png')} style={styles.logo} />
          </View>
        </SafeAreaView>
        <View style={styles.curve} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Welcome back 👋</Text>
          <Text style={styles.sub}>Log in to continue your home search.</Text>

          <View style={{ marginTop: Spacing.xl, gap: 12 }}>
            <InputField icon={<Mail size={18} color={Colors.textMuted} />} value={email} onChangeText={setEmail} placeholder="Email address" keyboardType="email-address" autoCapitalize="none" testID="login-email" />
            <InputField
              icon={<Lock size={18} color={Colors.textMuted} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={18} color={Colors.textMuted} /> : <Eye size={18} color={Colors.textMuted} />}
                </TouchableOpacity>
              }
              value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry={!showPw} testID="login-password"
            />
            {err ? <Text testID="login-error" style={styles.error}>⚠ {err}</Text> : null}

            <Button title="Log in →" onPress={submit} loading={loading} testID="login-submit" style={{ marginTop: 8 }} />

            <TouchableOpacity onPress={() => router.push('/register')} testID="go-register" style={{ alignItems: 'center', marginTop: 14 }}>
              <Text style={{ color: Colors.textMuted, fontSize: 14 }}>
                New here? <Text style={{ color: Colors.primary, fontWeight: '700' }}>Create an account</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.demoCard}>
            <Text style={styles.demoTitle}>DEMO ACCOUNTS</Text>
            <DemoRow label="Tenant" email="tenant@roomzy.in" pw="tenant123" onTap={() => { setEmail('tenant@roomzy.in'); setPassword('tenant123'); }} />
            <DemoRow label="Owner" email="owner@roomzy.in" pw="owner123" onTap={() => { setEmail('owner@roomzy.in'); setPassword('owner123'); }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function InputField({ icon, rightIcon, ...rest }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: Colors.bgAlt, borderRadius: Radius.lg,
      borderWidth: 1.5, borderColor: focused ? Colors.primary : 'transparent',
      paddingHorizontal: 14, minHeight: 56,
    }}>
      {icon}
      <View style={{ flex: 1, marginHorizontal: 10 }}>
        <Input {...rest} />
      </View>
      {rightIcon}
    </View>
  );
}

function DemoRow({ label, email, pw, onTap }: any) {
  return (
    <TouchableOpacity onPress={onTap} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: Colors.primary, fontWeight: '900' }}>{label[0]}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: Colors.text, fontWeight: '700', fontSize: 13 }}>{label}</Text>
        <Text style={{ color: Colors.textMuted, fontSize: 11 }}>{email} · {pw}</Text>
      </View>
      <Text style={{ color: Colors.primary, fontSize: 11, fontWeight: '700' }}>TAP TO FILL</Text>
    </TouchableOpacity>
  );
}

const makeStyles = () => StyleSheet.create({
  hero: { height: 240, position: 'relative', overflow: 'hidden' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  logoWrap: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  logo: { width: 160, height: 120, resizeMode: 'contain' },
  curve: { position: 'absolute', bottom: -1, left: 0, right: 0, height: 28, backgroundColor: Colors.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  content: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.text, letterSpacing: -0.8 },
  sub: { color: Colors.textMuted, marginTop: 6, fontSize: 14 },
  error: { color: Colors.error, fontSize: 13, fontWeight: '600' },
  demoCard: { marginTop: Spacing.xl, padding: Spacing.md, backgroundColor: Colors.bgAlt, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border },
  demoTitle: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1, marginBottom: 8 },
});
