import { Router } from 'express';
import User from '../models/User.js';
import { formatUser } from '../utils/format.js';
import { authenticate, loadUser, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, loadUser, requireAdmin);

router.get('/', async (_req, res) => {
  try {
    const users = await User.find().select('-password').sort({ name: 1 });
    res.json({ users: users.map(formatUser) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;
