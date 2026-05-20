import { Router } from 'express';
import mongoose from 'mongoose';
import { body } from 'express-validator';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { formatProject, formatUser } from '../utils/format.js';
import { authenticate, loadUser, requireAdmin, requireProjectAccess } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(authenticate, loadUser);

router.get('/', async (req, res) => {
  try {
    const filter =
      req.user.role === 'ADMIN'
        ? {}
        : { memberIds: req.user.id };

    const projects = await Project.find(filter)
      .populate('creatorId', 'name email role')
      .populate('memberIds', 'name email role')
      .sort({ createdAt: -1 });

    const formatted = await Promise.all(projects.map((p) => formatProject(p, Task)));
    res.json({ projects: formatted });
  } catch {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.get('/:projectId', requireProjectAccess, async (req, res) => {
  try {
    const project = await Project.findById(req.projectId)
      .populate('creatorId', 'name email role')
      .populate('memberIds', 'name email role');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const tasks = await Task.find({ projectId: project._id })
      .populate('assigneeId', 'name email')
      .populate('creatorId', 'name')
      .sort({ createdAt: -1 });

    const formatted = await formatProject(project, Task);
    formatted.tasks = tasks.map((t) => {
      const task = t.toObject();
      return {
        id: task._id.toString(),
        title: task.title,
        description: task.description,
        status: task.status,
        dueDate: task.dueDate,
        projectId: task.projectId.toString(),
        assigneeId: task.assigneeId?.toString() || null,
        creatorId: task.creatorId._id.toString(),
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        assignee: task.assigneeId ? formatUser(task.assigneeId) : null,
        creator: { id: task.creatorId._id.toString(), name: task.creatorId.name },
      };
    });

    res.json({ project: formatted });
  } catch {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

router.post(
  '/',
  requireAdmin,
  [
    body('name').trim().notEmpty().isLength({ max: 120 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('memberIds').optional().isArray(),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, description, memberIds = [] } = req.body;
      const uniqueMemberIds = [...new Set(memberIds)].filter(
        (id) => id !== req.user.id && mongoose.Types.ObjectId.isValid(id)
      );

      const project = await Project.create({
        name,
        description: description || null,
        creatorId: req.user.id,
        memberIds: [req.user.id, ...uniqueMemberIds],
      });

      await project.populate([
        { path: 'creatorId', select: 'name email role' },
        { path: 'memberIds', select: 'name email role' },
      ]);

      res.status(201).json({ project: await formatProject(project, Task) });
    } catch {
      res.status(500).json({ error: 'Failed to create project' });
    }
  }
);

router.put(
  '/:projectId',
  requireAdmin,
  requireProjectAccess,
  [
    body('name').optional().trim().notEmpty().isLength({ max: 120 }),
    body('description').optional().trim().isLength({ max: 500 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, description } = req.body;
      const updates = {};
      if (name) updates.name = name;
      if (description !== undefined) updates.description = description || null;

      const project = await Project.findByIdAndUpdate(req.projectId, updates, { new: true })
        .populate('creatorId', 'name email role')
        .populate('memberIds', 'name email role');

      res.json({ project: await formatProject(project, Task) });
    } catch {
      res.status(500).json({ error: 'Failed to update project' });
    }
  }
);

router.delete('/:projectId', requireAdmin, requireProjectAccess, async (req, res) => {
  try {
    await Task.deleteMany({ projectId: req.projectId });
    await Project.findByIdAndDelete(req.projectId);
    res.json({ message: 'Project deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

router.post(
  '/:projectId/members',
  requireAdmin,
  requireProjectAccess,
  [body('userId').notEmpty()],
  validate,
  async (req, res) => {
    try {
      const { userId } = req.body;
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const project = await Project.findByIdAndUpdate(
        req.projectId,
        { $addToSet: { memberIds: userId } },
        { new: true }
      ).populate('memberIds', 'name email role');

      const member = project.memberIds.find((m) => m._id.toString() === userId);
      res.status(201).json({
        member: {
          id: member._id.toString(),
          user: formatUser(member),
        },
      });
    } catch {
      res.status(500).json({ error: 'Failed to add member' });
    }
  }
);

router.delete(
  '/:projectId/members/:userId',
  requireAdmin,
  requireProjectAccess,
  async (req, res) => {
    try {
      await Project.findByIdAndUpdate(req.projectId, {
        $pull: { memberIds: req.params.userId },
      });
      res.json({ message: 'Member removed' });
    } catch {
      res.status(500).json({ error: 'Failed to remove member' });
    }
  }
);

export default router;
