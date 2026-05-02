import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, X } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../../src/theme';
import { Button, Input, Chip } from '../../src/ui';
import { api, formatErr } from '../../src/api';

const PT = ['room', 'pg', 'flat', 'bed'];
const FU = ['unfurnished', 'semi', 'furnished'];
const TT = ['boys', 'girls', 'family', 'any'];

export default function AddListing() {
  const [s, set] = useState<any>({
    title: '', description: '', propertyType: 'flat', monthlyRent: '',
    securityDepositRequired: false, depositAmount: '', advanceMonths: '1',
    maintenanceCharge: '', electricityIncluded: false, waterIncluded: true,
    preferredTenant: 'any', furnishing: 'semi', totalRooms: '1', availableBeds: '1',
    address: '', city: '', area: '', pincode: '', landmark: '',
    amenities: { ac: false, attachedBathroom: true, wifi: false, parking: false, foodAvailable: false, roommateAllowed: false },
    photos: [] as string[], rules: '', availableNow: true,
  });
  const [loading, setLoading] = useState(false);

  const upd = (k: string, v: any) => set((cur: any) => ({ ...cur, [k]: v }));
  const updAmen = (k: string) => set((cur: any) => ({ ...cur, amenities: { ...cur.amenities, [k]: !cur.amenities[k] } }));

  const pick = async () => {
    const r = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!r.granted) { Alert.alert('Photos permission required'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, base64: true, quality: 0.6 });
    if (!res.canceled && res.assets?.[0]?.base64) {
      const b64 = `data:image/jpeg;base64,${res.assets[0].base64}`;
      set((c: any) => ({ ...c, photos: [...c.photos, b64].slice(0, 8) }));
    }
  };

  const submit = async () => {
    if (!s.title || !s.city || !s.address || !s.monthlyRent) { Alert.alert('Missing fields', 'Title, address, city and rent are required.'); return; }
    setLoading(true);
    try {
      const payload = {
        ...s,
        monthlyRent: Number(s.monthlyRent), depositAmount: Number(s.depositAmount || 0),
        advanceMonths: Number(s.advanceMonths || 0), maintenanceCharge: Number(s.maintenanceCharge || 0),
        totalRooms: Number(s.totalRooms || 1), availableBeds: Number(s.availableBeds || 1),
      };
      await api.post('/listings', payload);
      Alert.alert('Listed!', 'Your property is live for the next 7 days free.', [{ text: 'OK', onPress: () => router.replace('/(tabs)/dashboard') }]);
    } catch (e: any) { Alert.alert('Error', formatErr(e)); } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} testID="add-back"><ArrowLeft size={24} color={Colors.text} /></TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '900', color: Colors.text }}>Add listing</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <Section title="Photos">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {s.photos.map((p: string, i: number) => (
                <View key={i} style={{ position: 'relative' }}>
                  <Image source={{ uri: p }} style={{ width: 80, height: 80, borderRadius: 12 }} />
                  <TouchableOpacity onPress={() => set((c: any) => ({ ...c, photos: c.photos.filter((_: any, j: number) => j !== i) }))}
                    style={{ position: 'absolute', top: -6, right: -6, backgroundColor: Colors.text, borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                    <X size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {s.photos.length < 8 && (
                <TouchableOpacity onPress={pick} testID="pick-photo" style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: Colors.bgAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' }}>
                  <Camera size={22} color={Colors.text} />
                  <Text style={{ fontSize: 11, color: Colors.text, marginTop: 4 }}>Add</Text>
                </TouchableOpacity>
              )}
            </View>
          </Section>

          <Section title="Basic info">
            <Field label="Title"><Input value={s.title} onChangeText={(v: string) => upd('title', v)} placeholder="Cozy 1BHK in Indiranagar" testID="f-title" /></Field>
            <Field label="Description"><Input value={s.description} onChangeText={(v: string) => upd('description', v)} placeholder="Tell tenants what makes your place special" multiline testID="f-desc" /></Field>
            <Field label="Property type"><ChipRow items={PT} value={s.propertyType} onChange={(v) => upd('propertyType', v)} prefix="pt" /></Field>
            <Field label="Furnishing"><ChipRow items={FU} value={s.furnishing} onChange={(v) => upd('furnishing', v)} prefix="fu" /></Field>
            <Field label="Preferred tenant"><ChipRow items={TT} value={s.preferredTenant} onChange={(v) => upd('preferredTenant', v)} prefix="tt" /></Field>
          </Section>

          <Section title="Pricing (₹)">
            <Field label="Monthly rent"><Input value={s.monthlyRent} onChangeText={(v: string) => upd('monthlyRent', v)} placeholder="15000" keyboardType="numeric" testID="f-rent" /></Field>
            <Field label="Security deposit"><Input value={s.depositAmount} onChangeText={(v: string) => { upd('depositAmount', v); upd('securityDepositRequired', !!v); }} placeholder="0 if none" keyboardType="numeric" testID="f-deposit" /></Field>
            <Field label="Advance months"><Input value={s.advanceMonths} onChangeText={(v: string) => upd('advanceMonths', v)} keyboardType="numeric" testID="f-advance" /></Field>
            <Field label="Maintenance / mo"><Input value={s.maintenanceCharge} onChangeText={(v: string) => upd('maintenanceCharge', v)} keyboardType="numeric" placeholder="0" testID="f-maint" /></Field>
          </Section>

          <Section title="Address">
            <Field label="Street address"><Input value={s.address} onChangeText={(v: string) => upd('address', v)} testID="f-addr" /></Field>
            <Field label="City"><Input value={s.city} onChangeText={(v: string) => upd('city', v)} placeholder="Bengaluru" testID="f-city" /></Field>
            <Field label="Area"><Input value={s.area} onChangeText={(v: string) => upd('area', v)} placeholder="Koramangala" testID="f-area" /></Field>
            <Field label="Pincode"><Input value={s.pincode} onChangeText={(v: string) => upd('pincode', v)} keyboardType="numeric" testID="f-pin" /></Field>
            <Field label="Landmark"><Input value={s.landmark} onChangeText={(v: string) => upd('landmark', v)} placeholder="Near Metro station" testID="f-lmk" /></Field>
          </Section>

          <Section title="Amenities">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(['wifi', 'ac', 'parking', 'attachedBathroom', 'foodAvailable', 'roommateAllowed'] as const).map((k) => (
                <Chip key={k} label={k.replace(/([A-Z])/g, ' $1')} active={s.amenities[k]} onPress={() => updAmen(k)} testID={`am-${k}`} />
              ))}
            </View>
          </Section>

          <Section title="Rooms">
            <Field label="Total rooms"><Input value={s.totalRooms} onChangeText={(v: string) => upd('totalRooms', v)} keyboardType="numeric" testID="f-rooms" /></Field>
            <Field label="Available beds"><Input value={s.availableBeds} onChangeText={(v: string) => upd('availableBeds', v)} keyboardType="numeric" testID="f-beds" /></Field>
            <Field label="House rules"><Input value={s.rules} onChangeText={(v: string) => upd('rules', v)} placeholder="No smoking, no pets…" multiline testID="f-rules" /></Field>
          </Section>

          <Button title="Publish (free for 7 days)" onPress={submit} loading={loading} testID="submit-listing" style={{ marginTop: Spacing.lg }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({ title, children }: any) {
  return (
    <View style={{ marginTop: Spacing.lg }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.6, marginBottom: 10 }}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}
function Field({ label, children }: any) { return (<View style={{ marginBottom: 12 }}><Text style={{ fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 }}>{label}</Text>{children}</View>); }
function ChipRow({ items, value, onChange, prefix }: any) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {items.map((i: string) => <Chip key={i} label={i} active={value === i} onPress={() => onChange(i)} testID={`${prefix}-${i}`} />)}
    </View>
  );
}
