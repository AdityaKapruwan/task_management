import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import User from '../models/User.js';
import { formatUser } from '../utils/format.js';
import { authenticate, loadUser } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

function signToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
    body('role').optional().isIn(['ADMIN', 'MEMBER']),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password, name, role } = req.body;
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const userCount = await User.countDocuments();
      const assignedRole = userCount === 0 ? 'ADMIN' : role === 'ADMIN' ? 'MEMBER' : (role || 'MEMBER');

      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({ email, password: hashed, name, role: assignedRole });
      const safeUser = formatUser(user);
      const token = signToken(safeUser);
      res.status(201).json({ user: safeUser, token });
    } catch {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const safeUser = formatUser(user);
      const token = signToken(safeUser);
      res.json({ user: safeUser, token });
    } catch {
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

router.get('/me', authenticate, loadUser, (req, res) => {
  res.json({ user: req.user });
});

export default router;
