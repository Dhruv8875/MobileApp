// Roomzy Backend - Express + Mongoose entry point on port 8001
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const listingsRoutes = require('./routes/listings');
const usersRoutes = require('./routes/users');
const paymentsRoutes = require('./routes/payments');
const Listing = require('./models/Listing');
const seed = require('./seed');

const app = express();
const PORT = parseInt(process.env.PORT || '8001', 10);

const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((v) => v.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    // Native apps do not send an Origin header. Browsers must be explicitly allowed in production.
    if (!origin || process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({
  limit: '20mb', // base64 images
  // Keep the raw bytes so the Razorpay webhook can verify its signature.
  verify: (req, res, buf) => { req.rawBody = buf; },
}));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));

// Mount everything under /api (Kubernetes ingress requirement)
const api = express.Router();
api.get('/', (req, res) => res.json({ name: 'Roomzy API', status: 'ok' }));
api.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
api.use('/auth', authRoutes);
api.use('/listings', listingsRoutes);
api.use('/users', usersRoutes);
api.use('/payments', paymentsRoutes);
app.use('/api', api);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ detail: 'Server error' });
});

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
  dbName: process.env.DB_NAME,
  family: 4,
});
    console.log(`[Roomzy] Connected to MongoDB db=${process.env.DB_NAME}`);

    await seed();

    // Cron: every hour, expire listings whose free + paid windows are over
    cron.schedule('0 * * * *', async () => {
      try {
        const now = new Date();
        const r = await Listing.updateMany(
          {
            status: 'active',
            $and: [
              { $or: [{ paidUntil: null }, { paidUntil: { $lte: now } }] },
              { $or: [{ freeUntil: null }, { freeUntil: { $lte: now } }] },
            ],
          },
          { $set: { status: 'expired' } }
        );
        if (r.modifiedCount) console.log(`[Roomzy cron] Expired ${r.modifiedCount} listings`);

        const f = await Listing.updateMany(
          { isFeatured: true, featuredUntil: { $lte: now } },
          { $set: { isFeatured: false } }
        );
        if (f.modifiedCount) console.log(`[Roomzy cron] Unfeatured ${f.modifiedCount} listings`);
      } catch (e) {
        console.error('cron error', e);
      }
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Roomzy] Backend listening on 0.0.0.0:${PORT}`);
    });
  } catch (e) {
    console.error('Startup failed:', e);
    process.exit(1);
  }
}

start();
