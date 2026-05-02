// JWT auth middleware
const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function authRequired(req, res, next) {
  try {
    let token = req.cookies?.access_token;
    if (!token) {
      const auth = req.headers.authorization || '';
      if (auth.startsWith('Bearer ')) token = auth.slice(7);
    }
    if (!token) return res.status(401).json({ detail: 'Not authenticated' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ detail: 'User not found' });
    req.user = user;
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') return res.status(401).json({ detail: 'Token expired' });
    return res.status(401).json({ detail: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ detail: 'Not authenticated' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ detail: 'Forbidden: requires role ' + roles.join('/') });
    next();
  };
}

module.exports = { authRequired, requireRole };
