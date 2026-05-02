// Favorites and User routes
const express = require('express');
const User = require('../models/User');
const Listing = require('../models/Listing');
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

module.exports = router;
