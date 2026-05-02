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
    isVerifiedOwner: { type: Boolean, default: false },
    verifiedUntil: { type: Date, default: null },
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
  return obj;
};

module.exports = mongoose.model('User', userSchema);
