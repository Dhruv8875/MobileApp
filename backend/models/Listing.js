// Roomzy - Listing Mongoose Schema
const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    propertyType: { type: String, enum: ['room', 'pg', 'flat', 'bed'], required: true },

    // Pricing
    monthlyRent: { type: Number, required: true, min: 0 },
    securityDepositRequired: { type: Boolean, default: false },
    depositAmount: { type: Number, default: 0 },
    advanceMonths: { type: Number, default: 0 },
    maintenanceCharge: { type: Number, default: 0 },
    electricityIncluded: { type: Boolean, default: false },
    waterIncluded: { type: Boolean, default: false },

    // Property
    preferredTenant: { type: String, enum: ['boys', 'girls', 'family', 'any'], default: 'any' },
    furnishing: { type: String, enum: ['furnished', 'semi', 'unfurnished'], default: 'unfurnished' },
    totalRooms: { type: Number, default: 1 },
    availableBeds: { type: Number, default: 1 },

    // Address
    address: { type: String, required: true },
    city: { type: String, required: true, index: true },
    area: { type: String, default: '' },
    pincode: { type: String, default: '', index: true },
    landmark: { type: String, default: '' },
    location: {
      // GeoJSON Point [longitude, latitude]
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },

    // Amenities
    amenities: {
      ac: { type: Boolean, default: false },
      attachedBathroom: { type: Boolean, default: false },
      wifi: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
      foodAvailable: { type: Boolean, default: false },
      roommateAllowed: { type: Boolean, default: false },
    },

    // Media (base64 strings)
    photos: [{ type: String }],
    video: { type: String, default: '' },

    // Availability
    availableFrom: { type: Date, default: Date.now },
    availableNow: { type: Boolean, default: true },
    rules: { type: String, default: '' },

    // Monetization & status
    status: { type: String, enum: ['active', 'expired', 'paused', 'deleted'], default: 'active', index: true },
    freeUntil: { type: Date }, // first 7 days free
    paidUntil: { type: Date, default: null }, // after payment, valid for 30 days
    isFeatured: { type: Boolean, default: false },
    featuredUntil: { type: Date, default: null },

    // Stats
    profileVisits: { type: Number, default: 0 },
    leads: { type: Number, default: 0 },
  },
  { timestamps: true }
);

listingSchema.index({ location: '2dsphere' });
listingSchema.index({ city: 1, status: 1 });

listingSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Listing', listingSchema);
