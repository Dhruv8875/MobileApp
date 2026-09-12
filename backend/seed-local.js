// Insert demo listings around YOUR location.
// Distribution:
//   3 listings -> within 0-2 KM
//   2 listings -> within 2-4 KM
//   4 listings -> within 4-10 KM
//   1 listing  -> around 10 KM
//
// HOW TO USE:
//   1) Google Maps se apni location ke latitude/longitude nikalo.
//   2) MY_LAT / MY_LNG me coordinates daalo.
//   3) MongoDB running hona chahiye.
//   4) Backend ek baar start ho chuka ho.
//   5) Run:
//        cd backend
//        node seed-local.js
//
// IMPORTANT:
//   Har baar script run karoge to new listings create hongi.
//   Isliye normally sirf ek baar run karo.

require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Listing = require('./models/Listing');

// ============================================================
// YOUR CURRENT LOCATION
// ============================================================

const MY_LAT = 26.9888772;
const MY_LNG = 75.7464114;

// ============================================================
// Helper: Generate coordinates at a specific distance
// from MY_LAT / MY_LNG.
//
// distanceKm = distance from current location
// bearingDeg = direction:
//   0   = North
//   90  = East
//   180 = South
//   270 = West
// ============================================================

function getCoordinatesAtDistance(lat, lng, distanceKm, bearingDeg) {
  const earthRadiusKm = 6371;

  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const bearingRad = (bearingDeg * Math.PI) / 180;

  const distanceRad = distanceKm / earthRadiusKm;

  const newLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(distanceRad) +
      Math.cos(latRad) *
        Math.sin(distanceRad) *
        Math.cos(bearingRad)
  );

  const newLngRad =
    lngRad +
    Math.atan2(
      Math.sin(bearingRad) *
        Math.sin(distanceRad) *
        Math.cos(latRad),
      Math.cos(distanceRad) -
        Math.sin(latRad) * Math.sin(newLatRad)
    );

  return {
    lat: (newLatRad * 180) / Math.PI,
    lng: (newLngRad * 180) / Math.PI,
  };
}

// ============================================================
// Listings
//
// distanceKm is the approximate distance from MY_LAT/MY_LNG.
// bearingDeg spreads listings in different directions.
// ============================================================

const samples = [
  // ----------------------------------------------------------
  // 🟢 0-2 KM
  // ----------------------------------------------------------

  {
    title: 'Cozy 1BHK Near You',
    propertyType: 'flat',
    monthlyRent: 15000,
    distanceKm: 0.8,
    bearingDeg: 45,
  },

  {
    title: 'Premium Boys PG Nearby',
    propertyType: 'pg',
    monthlyRent: 8500,
    distanceKm: 1.3,
    bearingDeg: 180,
  },

  {
    title: 'Furnished Room Near You',
    propertyType: 'room',
    monthlyRent: 10000,
    distanceKm: 1.8,
    bearingDeg: 300,
  },

  // ----------------------------------------------------------
  // 🟡 2-4 KM
  // ----------------------------------------------------------

  {
    title: 'Spacious 2BHK Apartment',
    propertyType: 'flat',
    monthlyRent: 22000,
    distanceKm: 2.7,
    bearingDeg: 90,
  },

  {
    title: 'Affordable Girls PG',
    propertyType: 'pg',
    monthlyRent: 7500,
    distanceKm: 3.6,
    bearingDeg: 225,
  },

  // ----------------------------------------------------------
  // 🔵 4-10 KM
  // ----------------------------------------------------------

  {
    title: 'Modern Furnished Flat',
    propertyType: 'flat',
    monthlyRent: 18000,
    distanceKm: 4.8,
    bearingDeg: 20,
  },

  {
    title: 'Budget Student PG',
    propertyType: 'pg',
    monthlyRent: 6500,
    distanceKm: 6.2,
    bearingDeg: 140,
  },

  {
    title: 'Private Single Room',
    propertyType: 'room',
    monthlyRent: 9000,
    distanceKm: 7.5,
    bearingDeg: 260,
  },

  {
    title: 'Luxury 2BHK Flat',
    propertyType: 'flat',
    monthlyRent: 28000,
    distanceKm: 9.2,
    bearingDeg: 330,
  },

  // ----------------------------------------------------------
  // 🟣 ~10 KM
  // ----------------------------------------------------------

  {
    title: 'Spacious Family Apartment',
    propertyType: 'flat',
    monthlyRent: 25000,
    distanceKm: 10,
    bearingDeg: 60,
  },
];

// ============================================================
// Main
// ============================================================

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      dbName: process.env.DB_NAME,
    });

    console.log(
      `[seed-local] connected to ${process.env.DB_NAME}`
    );

    // --------------------------------------------------------
    // Create / find demo owner
    // --------------------------------------------------------

    let owner = await User.findOne({
      email: 'owner@roomzy.in',
    });

    if (!owner) {
      owner = await User.create({
        name: 'Omar Owner',
        email: 'owner@roomzy.in',
        role: 'owner',
        passwordHash: await bcrypt.hash('owner123', 10),
        phone: '9000000002',

        subscriptionUntil: new Date(
          Date.now() + 365 * 86400000
        ),

        verifiedUntil: new Date(
          Date.now() + 365 * 86400000
        ),
      });

      console.log(
        '[seed-local] created demo owner (owner@roomzy.in / owner123)'
      );
    }

    // --------------------------------------------------------
    // Listing paid duration
    // --------------------------------------------------------

    const paidUntil = new Date(
      Date.now() + 365 * 86400000
    );

    // --------------------------------------------------------
    // Create listings
    // --------------------------------------------------------

    for (const s of samples) {
      const coordinates = getCoordinatesAtDistance(
        MY_LAT,
        MY_LNG,
        s.distanceKm,
        s.bearingDeg
      );

      await Listing.create({
        owner: owner._id,

        title: s.title,

        description:
          'Demo Roomzy listing near your test location.',

        propertyType: s.propertyType,

        monthlyRent: s.monthlyRent,

        securityDepositRequired: true,

        depositAmount: s.monthlyRent * 2,

        advanceMonths: 1,

        preferredTenant: 'any',

        furnishing: 'semi',

        totalRooms: 1,

        availableBeds: 2,

        address: 'Test address near you',

        city: 'Jaipur',

        area: 'Test Area',

        pincode: '302001',

        // IMPORTANT:
        // GeoJSON coordinates must be [longitude, latitude]
        location: {
          type: 'Point',
          coordinates: [
            coordinates.lng,
            coordinates.lat,
          ],
        },

        amenities: {
          ac: true,
          wifi: true,
          parking: true,
          attachedBathroom: true,
          foodAvailable: false,
          roommateAllowed: false,
        },

        photos: [],

        availableNow: true,

        status: 'active',

        paidUntil,
      });

      console.log(
        `[seed-local] inserted: ${s.title} (~${s.distanceKm} KM)`
      );
    }

    console.log('');
    console.log('======================================');
    console.log('[seed-local] DONE');
    console.log('======================================');
    console.log(
      `Base location: ${MY_LAT}, ${MY_LNG}`
    );
    console.log('Listings created: 10');
    console.log('0-2 KM: 3 listings');
    console.log('2-4 KM: 2 listings');
    console.log('4-10 KM: 4 listings');
    console.log('~10 KM: 1 listing');
    console.log('======================================');

    await mongoose.disconnect();

  } catch (error) {
    console.error('[seed-local] error:', error);
    process.exit(1);
  }
}

run();