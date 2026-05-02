// Auth routes - register, login, /me, logout, forgot/reset password
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const router = express.Router();

const ATTEMPTS = new Map(); // brute-force guard: ip:email -> {count, until}
const RESET_TOKENS = new Map(); // token -> {userId, expiresAt}

function issueTokens(user) {
  const accessToken = jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  return { accessToken };
}

function setAuthCookie(res, token) {
  res.cookie('access_token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body || {};
    if (!name || !email || !password || !role) {
      return res.status(400).json({ detail: 'name, email, password, role are required' });
    }
    if (!['owner', 'tenant'].includes(role)) {
      return res.status(400).json({ detail: 'role must be owner or tenant' });
    }
    if (password.length < 6) {
      return res.status(400).json({ detail: 'Password must be at least 6 characters' });
    }
    const normEmail = email.toLowerCase().trim();
    const exists = await User.findOne({ email: normEmail });
    if (exists) return res.status(409).json({ detail: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: normEmail, passwordHash, role, phone: phone || '' });
    const { accessToken } = issueTokens(user);
    setAuthCookie(res, accessToken);
    return res.status(201).json({ user: user.toJSON(), token: accessToken });
  } catch (e) {
    console.error('register error', e);
    return res.status(500).json({ detail: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ detail: 'email and password required' });
    const normEmail = email.toLowerCase().trim();
    const ip = req.ip || 'unknown';
    const key = `${ip}:${normEmail}`;
    const rec = ATTEMPTS.get(key);
    if (rec && rec.count >= 5 && rec.until > Date.now()) {
      const mins = Math.ceil((rec.until - Date.now()) / 60000);
      return res.status(429).json({ detail: `Too many attempts. Try again in ${mins} min.` });
    }
    const user = await User.findOne({ email: normEmail });
    if (!user) {
      const r = ATTEMPTS.get(key) || { count: 0, until: 0 };
      r.count += 1;
      r.until = Date.now() + 15 * 60 * 1000;
      ATTEMPTS.set(key, r);
      return res.status(401).json({ detail: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      const r = ATTEMPTS.get(key) || { count: 0, until: 0 };
      r.count += 1;
      r.until = Date.now() + 15 * 60 * 1000;
      ATTEMPTS.set(key, r);
      return res.status(401).json({ detail: 'Invalid credentials' });
    }
    ATTEMPTS.delete(key);
    const { accessToken } = issueTokens(user);
    setAuthCookie(res, accessToken);
    return res.json({ user: user.toJSON(), token: accessToken });
  } catch (e) {
    console.error('login error', e);
    return res.status(500).json({ detail: 'Login failed' });
  }
});

const { authRequired } = require('../middleware/auth');

router.get('/me', authRequired, async (req, res) => {
  return res.json(req.user.toJSON());
});

router.post('/logout', authRequired, (req, res) => {
  res.clearCookie('access_token', { path: '/' });
  return res.json({ ok: true });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ detail: 'email required' });
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  // Always respond ok to prevent email enumeration
  if (user) {
    const token = crypto.randomBytes(24).toString('hex');
    RESET_TOKENS.set(token, { userId: user._id.toString(), expiresAt: Date.now() + 60 * 60 * 1000 });
    console.log(`[Roomzy] Password reset link: /reset-password?token=${token} (user=${user.email})`);
    return res.json({ ok: true, dev_token: process.env.NODE_ENV === 'production' ? undefined : token });
  }
  return res.json({ ok: true });
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ detail: 'token and password required' });
  if (password.length < 6) return res.status(400).json({ detail: 'Password must be at least 6 characters' });
  const rec = RESET_TOKENS.get(token);
  if (!rec || rec.expiresAt < Date.now()) return res.status(400).json({ detail: 'Invalid or expired token' });
  const user = await User.findById(rec.userId);
  if (!user) return res.status(404).json({ detail: 'User not found' });
  user.passwordHash = await bcrypt.hash(password, 10);
  await user.save();
  RESET_TOKENS.delete(token);
  return res.json({ ok: true });
});

module.exports = router;
