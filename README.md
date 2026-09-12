# Roomzy

Roomzy is a mobile rental marketplace for India. Tenants can discover flats, PGs, rooms and bed spaces; property owners can publish listings and manage enquiries.

## Before launch

1. Create a MongoDB database (MongoDB Atlas is suitable) and set a long random `JWT_SECRET`.
2. Copy `backend/.env.example` to `backend/.env` and fill in the production values. Never commit this file.
3. Copy `frontend/.env.example` to `frontend/.env` and set the public HTTPS API URL.
4. Configure Razorpay production keys only after completing your merchant KYC. The app uses mock payments while Razorpay keys are absent.
5. Set `NODE_ENV=production` and an explicit comma-separated `CORS_ORIGIN` before deploying the API.

## Run locally

Start the API:

```powershell
cd backend
npm install
npm start
```

Start the mobile app:

```powershell
cd frontend
npm install
npm start
```

## India-market safeguards included

- Indian 10-digit mobile validation; owner contact number is required.
- Six-digit PIN validation and sensible minimum listing rent.
- INR pricing, Razorpay payment records, and server-side signature verification.
- Tenant-only enquiries/reports, API rate limiting, and production CORS restrictions.

## Production follow-ups

- Replace Base64 photo storage with Cloudinary or S3.
- Add SMS/WhatsApp OTP before treating an owner as verified.
- Add Razorpay Checkout in the app for live payments and use Razorpay webhooks for payment reconciliation.
- Publish Terms, Privacy Policy, grievance/contact details, and a listing moderation process before public launch.
