import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LogOut, Mail, Phone, ShieldCheck, ChevronRight, Sun, Moon, Smartphone, Trash2 } from 'lucide-react-native';
import Header from '../../src/Header';
import { Colors, Spacing, Radius } from '../../src/theme';
import { Card, Pill } from '../../src/ui';
import { useAuth, formatErr } from '../../src/api';
import { useAppTheme } from '../../src/ThemeProvider';


export default function Profile() {
  const { user, logout, deleteAccount } = useAuth();
  const { mode, effective, setMode } = useAppTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (deleteText.trim().toUpperCase() !== 'DELETE') return;
    setDeleting(true);
    try {
      await deleteAccount();
    } catch (e) {
      Alert.alert('Could not delete account', formatErr(e));
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDeleteText('');
    }
  };

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

        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: Colors.textMuted,
            letterSpacing: 0.6,
            marginTop: Spacing.lg,
            marginBottom: 8,
            marginLeft: 4,
          }}
        >
          APPEARANCE
        </Text>

        <View
          style={{
            backgroundColor: Colors.bgAlt,
            borderRadius: 999,
            padding: 4,
            flexDirection: 'row',
            gap: 4,
          }}
        >

          {/* LIGHT */}
          <TouchableOpacity
            onPress={() => setMode('light')}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: mode === 'light' ? Colors.primary : 'transparent',
            }}
          >
            <Sun size={16} color={mode === 'light' ? '#fff' : Colors.textMuted} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: mode === 'light' ? '#fff' : Colors.textMuted,
              }}
            >
              Light
            </Text>
          </TouchableOpacity>

          {/* DARK */}
          <TouchableOpacity
            onPress={() => setMode('dark')}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: mode === 'dark' ? Colors.primary : 'transparent',
            }}
          >
            <Moon size={16} color={mode === 'dark' ? '#fff' : Colors.textMuted} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: mode === 'dark' ? '#fff' : Colors.textMuted,
              }}
            >
              Dark
            </Text>
          </TouchableOpacity>

          {/* SYSTEM */}
          <TouchableOpacity
            onPress={() => setMode('system')}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: mode === 'system' ? Colors.primary : 'transparent',
            }}
          >
            <Smartphone size={16} color={mode === 'system' ? '#fff' : Colors.textMuted} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: mode === 'system' ? '#fff' : Colors.textMuted,
              }}
            >
              System
            </Text>
          </TouchableOpacity>

        </View>
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
            <NavRow label="Plans & Subscription" onPress={() => router.push('/owner/plans')} testID="row-plans" />
            <NavRow label="My Payments" onPress={() => router.push('/owner/payments')} testID="row-payments" />
            <NavRow label="My Leads" onPress={() => router.push('/owner/leads')} testID="row-leads" last />
          </Card>
        )}

        <TouchableOpacity
          testID="logout-btn"
          onPress={() => setShowLogoutModal(true)}
          style={{
            marginTop: Spacing.lg,
            padding: Spacing.md,
            borderRadius: Radius.xl,
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: Colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            justifyContent: 'center'
          }}
        >
          <LogOut size={18} color={Colors.error} />
          <Text style={{ color: Colors.error, fontWeight: '700' }}>Log out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="delete-account-btn"
          onPress={() => setShowDeleteModal(true)}
          style={{
            marginTop: Spacing.md,
            padding: Spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            justifyContent: 'center',
          }}
        >
          <Trash2 size={16} color={Colors.textMuted} />
          <Text style={{ color: Colors.textMuted, fontWeight: '600', fontSize: 13 }}>Delete account</Text>
        </TouchableOpacity>
      </ScrollView>
    <Modal visible={showLogoutModal} transparent animationType="fade">
  <View
    style={{
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    }}
  >
    <View
      style={{
        width: '100%',
        borderRadius: 20,
        backgroundColor: Colors.surface,
        paddingVertical: 24, // 🔥 more height
        paddingHorizontal: 20,
        alignItems: 'center',
      }}
    >

      {/* 🔥 ICON */}
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: Colors.error + '20', // light red bg
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <LogOut size={28} color={Colors.error} />
      </View>

      {/* TITLE */}
      <Text
        style={{
          fontSize: 18,
          fontWeight: '800',
          color: Colors.text,
        }}
      >
        Log out
      </Text>

      {/* SUBTITLE */}
      <Text
        style={{
          marginTop: 6,
          fontSize: 13,
          color: Colors.textMuted,
          textAlign: 'center',
          lineHeight: 18,
        }}
      >
        Are you sure you want to log out of your account?
      </Text>

      {/* BUTTONS */}
      <View
        style={{
          flexDirection: 'row',
          marginTop: 20,
          gap: 10,
          width: '100%',
        }}
      >
        {/* Cancel */}
        <TouchableOpacity
          onPress={() => setShowLogoutModal(false)}
          style={{
            flex: 1,
            paddingVertical: 13,
            borderRadius: 12,
            backgroundColor: Colors.bgAlt,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: Colors.text, fontWeight: '600' }}>
            Cancel
          </Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          onPress={() => {
            setShowLogoutModal(false);
            logout();
          }}
          style={{
            flex: 1,
            paddingVertical: 13,
            borderRadius: 12,
            backgroundColor: Colors.error,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>
            Log out
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  </View>
</Modal>

    <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ width: '100%', borderRadius: 20, backgroundColor: Colors.surface, paddingVertical: 24, paddingHorizontal: 20, alignItems: 'center' }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.error + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Trash2 size={28} color={Colors.error} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.text }}>Delete account</Text>
          <Text style={{ marginTop: 6, fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 }}>
            This permanently deletes your account, listings, leads and payment history. This cannot be undone. Type DELETE to confirm.
          </Text>
          <TextInput
            testID="delete-confirm-input"
            value={deleteText}
            onChangeText={setDeleteText}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="DELETE"
            placeholderTextColor={Colors.textMuted}
            style={{ width: '100%', marginTop: 16, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgAlt, color: Colors.text, fontWeight: '700', textAlign: 'center', letterSpacing: 2 }}
          />
          <View style={{ flexDirection: 'row', marginTop: 20, gap: 10, width: '100%' }}>
            <TouchableOpacity
              onPress={() => { setShowDeleteModal(false); setDeleteText(''); }}
              disabled={deleting}
              style={{ flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: Colors.bgAlt, alignItems: 'center' }}
            >
              <Text style={{ color: Colors.text, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="delete-confirm-btn"
              onPress={confirmDelete}
              disabled={deleting || deleteText.trim().toUpperCase() !== 'DELETE'}
              style={{ flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', backgroundColor: deleteText.trim().toUpperCase() === 'DELETE' ? Colors.error : Colors.error + '55' }}
            >
              {deleting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Delete</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
