// Roomzy - Payment, Favorite, Report, Chat, Notification Schemas
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', default: null },
    purpose: {
      type: String,
      enum: ['listing_renewal', 'featured_listing', 'owner_verification'],
      required: true,
    },
    amount: { type: Number, required: true }, // INR rupees
    currency: { type: String, default: 'INR' },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },
    status: { type: String, enum: ['created', 'paid', 'failed', 'mock'], default: 'created' },
    method: { type: String, default: 'razorpay' },
  },
  { timestamps: true }
);
paymentSchema.methods.toJSON = function () {
  const o = this.toObject();
  o.id = o._id.toString();
  delete o._id;
  delete o.__v;
  return o;
};

const reportSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
    details: { type: String, default: '' },
    status: { type: String, enum: ['open', 'reviewed', 'closed'], default: 'open' },
  },
  { timestamps: true }
);
reportSchema.methods.toJSON = function () {
  const o = this.toObject();
  o.id = o._id.toString();
  delete o._id;
  delete o.__v;
  return o;
};

const chatMessageSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);
chatMessageSchema.methods.toJSON = function () {
  const o = this.toObject();
  o.id = o._id.toString();
  delete o._id;
  delete o.__v;
  return o;
};

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    data: { type: Object, default: {} },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);
notificationSchema.methods.toJSON = function () {
  const o = this.toObject();
  o.id = o._id.toString();
  delete o._id;
  delete o.__v;
  return o;
};

const leadSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['call', 'whatsapp', 'callback'], required: true },
    message: { type: String, default: '' },
  },
  { timestamps: true }
);
leadSchema.methods.toJSON = function () {
  const o = this.toObject();
  o.id = o._id.toString();
  delete o._id;
  delete o.__v;
  return o;
};

module.exports = {
  Payment: mongoose.model('Payment', paymentSchema),
  Report: mongoose.model('Report', reportSchema),
  ChatMessage: mongoose.model('ChatMessage', chatMessageSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  Lead: mongoose.model('Lead', leadSchema),
};
