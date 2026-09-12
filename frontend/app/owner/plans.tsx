import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Check, BadgeCheck, Sparkles } from 'lucide-react-native';
import Header from '../../src/Header';
import { Colors, Spacing, Radius } from '../../src/theme';
import { Button, Pill } from '../../src/ui';
import { api, useAuth } from '../../src/api';
import { usePayments } from '../../src/payments';

type Plan = { key: string; months: number; price: number; label: string };

const DEFAULT_PLANS: Plan[] = [
  { key: '1m', months: 1, price: 99, label: '1 Month' },
  { key: '3m', months: 3, price: 249, label: '3 Months' },
  { key: '6m', months: 6, price: 499, label: '6 Months' },
  { key: '12m', months: 12, price: 899, label: '1 Year' },
];
// One-month price is the baseline we compute savings against.
const BASE_MONTHLY = 99;
const TAGS: Record<string, string> = { '3m': 'POPULAR', '12m': 'BEST VALUE' };

const PERKS = [
  'All your listings stay live',
  'Verified Owner badge included',
  'Unlimited leads & enquiries',
  'Appear in map & "near me" search',
];

function fmtDate(d?: string | null) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return ''; }
}

export default function Plans() {
  const styles = makeStyles();
  const { user } = useAuth();
  const { pay, sheet } = usePayments();
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
  const [trialDays, setTrialDays] = useState(7);
  const [selected, setSelected] = useState('3m');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/payments/plans');
        if (Array.isArray(data?.plans) && data.plans.length) setPlans(data.plans);
        if (data?.trialDays) setTrialDays(data.trialDays);
      } catch { /* keep defaults */ }
    })();
  }, []);

  const trialLeft = useMemo(() => {
    if (!user?.trialUntil) return 0;
    return Math.max(0, Math.ceil((new Date(user.trialUntil).getTime() - Date.now()) / 86400000));
  }, [user?.trialUntil]);

  const status = user?.subscriptionActive
    ? { tone: Colors.success, text: `Plan active till ${fmtDate(user?.subscriptionUntil)}` }
    : user?.trialActive
      ? { tone: Colors.primary, text: `Free trial · ${trialLeft} day${trialLeft === 1 ? '' : 's'} left` }
      : { tone: Colors.error, text: 'No active plan — your listings are hidden' };

  const onSubscribe = async () => {
    if (!selected || busy) return;
    setBusy(true);
    try {
      const r = await pay(selected);
      if (r.ok) {
        const body = 'Your plan is active. All listings are now live and the Verified Owner badge is on.';
        Alert.alert('🎉 Subscribed!', r.mock ? `${body}\n\n(Test mode — no real charge. Add Razorpay keys to go live.)` : body,
          [{ text: 'Done', onPress: () => router.back() }]);
      } else if (!r.cancelled) {
        Alert.alert('Payment failed', r.error || 'Please try again.');
      }
    } finally { setBusy(false); }
  };

  const chosen = plans.find((p) => p.key === selected);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['bottom']}>
      <Header showBack title="Roomzy Plans" />
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 24 }}>
        {/* Hero */}
        <View style={{ alignItems: 'center', marginTop: 4, marginBottom: Spacing.lg }}>
          <View style={styles.heroIcon}><Sparkles size={26} color={Colors.primary} /></View>
          <Text style={styles.heroTitle}>Keep your listings live</Text>
          <Text style={styles.heroSub}>
            New owners get {trialDays} days free. After that, pick a plan to stay visible and get the Verified badge.
          </Text>
        </View>

        {/* Current status */}
        <View style={[styles.status, { borderColor: status.tone, backgroundColor: status.tone + '14' }]}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: status.tone }} />
          <Text style={{ color: Colors.text, fontWeight: '700', fontSize: 13, flex: 1 }}>{status.text}</Text>
          {user?.subscriptionActive && <BadgeCheck size={18} color={Colors.success} />}
        </View>

        {/* Perks */}
        <View style={styles.perks}>
          {PERKS.map((p) => (
            <View key={p} style={styles.perkRow}>
              <View style={styles.perkTick}><Check size={12} color="#fff" /></View>
              <Text style={styles.perkText}>{p}</Text>
            </View>
          ))}
        </View>

        {/* Plan cards */}
        <Text style={styles.section}>CHOOSE A PLAN</Text>
        {plans.map((p) => {
          const active = selected === p.key;
          const perMonth = Math.round(p.price / p.months);
          const savings = Math.round((1 - p.price / (BASE_MONTHLY * p.months)) * 100);
          return (
            <TouchableOpacity
              key={p.key}
              testID={`plan-${p.key}`}
              activeOpacity={0.9}
              onPress={() => setSelected(p.key)}
              style={[styles.card, active && styles.cardActive]}
            >
              <View style={[styles.radio, active && styles.radioActive]}>
                {active && <Check size={13} color="#fff" />}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.cardTitle}>{p.label}</Text>
                  {TAGS[p.key] && <Pill text={TAGS[p.key]} bg={Colors.primary} color="#fff" />}
                </View>
                <Text style={styles.cardSub}>
                  ₹{perMonth.toLocaleString('en-IN')}/mo{savings > 0 ? `  ·  save ${savings}%` : ''}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.cardPrice}>₹{p.price.toLocaleString('en-IN')}</Text>
                <Text style={styles.cardPer}>total</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={styles.note}>
          <BadgeCheck size={15} color={Colors.primary} />
          <Text style={styles.noteText}>Every plan includes the Verified Owner badge — no extra charge.</Text>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.textMuted, fontSize: 12 }}>{chosen?.label} plan</Text>
          <Text style={{ color: Colors.text, fontSize: 20, fontWeight: '900' }}>₹{(chosen?.price || 0).toLocaleString('en-IN')}</Text>
        </View>
        <Button
          title={user?.subscriptionActive ? 'Extend plan' : 'Subscribe'}
          onPress={onSubscribe}
          loading={busy}
          testID="subscribe-btn"
          style={{ flex: 1.4, flexDirection: 'row' }}
        />
      </View>

      {sheet}
    </SafeAreaView>
  );
}

const makeStyles = () => StyleSheet.create({
  heroIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: Colors.text, letterSpacing: -0.4 },
  heroSub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 19, maxWidth: 320 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: Radius.lg, paddingVertical: 12, paddingHorizontal: 14, marginBottom: Spacing.md },
  perks: { backgroundColor: Colors.bgAlt, borderRadius: Radius.xl, padding: Spacing.md, gap: 10, marginBottom: Spacing.lg },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perkTick: { width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  perkText: { color: Colors.text, fontSize: 13.5, fontWeight: '600', flex: 1 },
  section: { fontSize: 11, fontWeight: '800', color: Colors.textMuted, letterSpacing: 0.8, marginBottom: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.xl, padding: Spacing.md, marginBottom: 10, backgroundColor: Colors.surface },
  cardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  cardTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  cardSub: { fontSize: 12.5, color: Colors.textMuted, marginTop: 3, fontWeight: '600' },
  cardPrice: { fontSize: 20, fontWeight: '900', color: Colors.text, letterSpacing: -0.4 },
  cardPer: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  noteText: { color: Colors.textMuted, fontSize: 12, flex: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: Spacing.md, paddingTop: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.bg },
});
