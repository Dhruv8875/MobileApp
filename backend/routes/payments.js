// Razorpay payment routes (mock-friendly when keys missing)
const express = require('express');
const crypto = require('crypto');
const { Payment } = require('../models');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// Account-level owner subscription plans. Every plan includes the Verified
// Owner badge and keeps ALL of the owner's listings live for its duration.
const PLANS = {
  '1m': { key: '1m', months: 1, price: parseInt(process.env.PLAN_1M_PRICE_INR || '99', 10), label: '1 Month' },
  '3m': { key: '3m', months: 3, price: parseInt(process.env.PLAN_3M_PRICE_INR || '249', 10), label: '3 Months' },
  '6m': { key: '6m', months: 6, price: parseInt(process.env.PLAN_6M_PRICE_INR || '499', 10), label: '6 Months' },
  '12m': { key: '12m', months: 12, price: parseInt(process.env.PLAN_12M_PRICE_INR || '899', 10), label: '1 Year' },
};
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  const Razorpay = require('razorpay');
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// Grant whatever the payment paid for. Idempotent-friendly: safe to call once
// per payment (both /verify and the webhook guard against double-application by
// only calling this when a payment first transitions to 'paid').
async function applyBenefit(payment) {
  const now = new Date();
  if (payment.purpose === 'subscription') {
    const u = await User.findById(payment.user);
    if (u) {
      const base = u.subscriptionUntil && u.subscriptionUntil > now ? u.subscriptionUntil : now;
      const months = PLANS[payment.plan]?.months || 1;
      const until = new Date(base.getTime() + months * MONTH_MS);
      u.subscriptionUntil = until;
      u.isVerifiedOwner = true;   // bundled with every plan, no separate charge
      u.verifiedUntil = until;
      await u.save();
      // Account-level: keep every one of the owner's listings live for the window.
      await Listing.updateMany(
        { owner: u._id, status: { $ne: 'deleted' } },
        { $set: { paidUntil: until, status: 'active' } }
      );
    }
    return;
  }
  // ---- Legacy purposes below (no longer sold; kept for old payment records) ----
  if (payment.purpose === 'listing_renewal' && payment.listing) {
    const l = await Listing.findById(payment.listing);
    if (l) {
      const base = l.paidUntil && l.paidUntil > now ? l.paidUntil : now;
      l.paidUntil = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
      l.status = 'active';
      await l.save();
    }
  } else if (payment.purpose === 'featured_listing' && payment.listing) {
    const l = await Listing.findById(payment.listing);
    if (l) {
      l.isFeatured = true;
      l.featuredUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      await l.save();
    }
  } else if (payment.purpose === 'owner_verification') {
    const u = await User.findById(payment.user);
    if (u) {
      u.isVerifiedOwner = true;
      u.verifiedUntil = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      await u.save();
    }
  }
}

router.post('/create-order', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'owner') return res.status(403).json({ detail: 'Only owners can subscribe' });
    const { plan } = req.body || {};
    const chosen = PLANS[plan];
    if (!chosen) return res.status(400).json({ detail: 'Invalid plan' });
    const amount = chosen.price;

    const razorpay = getRazorpay();
    let order;
    let mock = false;

    if (razorpay) {
      order = await razorpay.orders.create({
        amount: amount * 100, // in paise
        currency: 'INR',
        receipt: `roomzy_${Date.now()}`,
      });
    } else {
      mock = true;
      order = {
        id: `mock_order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        amount: amount * 100,
        currency: 'INR',
      };
    }

    const payment = await Payment.create({
      user: req.user._id,
      purpose: 'subscription',
      plan,
      amount,
      currency: 'INR',
      razorpayOrderId: order.id,
      status: mock ? 'mock' : 'created',
    });

    return res.json({
      order,
      paymentId: payment._id.toString(),
      amount,
      plan,
      key: process.env.RAZORPAY_KEY_ID || '',
      mock,
    });
  } catch (e) {
    console.error('create-order error', e);
    return res.status(500).json({ detail: 'Failed to create order' });
  }
});

router.post('/verify', authRequired, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId, mock } = req.body || {};
    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ detail: 'Payment not found' });
    if (payment.user.toString() !== req.user._id.toString())
      return res.status(403).json({ detail: 'Forbidden' });

    // A client must never be able to turn a real payment into a successful mock payment.
    const useMock = payment.status === 'mock';

    if (!useMock) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ detail: 'Payment confirmation is incomplete' });
      }
      const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
      if (expected !== razorpay_signature) {
        payment.status = 'failed';
        await payment.save();
        return res.status(400).json({ detail: 'Invalid signature' });
      }
      payment.razorpayPaymentId = razorpay_payment_id;
      payment.razorpaySignature = razorpay_signature;
    }

    // Only apply the benefit the first time the payment becomes paid, so a
    // duplicate /verify (or a webhook racing with it) can't double-extend.
    const firstTimePaid = payment.status !== 'paid';
    payment.status = 'paid';
    await payment.save();
    if (firstTimePaid) await applyBenefit(payment);

    return res.json({ ok: true, payment: payment.toJSON() });
  } catch (e) {
    console.error('verify error', e);
    return res.status(500).json({ detail: 'Failed to verify payment' });
  }
});

router.get('/my', authRequired, async (req, res) => {
  const docs = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('listing', 'title city');
  return res.json({
    results: docs.map((d) => {
      const j = d.toJSON();
      if (j.listing && j.listing._id) { j.listing.id = j.listing._id.toString(); delete j.listing._id; }
      return j;
    }),
  });
});

// Public plan catalogue for the pricing page.
router.get('/plans', (req, res) => {
  res.json({
    plans: Object.values(PLANS),
    trialDays: parseInt(process.env.LISTING_FREE_DAYS || '7', 10),
  });
});

// Razorpay webhook — reconciles payments even if the client never calls /verify
// (app closed, lost network). Set RAZORPAY_WEBHOOK_SECRET to match the secret
// configured on the Razorpay dashboard. Needs the raw request body for the
// signature check (server.js stashes it on req.rawBody).
router.post('/webhook', async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return res.status(503).json({ detail: 'Webhook not configured' });

    const signature = req.headers['x-razorpay-signature'];
    const raw = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
    const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    if (!signature || expected !== signature) {
      return res.status(400).json({ detail: 'Invalid webhook signature' });
    }

    const event = req.body?.event;
    const entity = req.body?.payload?.payment?.entity;
    if ((event === 'payment.captured' || event === 'order.paid') && entity?.order_id) {
      const payment = await Payment.findOne({ razorpayOrderId: entity.order_id });
      if (payment && payment.status !== 'paid') {
        payment.status = 'paid';
        payment.razorpayPaymentId = entity.id || payment.razorpayPaymentId;
        await payment.save();
        await applyBenefit(payment);
      }
    }
    // Always 200 for handled/ignored events so Razorpay stops retrying.
    return res.json({ ok: true });
  } catch (e) {
    console.error('webhook error', e);
    return res.status(500).json({ detail: 'Webhook handling failed' });
  }
});

module.exports = router;
