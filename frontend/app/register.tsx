import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Input } from '../src/ui';
import { Colors, Spacing, Radius } from '../src/theme';
import { useAuth, formatErr } from '../src/api';
import { ArrowLeft, Home, Building2, User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react-native';

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState<'tenant' | 'owner'>('tenant');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const styles = makeStyles();

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
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
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
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.sub}>Join Roomzy in 30 seconds.</Text>

          <Text style={styles.sectionLabel}>I AM A…</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <RolePick active={role === 'tenant'} onPress={() => setRole('tenant')} icon={<Home size={22} color={role === 'tenant' ? '#fff' : Colors.primary} />} label="Tenant" sub="Looking for a room" testID="role-tenant" />
            <RolePick active={role === 'owner'} onPress={() => setRole('owner')} icon={<Building2 size={22} color={role === 'owner' ? '#fff' : Colors.primary} />} label="Owner" sub="Listing my property" testID="role-owner" />
          </View>

          <View style={{ marginTop: Spacing.lg, gap: 12 }}>
            <InputField icon={<User size={18} color={Colors.textMuted} />} value={name} onChangeText={setName} placeholder="Full name" testID="reg-name" />
            <InputField icon={<Mail size={18} color={Colors.textMuted} />} value={email} onChangeText={setEmail} placeholder="Email address" keyboardType="email-address" autoCapitalize="none" testID="reg-email" />
            <InputField icon={<Phone size={18} color={Colors.textMuted} />} value={phone} onChangeText={setPhone} placeholder="Phone (optional)" keyboardType="phone-pad" testID="reg-phone" />
            <InputField
              icon={<Lock size={18} color={Colors.textMuted} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={18} color={Colors.textMuted} /> : <Eye size={18} color={Colors.textMuted} />}
                </TouchableOpacity>
              }
              value={password} onChangeText={setPassword} placeholder="Password (min 6 chars)" secureTextEntry={!showPw} testID="reg-password"
            />
            {err ? <Text testID="reg-error" style={styles.error}>⚠ {err}</Text> : null}

            <Button title="Create account →" onPress={submit} loading={loading} testID="reg-submit" style={{ marginTop: 8 }} />

            <TouchableOpacity onPress={() => router.push('/login')} testID="go-login" style={{ alignItems: 'center', marginTop: 14 }}>
              <Text style={{ color: Colors.textMuted, fontSize: 14 }}>
                Already have an account? <Text style={{ color: Colors.primary, fontWeight: '700' }}>Log in</Text>
              </Text>
            </TouchableOpacity>

            <Text style={{ color: Colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 16, lineHeight: 16 }}>
              By continuing, you agree to Roomzy's{'\n'}Terms & Privacy Policy.
            </Text>
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

function RolePick({ active, onPress, icon, label, sub, testID }: any) {
  return (
    <TouchableOpacity testID={testID} onPress={onPress} activeOpacity={0.85}
      style={{
        flex: 1, padding: 14, borderRadius: Radius.lg,
        backgroundColor: active ? Colors.primary : Colors.bgAlt,
        borderWidth: 1.5, borderColor: active ? Colors.primary : 'transparent',
      }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: active ? 'rgba(255,255,255,0.2)' : Colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </View>
      <Text style={{ marginTop: 10, fontWeight: '800', fontSize: 15, color: active ? '#fff' : Colors.text }}>{label}</Text>
      <Text style={{ fontSize: 12, color: active ? 'rgba(255,255,255,0.8)' : Colors.textMuted, marginTop: 2 }}>{sub}</Text>
    </TouchableOpacity>
  );
}

const makeStyles = () => StyleSheet.create({
  hero: { height: 200, position: 'relative', overflow: 'hidden' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  logoWrap: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  logo: { width: 140, height: 100, resizeMode: 'contain' },
  curve: { position: 'absolute', bottom: -1, left: 0, right: 0, height: 28, backgroundColor: Colors.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  content: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.text, letterSpacing: -0.8 },
  sub: { color: Colors.textMuted, marginTop: 6, fontSize: 14 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1, marginTop: 24, marginBottom: 10 },
  error: { color: Colors.error, fontSize: 13, fontWeight: '600' },
});
