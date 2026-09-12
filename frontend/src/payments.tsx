// Razorpay payments for Roomzy.
//
// Backend decides mock vs live from whether RAZORPAY_KEY_* env vars are set:
//   - No keys  -> create-order returns { mock: true }; we confirm instantly (dev/test).
//   - Live keys -> create-order returns a real order; we open Razorpay Checkout in a
//     WebView, then post the signed response to /payments/verify.
//
// WebView-based checkout works in Expo Go (no native module / custom dev build needed).
import React, { useCallback, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { X } from 'lucide-react-native';
import { api, useAuth, formatErr } from './api';
import { Colors } from './theme';

export type PayResult =
  | { ok: true; mock?: boolean }
  | { ok: false; cancelled?: boolean; error?: string };

const PLAN_LABELS: Record<string, string> = {
  '1m': 'Roomzy · 1 Month plan',
  '3m': 'Roomzy · 3 Months plan',
  '6m': 'Roomzy · 6 Months plan',
  '12m': 'Roomzy · 1 Year plan',
};

function buildCheckoutHtml(order: any, user: any) {
  const options = {
    key: order.key,
    order_id: order.order?.id,
    amount: order.order?.amount, // paise (taken from the order server-side)
    currency: order.order?.currency || 'INR',
    name: 'Roomzy',
    description: PLAN_LABELS[order.plan] || 'Roomzy subscription',
    prefill: {
      name: user?.name || '',
      email: user?.email || '',
      contact: user?.phone || '',
    },
    theme: { color: Colors.primary },
  };
  return `<!doctype html>
<html>
  <head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" /></head>
  <body style="margin:0;background:#ffffff;">
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <script>
      function post(o){ if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(o)); }
      try {
        var options = ${JSON.stringify(options)};
        options.handler = function (response) {
          post({
            type: 'success',
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          });
        };
        options.modal = { ondismiss: function () { post({ type: 'dismiss' }); } };
        var rzp = new Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          post({ type: 'failed', error: (resp && resp.error && resp.error.description) || 'Payment failed' });
        });
        rzp.open();
      } catch (e) { post({ type: 'failed', error: String(e) }); }
    </script>
  </body>
</html>`;
}

/**
 * usePayments(): returns
 *   - pay(purpose, listingId?) -> Promise<PayResult>
 *   - sheet: JSX to render once in the screen (the checkout modal)
 */
export function usePayments() {
  const styles = makeStyles();
  const { user, refresh } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const resolverRef = useRef<((r: PayResult) => void) | null>(null);

  const settle = useCallback((r: PayResult) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setOrder(null);
    if (resolve) resolve(r);
  }, []);

  // Subscribe the owner to a plan key ('1m' | '3m' | '6m' | '12m').
  const pay = useCallback((plan: string): Promise<PayResult> => {
    return new Promise<PayResult>((resolve) => {
      (async () => {
        try {
          const { data } = await api.post('/payments/create-order', { plan });
          if (data.mock) {
            // No live keys configured — confirm the mock payment immediately.
            await api.post('/payments/verify', { paymentId: data.paymentId, mock: true });
            try { await refresh(); } catch {}
            resolve({ ok: true, mock: true });
            return;
          }
          resolverRef.current = resolve;
          setOrder({ ...data, plan });
        } catch (e) {
          resolve({ ok: false, error: formatErr(e) });
        }
      })();
    });
  }, [refresh]);

  const onMessage = useCallback(async (e: any) => {
    let msg: any = {};
    try { msg = JSON.parse(e.nativeEvent.data); } catch { return; }

    if (msg.type === 'success') {
      try {
        await api.post('/payments/verify', {
          paymentId: order?.paymentId,
          razorpay_order_id: msg.razorpay_order_id,
          razorpay_payment_id: msg.razorpay_payment_id,
          razorpay_signature: msg.razorpay_signature,
        });
        // Subscription changes the badge + plan window on the auth user — refresh.
        try { await refresh(); } catch {}
        settle({ ok: true });
      } catch (err) {
        settle({ ok: false, error: formatErr(err) });
      }
    } else if (msg.type === 'dismiss') {
      settle({ ok: false, cancelled: true });
    } else {
      settle({ ok: false, error: msg.error || 'Payment failed' });
    }
  }, [order, refresh, settle]);

  const sheet = order ? (
    <Modal visible transparent={false} animationType="slide" onRequestClose={() => settle({ ok: false, cancelled: true })}>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
        <View style={styles.bar}>
          <Text style={styles.barTitle}>Secure payment</Text>
          <TouchableOpacity onPress={() => settle({ ok: false, cancelled: true })} testID="pay-close" style={styles.close}>
            <X size={18} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <WebView
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          source={{ html: buildCheckoutHtml(order, user), baseUrl: 'https://roomzy.in' }}
          onMessage={onMessage}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}><ActivityIndicator color={Colors.primary} /></View>
          )}
        />
      </SafeAreaView>
    </Modal>
  ) : null;

  return { pay, sheet };
}

const makeStyles = () => StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  barTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  close: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.bgAlt, alignItems: 'center', justifyContent: 'center' },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
});
