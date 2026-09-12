# Roomzy — Local Testing Runbook

App ko doosre laptop pe test karne ke liye. Backend = Node/Express + MongoDB,
Frontend = Expo (React Native). Phone pe **Expo Go** app se test karenge.

## Prerequisites (target laptop)
- Node 18+ (`node -v`)
- Local MongoDB chal raha ho → `mongodb://127.0.0.1:27017`
  - Check: `mongosh` connect ho jaana chahiye. Nahi chal raha to start karo
    (macOS brew: `brew services start mongodb-community`).
- Phone me **Expo Go** app installed.
- **Phone aur laptop SAME Wi-Fi pe** hone chahiye. (Zaroori — warna app backend
  tak nahi pahunchega.)

---

## 1) Backend chalao
```bash
cd backend
npm install
npm start
```
Expected output:
```
[Roomzy] Connected to MongoDB db=roomzy_db
[Roomzy seed] Seeded N listings, tenant=tenant@roomzy.in, owner=owner@roomzy.in
[Roomzy] Backend listening on 0.0.0.0:8001
```
Confirm: browser me `http://localhost:8001/api/health` → `{ "ok": true, ... }`

> Payments **mock mode** me hain (Razorpay keys blank hain `.env` me) — koi real
> paisa nahi katega. Real payments ke liye baad me `RAZORPAY_KEY_ID`/`SECRET` set karna.

---

## 2) Frontend chalao (naye terminal me)
```bash
cd frontend
npm install
npx expo start
```
Terminal me QR aayega → **Expo Go** se scan karo.

App backend ka IP **khud detect** kar leta hai (Expo dev-server ke host se →
`http://<laptop-LAN-IP>:8001`). `.env` me kuch set karne ki zaroorat nahi.

---

## 3) Login karke test karo
Seeded demo accounts:

| Role   | Email               | Password   |
|--------|---------------------|------------|
| Tenant | `tenant@roomzy.in`  | `tenant123`|
| Owner  | `owner@roomzy.in`   | `owner123` |

Tenant se: listings browse, favorites, map. Owner se: add listing, leads, plans/payments (mock).

---

## Troubleshooting
- **App me "Network error" / kuch load nahi hota**
  - Phone aur laptop same Wi-Fi pe hain? (public/guest Wi-Fi devices ko isolate
    karta hai — mobile hotspot try karo.)
  - Backend chal raha hai? `http://localhost:8001/api/health` check karo.
  - Zaroorat pade to laptop ka LAN IP dekho (`ipconfig getifaddr en0` mac /
    `hostname -I` linux) aur `frontend/.env` me manually daalo:
    `EXPO_PUBLIC_BACKEND_URL=http://<laptop-ip>:8001` — phir `npx expo start -c`.
- **`ENOTEMPTY` / corrupt install** → `rm -rf node_modules && npm install`
- **Metro cache issue** → `npx expo start -c` (clear cache)
- **MongoDB connect fail** → mongod running hai? `.env` ka `MONGO_URL` sahi hai?

## Notes
- `backend/server.py` + `requirements.txt` sirf Emergent platform ke liye the —
  local/normal deploy pe inki zaroorat nahi (delete kar sakte ho). Real backend
  = `node server.js`.
