// Roomzy seed - admin/test users + sample listings
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Listing = require('./models/Listing');

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1771327811766-5f4149190b3d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBiZWRyb29tJTIwaW50ZXJpb3IlMjBpbmRpYXxlbnwwfHx8fDE3Nzc3MTcwMjF8MA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1750420556288-d0e32a6f517b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBiZWRyb29tJTIwaW50ZXJpb3IlMjBpbmRpYXxlbnwwfHx8fDE3Nzc3MTcwMjF8MA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1771328756051-dff10c3feaab?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHw0fHxtb2Rlcm4lMjBiZWRyb29tJTIwaW50ZXJpb3IlMjBpbmRpYXxlbnwwfHx8fDE3Nzc3MTcwMjF8MA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1559329146-807aff9ff1fb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBidWlsZGluZyUyMGV4dGVyaW9yfGVufDB8fHx8MTc3NzcxNzAyMXww&ixlib=rb-4.1.0&q=85',
];

async function ensureUser({ name, email, role, password, phone, isVerifiedOwner = false }) {
  let u = await User.findOne({ email });
  const hash = await bcrypt.hash(password, 10);
  if (!u) {
    u = await User.create({ name, email, role, passwordHash: hash, phone, isVerifiedOwner });
  } else {
    u.passwordHash = hash;
    u.role = role;
    u.isVerifiedOwner = isVerifiedOwner;
    if (phone) u.phone = phone;
    await u.save();
  }
  return u;
}

async function seed() {
  try {
    const tenant = await ensureUser({
      name: 'Tina Tenant', email: 'tenant@roomzy.in', role: 'tenant', password: 'tenant123', phone: '9000000001',
    });
    const owner = await ensureUser({
      name: 'Omar Owner', email: 'owner@roomzy.in', role: 'owner', password: 'owner123', phone: '9000000002', isVerifiedOwner: true,
    });

    const count = await Listing.countDocuments({ owner: owner._id });
    if (count >= 4) {
      console.log(`[Roomzy seed] Listings already exist (${count}). Skipping.`);
      return;
    }

    const now = Date.now();
    const free7 = new Date(now + 7 * 24 * 60 * 60 * 1000);
    const paid30 = new Date(now + 30 * 24 * 60 * 60 * 1000);
    const samples = [
      {
        title: 'Sunny 1BHK near Koramangala Metro',
        description: 'Spacious 1BHK with great ventilation, walking distance to metro.',
        propertyType: 'flat', monthlyRent: 18000, securityDepositRequired: true, depositAmount: 36000, advanceMonths: 2,
        electricityIncluded: false, waterIncluded: true, maintenanceCharge: 1500,
        preferredTenant: 'family', furnishing: 'semi', totalRooms: 1, availableBeds: 2,
        address: '1st Block, 5th Cross', city: 'Bengaluru', area: 'Koramangala', pincode: '560034',
        landmark: 'Near Forum Mall',
        location: { type: 'Point', coordinates: [77.6271, 12.9352] },
        amenities: { ac: true, attachedBathroom: true, wifi: true, parking: true, foodAvailable: false, roommateAllowed: false },
        photos: [SAMPLE_IMAGES[0], SAMPLE_IMAGES[3]], availableNow: true, paidUntil: paid30, isFeatured: true,
        featuredUntil: paid30,
      },
      {
        title: 'Boys PG with food in HSR Layout',
        description: 'Affordable boys PG with all meals, WiFi, laundry.',
        propertyType: 'pg', monthlyRent: 8500, securityDepositRequired: true, depositAmount: 8500, advanceMonths: 1,
        electricityIncluded: true, waterIncluded: true, maintenanceCharge: 0,
        preferredTenant: 'boys', furnishing: 'furnished', totalRooms: 8, availableBeds: 4,
        address: 'Sector 7, HSR Layout', city: 'Bengaluru', area: 'HSR Layout', pincode: '560102',
        landmark: 'Opp 27th Main',
        location: { type: 'Point', coordinates: [77.6411, 12.9081] },
        amenities: { ac: false, attachedBathroom: true, wifi: true, parking: false, foodAvailable: true, roommateAllowed: true },
        photos: [SAMPLE_IMAGES[1]], availableNow: true, freeUntil: free7,
      },
      {
        title: 'Girls PG single room - Indiranagar',
        description: 'Premium girls PG, single occupancy, fully furnished.',
        propertyType: 'pg', monthlyRent: 14000, securityDepositRequired: true, depositAmount: 14000, advanceMonths: 1,
        electricityIncluded: true, waterIncluded: true, maintenanceCharge: 0,
        preferredTenant: 'girls', furnishing: 'furnished', totalRooms: 1, availableBeds: 1,
        address: '100 Ft Road', city: 'Bengaluru', area: 'Indiranagar', pincode: '560038',
        landmark: 'Near Sony Signal',
        location: { type: 'Point', coordinates: [77.6410, 12.9719] },
        amenities: { ac: true, attachedBathroom: true, wifi: true, parking: false, foodAvailable: true, roommateAllowed: false },
        photos: [SAMPLE_IMAGES[2], SAMPLE_IMAGES[0]], availableNow: true, paidUntil: paid30,
      },
      {
        title: 'Shared Bed Space in Whitefield',
        description: 'Shared room, two beds. Great for working professionals.',
        propertyType: 'bed', monthlyRent: 6000, securityDepositRequired: false, depositAmount: 0, advanceMonths: 0,
        electricityIncluded: true, waterIncluded: true, maintenanceCharge: 0,
        preferredTenant: 'any', furnishing: 'semi', totalRooms: 1, availableBeds: 2,
        address: 'Phase 1, ITPL Main Rd', city: 'Bengaluru', area: 'Whitefield', pincode: '560066',
        landmark: 'Near ITPL',
        location: { type: 'Point', coordinates: [77.7500, 12.9698] },
        amenities: { ac: false, attachedBathroom: false, wifi: true, parking: true, foodAvailable: false, roommateAllowed: true },
        photos: [SAMPLE_IMAGES[3], SAMPLE_IMAGES[1]], availableNow: true, freeUntil: free7,
      },
    ];
    await Listing.insertMany(samples.map((s) => ({ ...s, owner: owner._id })));
    console.log(`[Roomzy seed] Seeded ${samples.length} listings, tenant=${tenant.email}, owner=${owner.email}`);
  } catch (e) {
    console.error('[Roomzy seed] error', e);
  }
}

module.exports = seed;
