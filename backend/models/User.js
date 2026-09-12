// Roomzy - User Mongoose Schema
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, default: '' },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['owner', 'tenant'], required: true, default: 'tenant' },
    avatar: { type: String, default: '' }, // base64 or URL
    isVerifiedOwner: { type: Boolean, default: false }, // derived from an active paid subscription
    verifiedUntil: { type: Date, default: null },
    // Account-level owner subscription. A paid subscription keeps ALL of the
    // owner's listings live and grants the Verified Owner badge for its window.
    subscriptionUntil: { type: Date, default: null }, // paid plan expiry
    trialUntil: { type: Date, default: null },        // 7-day free trial (new owners)
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
    bio: { type: String, default: '' },
  },
  { timestamps: true }
);

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  delete obj.passwordHash;
  // Compute live status so the badge/plan state is never stale.
  const now = new Date();
  obj.subscriptionActive = !!(obj.subscriptionUntil && new Date(obj.subscriptionUntil) > now);
  obj.trialActive = !!(obj.trialUntil && new Date(obj.trialUntil) > now);
  // Verified badge is bundled with every paid plan (no separate charge).
  obj.isVerifiedOwner = obj.subscriptionActive;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
