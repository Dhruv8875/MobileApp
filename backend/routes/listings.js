// Listing routes - CRUD + nearby + search/filter
const express = require('express');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { Lead, Report } = require('../models');
const { authRequired, authOptional, requireRole } = require('../middleware/auth');

const router = express.Router();

function isValidIndianPincode(value) {
  return !value || /^\d{6}$/.test(String(value).trim());
}

function listingActiveStatus(listing) {
  const now = new Date();
  if (listing.status !== 'active') return false;
  if (listing.paidUntil && listing.paidUntil > now) return true;
  if (listing.freeUntil && listing.freeUntil > now) return true;
  return false;
}

// Builds the Mongo query for public listing search (used by both / and /nearby).
// Always limits to active + visible (free or paid window not expired) listings.
function buildListingFilter(query) {
  const {
    city, area, pincode, q, search,
    minRent, maxRent,
    furnishing, propertyType, preferredTenant,
    ac, wifi, parking, foodAvailable, attachedBathroom, roommateAllowed,
    depositRequired, availableNow, featured,
  } = query;

  const now = new Date();
  const filter = {
    status: 'active',
    $or: [{ paidUntil: { $gt: now } }, { freeUntil: { $gt: now } }],
  };

  // General search box: one term matches city OR area OR pincode OR title.
  // Combined with the visibility $or via $and so neither clause overwrites the other.
  if (search && String(search).trim()) {
    const term = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(term, 'i');
    filter.$and = [
      { $or: filter.$or },
      { $or: [{ city: rx }, { area: rx }, { pincode: rx }, { title: rx }] },
    ];
    delete filter.$or;
  }

  if (city) filter.city = new RegExp(city, 'i');
  if (area) filter.area = new RegExp(area, 'i');
  if (pincode) filter.pincode = pincode;
  if (q) filter.title = new RegExp(q, 'i');
  if (minRent || maxRent) {
    filter.monthlyRent = {};
    if (minRent) filter.monthlyRent.$gte = Number(minRent);
    if (maxRent) filter.monthlyRent.$lte = Number(maxRent);
  }
  if (furnishing) filter.furnishing = furnishing;
  if (propertyType) filter.propertyType = propertyType;
  if (preferredTenant) filter.preferredTenant = preferredTenant;
  if (depositRequired !== undefined) filter.securityDepositRequired = depositRequired === 'true';
  if (availableNow !== undefined) filter.availableNow = availableNow === 'true';
  if (featured === 'true') filter.isFeatured = true;
  const amen = { ac, wifi, parking, foodAvailable, attachedBathroom, roommateAllowed };
  Object.entries(amen).forEach(([k, v]) => {
    if (v === 'true') filter[`amenities.${k}`] = true;
  });

  return filter;
}

// CREATE listing (owner only)
router.post('/', authRequired, requireRole('owner'), async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.title?.trim() || !body.address?.trim() || !body.city?.trim()) {
      return res.status(400).json({ detail: 'Title, address and city are required' });
    }
    if (!Number.isFinite(Number(body.monthlyRent)) || Number(body.monthlyRent) < 500) {
      return res.status(400).json({ detail: 'Monthly rent must be at least ₹500' });
    }
    if (!isValidIndianPincode(body.pincode)) {
      return res.status(400).json({ detail: 'Enter a valid 6-digit Indian PIN code' });
    }
    // Visibility is account-level: a listing is live while the owner's free trial
    // or paid subscription is active. Inherit those windows from the owner.
    const now = new Date();
    const owner = req.user;
    const freeUntil = owner.trialUntil || undefined;
    const paidUntil = owner.subscriptionUntil && owner.subscriptionUntil > now ? owner.subscriptionUntil : null;
    const doc = await Listing.create({
      ...body,
      owner: owner._id,
      freeUntil,
      paidUntil,
      status: 'active',
    });
    return res.status(201).json(doc.toJSON());
  } catch (e) {
    console.error('create listing error', e);
    return res.status(400).json({ detail: e.message });
  }
});

// GET all listings (with filters & search)
router.get('/', async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;
    const filter = buildListingFilter(req.query);

    const docs = await Listing.find(filter)
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip(Number(skip))
      .limit(Math.min(Number(limit), 100))
      .populate('owner', 'name avatar isVerifiedOwner phone');

    return res.json({
      results: docs.map((d) => {
        const j = d.toJSON();
        if (j.owner && j.owner._id) {
          j.owner.id = j.owner._id.toString();
          delete j.owner._id;
        }
        return j;
      }),
    });
  } catch (e) {
    console.error('list error', e);
    return res.status(500).json({ detail: 'Failed to fetch listings' });
  }
});

// GET nearby listings via lat/lng (default 4km radius). Supports the same
// search/amenity filters as GET / so tenants can filter "near me" results too.
// Results come back sorted nearest-first ($near).
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radiusKm = 4, limit = 50 } = req.query;
    if (!lat || !lng) return res.status(400).json({ detail: 'lat and lng required' });

    const filter = buildListingFilter(req.query);
    filter.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
        $maxDistance: Number(radiusKm) * 1000,
      },
    };

    const docs = await Listing.find(filter)
      .limit(Math.min(Number(limit), 100))
      .populate('owner', 'name avatar isVerifiedOwner phone');
    return res.json({
      results: docs.map((d) => {
        const j = d.toJSON();
        if (j.owner && j.owner._id) { j.owner.id = j.owner._id.toString(); delete j.owner._id; }
        return j;
      }),
    });
  } catch (e) {
    console.error('nearby error', e);
    return res.status(500).json({ detail: 'Failed to fetch nearby listings' });
  }
});

// MY listings (owner only)
router.get('/mine/list', authRequired, requireRole('owner'), async (req, res) => {
  const docs = await Listing.find({ owner: req.user._id, status: { $ne: 'deleted' } }).sort({ createdAt: -1 });
  return res.json({
    results: docs.map((d) => {
      const j = d.toJSON();
      j.isLive = listingActiveStatus(d);
      return j;
    }),
  });
});

// GET single listing
router.get('/:id', authOptional, async (req, res) => {
  try {
    const doc = await Listing.findById(req.params.id).populate('owner', 'name avatar isVerifiedOwner phone email');
    if (!doc || doc.status === 'deleted') return res.status(404).json({ detail: 'Listing not found' });
    // Count a profile visit only for real visitors, not the owner viewing their own listing.
    const ownerId = String(doc.owner?._id || doc.owner);
    if (!req.user || String(req.user._id) !== ownerId) {
      doc.profileVisits = (doc.profileVisits || 0) + 1;
      await doc.save();
    }
    const j = doc.toJSON();
    if (j.owner && j.owner._id) {
      j.owner.id = j.owner._id.toString();
      delete j.owner._id;
    }
    j.isLive = listingActiveStatus(doc);
    return res.json(j);
  } catch (e) {
    return res.status(404).json({ detail: 'Listing not found' });
  }
});

// UPDATE listing
router.put('/:id', authRequired, requireRole('owner'), async (req, res) => {
  const doc = await Listing.findById(req.params.id);
  if (!doc) return res.status(404).json({ detail: 'Not found' });
  if (doc.owner.toString() !== req.user._id.toString()) return res.status(403).json({ detail: 'Forbidden' });
  Object.assign(doc, req.body);
  await doc.save();
  return res.json(doc.toJSON());
});

// DELETE listing (soft)
router.delete('/:id', authRequired, requireRole('owner'), async (req, res) => {
  const doc = await Listing.findById(req.params.id);
  if (!doc) return res.status(404).json({ detail: 'Not found' });
  if (doc.owner.toString() !== req.user._id.toString()) return res.status(403).json({ detail: 'Forbidden' });
  doc.status = 'deleted';
  await doc.save();
  return res.json({ ok: true });
});

// Lead actions: WhatsApp / Call / Callback
router.post('/:id/lead', authRequired, requireRole('tenant'), async (req, res) => {
  const { type, message } = req.body || {};
  if (!['call', 'whatsapp', 'callback'].includes(type)) return res.status(400).json({ detail: 'invalid type' });
  const doc = await Listing.findById(req.params.id);
  if (!doc) return res.status(404).json({ detail: 'Not found' });
  await Lead.create({
    listing: doc._id,
    owner: doc.owner,
    tenant: req.user._id,
    type,
    message: message || '',
  });
  doc.leads = (doc.leads || 0) + 1;
  await doc.save();
  return res.json({ ok: true });
});

// Report fake listing
router.post('/:id/report', authRequired, requireRole('tenant'), async (req, res) => {
  const { reason, details } = req.body || {};
  if (!reason) return res.status(400).json({ detail: 'reason required' });
  const doc = await Listing.findById(req.params.id);
  if (!doc) return res.status(404).json({ detail: 'Not found' });
  await Report.create({ listing: doc._id, reporter: req.user._id, reason, details: details || '' });
  return res.json({ ok: true });
});

// Owner: leads list
router.get('/mine/leads', authRequired, requireRole('owner'), async (req, res) => {
  const leads = await Lead.find({ owner: req.user._id })
    .sort({ createdAt: -1 })
    .populate('tenant', 'name avatar phone email')
    .populate('listing', 'title city');
  return res.json({
    results: leads.map((l) => {
      const j = l.toJSON();
      if (j.tenant && j.tenant._id) { j.tenant.id = j.tenant._id.toString(); delete j.tenant._id; }
      if (j.listing && j.listing._id) { j.listing.id = j.listing._id.toString(); delete j.listing._id; }
      return j;
    }),
  });
});

module.exports = router;
