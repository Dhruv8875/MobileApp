# Roomzy — Product Requirements Document (PRD)

## Product
**Roomzy** — A mobile-first rental discovery platform for India helping students, workers, bachelors, and families find PGs, rooms, flats, and bed spaces. Owners list properties; tenants discover and connect.

## Tech Stack
- **Frontend**: Expo (React Native) with expo-router, TypeScript, lucide-react-native icons
- **Backend**: Node.js + Express on port 8001 (launched via Python `os.execvp` wrapper to integrate with the existing supervisor config)
- **DB**: MongoDB (Mongoose ODM)
- **Auth**: JWT (HS256) with bcrypt hashes, httpOnly cookie + Bearer header
- **Payments**: Razorpay (mock fallback when keys unset) — handles ₹99 renewals, ₹299 featured, ₹199 owner verification
- **Images**: Stored as base64 strings inside MongoDB

## Roles
1. **Tenant** — search/filter, save favorites, contact owner (call/WhatsApp/callback), report fakes, share
2. **Owner** — add/edit/delete listings, view leads & visit stats, pay to renew/feature, get verified

## Mongoose Schemas
- **User**: name, email, phone, passwordHash, role, avatar, isVerifiedOwner, verifiedUntil, favorites[], bio
- **Listing**: owner, title, description, propertyType, monthlyRent, deposit fields, preferredTenant, furnishing, address+geo, amenities{ac,wifi,parking,bath,food,roommate}, photos[], availableFrom, status, freeUntil, paidUntil, isFeatured, featuredUntil, profileVisits, leads
- **Payment**: user, listing, purpose (renewal/featured/verification), amount, razorpayOrderId/PaymentId/Signature, status
- **Report**: listing, reporter, reason, status
- **ChatMessage**: listing, from, to, text, read
- **Notification**: user, type, title, body, data, read
- **Lead**: listing, owner, tenant, type, message

## Monetization
- New listings: free 7 days
- Renewal: ₹99 / 30 days
- Featured: ₹299 / 30 days top placement
- Verified Owner badge: ₹199 / year
- Hourly cron auto-expires listings + unfeatures them.

## API (selected)
| Method | Path | Notes |
|---|---|---|
| POST | /api/auth/register | role: owner/tenant |
| POST | /api/auth/login | |
| GET | /api/auth/me | |
| GET | /api/listings | filters: city, propertyType, furnishing, preferredTenant, ac, wifi, etc |
| GET | /api/listings/:id | tracks profile visits |
| POST | /api/listings | owner only |
| PUT/DELETE | /api/listings/:id | owner only |
| POST | /api/listings/:id/lead | tenant action |
| POST | /api/listings/:id/report | tenant action |
| GET | /api/listings/mine/list | owner |
| GET | /api/listings/mine/leads | owner |
| GET | /api/users/favorites | tenant |
| POST | /api/users/favorites/:id | toggle |
| POST | /api/payments/create-order | mock fallback if keys missing |
| POST | /api/payments/verify | applies benefit |
| GET | /api/payments/my | history |

## UI Pages
- `/` — Landing/onboarding (Get Started + Login)
- `/login`, `/register` (with role pick)
- `(tabs)/index` — Discover with chip filters
- `(tabs)/favorites` — Saved homes (tenant)
- `(tabs)/dashboard` — Owner dashboard with stats + listing actions
- `(tabs)/profile` — User profile + logout
- `/listing/[id]` — Image gallery, amenities, owner card, Call/WhatsApp/Callback
- `/owner/add-listing` — Multi-section form with base64 image upload
- `/owner/leads` — Lead inbox
- `/owner/payments` — Payment history

## Launch Roadmap
- **Phase 1 (MVP, 15 days)**: ✅ delivered — auth, listings CRUD, search, favorites, leads, mock payments, owner dashboard
- **Phase 2 (Paid launch)**: real Razorpay keys, Cloudinary CDN, verified owner KYC, push notifications
- **Phase 3 (Scale)**: Google Maps integration, in-app chat (Socket.io), expand to 10+ Indian cities, referral program

## Revenue Model
- **Basic**: listing renewal (₹99) — primary ARR driver
- **Growth**: featured placement (₹299) + verified badge (₹199) + premium tenant subscription (future)
- **Future**: brokerage cut on signed leases, paid lead packages for brokers, ads from movers/painters/electricians
