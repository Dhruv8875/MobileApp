// Razorpay payment routes (mock-friendly when keys missing)
const express = require('express');
const crypto = require('crypto');
const { Payment } = require('../models');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

const PRICES = {
  listing_renewal: parseInt(process.env.LISTING_RENEWAL_PRICE_INR || '99', 10),
  featured_listing: parseInt(process.env.LISTING_FEATURED_PRICE_INR || '299', 10),
  owner_verification: parseInt(process.env.OWNER_VERIFY_PRICE_INR || '199', 10),
};

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  const Razorpay = require('razorpay');
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

router.post('/create-order', authRequired, async (req, res) => {
  try {
    const { purpose, listingId } = req.body || {};
    if (!PRICES[purpose]) return res.status(400).json({ detail: 'Invalid purpose' });
    const amount = PRICES[purpose];

    let listingDoc = null;
    if (listingId) {
      listingDoc = await Listing.findById(listingId);
      if (!listingDoc) return res.status(404).json({ detail: 'Listing not found' });
      if (listingDoc.owner.toString() !== req.user._id.toString())
        return res.status(403).json({ detail: 'Not your listing' });
    }

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
      listing: listingDoc ? listingDoc._id : null,
      purpose,
      amount,
      currency: 'INR',
      razorpayOrderId: order.id,
      status: mock ? 'mock' : 'created',
    });

    return res.json({
      order,
      paymentId: payment._id.toString(),
      amount,
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

    const useMock = mock || payment.status === 'mock';

    if (!useMock) {
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

    payment.status = 'paid';
    await payment.save();

    // Apply benefit
    const now = new Date();
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
      const u = await User.findById(req.user._id);
      if (u) {
        u.isVerifiedOwner = true;
        u.verifiedUntil = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        await u.save();
      }
    }

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

router.get('/prices', (req, res) => res.json(PRICES));

module.exports = router;
