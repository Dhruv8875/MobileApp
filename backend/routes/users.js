// Favorites and User routes
const express = require('express');
const User = require('../models/User');
const Listing = require('../models/Listing');
const { Payment, Lead, Report, ChatMessage, Notification } = require('../models');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/favorites', authRequired, async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'favorites',
    populate: { path: 'owner', select: 'name avatar isVerifiedOwner phone' },
  });
  const favs = (user.favorites || []).filter((l) => l && l.status !== 'deleted');
  return res.json({ results: favs.map((d) => d.toJSON()) });
});

router.post('/favorites/:id', authRequired, async (req, res) => {
  const user = await User.findById(req.user._id);
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ detail: 'Listing not found' });
  const idx = user.favorites.findIndex((f) => f.toString() === req.params.id);
  if (idx >= 0) {
    user.favorites.splice(idx, 1);
    await user.save();
    return res.json({ favorited: false });
  }
  user.favorites.push(listing._id);
  await user.save();
  return res.json({ favorited: true });
});

// Update profile
router.put('/profile', authRequired, async (req, res) => {
  const allowed = ['name', 'phone', 'avatar', 'bio'];
  const update = {};
  for (const k of allowed) if (k in req.body) update[k] = req.body[k];
  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
  return res.json(user.toJSON());
});

// Permanently delete the signed-in user's account and all their data.
// Required by the Google Play "account deletion" policy for apps with accounts.
router.delete('/account', authRequired, async (req, res) => {
  try {
    const uid = req.user._id;
    const owned = await Listing.find({ owner: uid }).select('_id');
    const listingIds = owned.map((l) => l._id);

    await Promise.all([
      Listing.deleteMany({ owner: uid }),
      Lead.deleteMany({ $or: [{ owner: uid }, { tenant: uid }] }),
      Report.deleteMany({ $or: [{ reporter: uid }, { listing: { $in: listingIds } }] }),
      ChatMessage.deleteMany({ $or: [{ from: uid }, { to: uid }] }),
      Notification.deleteMany({ user: uid }),
      Payment.deleteMany({ user: uid }),
      // Remove this user's listings from everyone else's favorites.
      User.updateMany({ favorites: { $in: listingIds } }, { $pull: { favorites: { $in: listingIds } } }),
    ]);

    await User.findByIdAndDelete(uid);
    res.clearCookie('access_token', { path: '/' });
    return res.json({ ok: true });
  } catch (e) {
    console.error('delete account error', e);
    return res.status(500).json({ detail: 'Failed to delete account' });
  }
});

module.exports = router;
