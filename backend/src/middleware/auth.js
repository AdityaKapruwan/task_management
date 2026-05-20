import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Project from '../models/Project.js';
import { toId } from '../utils/format.js';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export async function loadUser(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.userId)) {
      return res.status(401).json({ error: 'User not found' });
    }
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = {
      id: toId(user),
      email: user.email,
      name: user.name,
      role: user.role,
    };
    next();
  } catch {
    return res.status(500).json({ error: 'Failed to load user' });
  }
}

export async function requireProjectAccess(req, res, next) {
  const projectId = req.params.projectId || req.body.projectId;
  if (!projectId) {
    return res.status(400).json({ error: 'Project ID required' });
  }

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (req.userRole === 'ADMIN') {
    req.projectId = projectId;
    return next();
  }

  const project = await Project.findOne({
    _id: projectId,
    memberIds: req.userId,
  });

  if (!project) {
    return res.status(403).json({ error: 'You are not a member of this project' });
  }

  req.projectId = projectId;
  next();
}
