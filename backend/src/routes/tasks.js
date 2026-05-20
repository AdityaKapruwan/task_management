import { Router } from 'express';
import mongoose from 'mongoose';
import { body } from 'express-validator';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import { formatTask } from '../utils/format.js';
import { authenticate, loadUser } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(authenticate, loadUser);

function canManageTask(user, task) {
  if (user.role === 'ADMIN') return true;
  if (task.creatorId.toString() === user.id) return true;
  if (task.assigneeId?.toString() === user.id) return true;
  return false;
}

async function getMemberProjectIds(userId) {
  const projects = await Project.find({ memberIds: userId }).select('_id');
  return projects.map((p) => p._id);
}

router.get('/', async (req, res) => {
  try {
    const { projectId, status } = req.query;
    const filter = {};

    if (projectId) filter.projectId = projectId;
    if (status) filter.status = status;

    if (req.user.role !== 'ADMIN') {
      const projectIds = await getMemberProjectIds(req.user.id);
      filter.$or = [
        { projectId: { $in: projectIds } },
        { assigneeId: req.user.id },
      ];
    }

    const tasks = await Task.find(filter)
      .populate('projectId', 'name')
      .populate('assigneeId', 'name email')
      .populate('creatorId', 'name')
      .sort({ dueDate: 1, createdAt: -1 });

    res.json({ tasks: tasks.map(formatTask) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.post(
  '/',
  [
    body('title').trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('projectId').notEmpty(),
    body('assigneeId').optional(),
    body('dueDate').optional().isISO8601(),
    body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE']),
  ],
  validate,
  async (req, res) => {
    try {
      const { title, description, projectId, assigneeId, dueDate, status } = req.body;

      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (req.user.role !== 'ADMIN') {
        const project = await Project.findOne({ _id: projectId, memberIds: req.user.id });
        if (!project) {
          return res.status(403).json({ error: 'Not a project member' });
        }
      }

      if (assigneeId) {
        const project = await Project.findById(projectId);
        const isMember = project?.memberIds.some((id) => id.toString() === assigneeId);
        if (!isMember && req.user.role !== 'ADMIN') {
          return res.status(400).json({ error: 'Assignee must be a project member' });
        }
      }

      const task = await Task.create({
        title,
        description: description || null,
        projectId,
        assigneeId: assigneeId || null,
        creatorId: req.user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || 'TODO',
      });

      await task.populate([
        { path: 'projectId', select: 'name' },
        { path: 'assigneeId', select: 'name email' },
        { path: 'creatorId', select: 'name' },
      ]);

      res.status(201).json({ task: formatTask(task) });
    } catch {
      res.status(500).json({ error: 'Failed to create task' });
    }
  }
);

router.put(
  '/:taskId',
  [
    body('title').optional().trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('assigneeId').optional(),
    body('dueDate').optional().isISO8601(),
    body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE']),
  ],
  validate,
  async (req, res) => {
    try {
      const task = await Task.findById(req.params.taskId);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      if (!canManageTask(req.user, task)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const isMemberOnly = req.user.role !== 'ADMIN';
      if (
        isMemberOnly &&
        req.body.assigneeId !== undefined &&
        req.body.assigneeId !== (task.assigneeId?.toString() || null)
      ) {
        return res.status(403).json({ error: 'Members cannot reassign tasks' });
      }

      const { title, description, assigneeId, dueDate, status } = req.body;
      if (title) task.title = title;
      if (description !== undefined) task.description = description || null;
      if (assigneeId !== undefined) task.assigneeId = assigneeId || null;
      if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
      if (status) task.status = status;

      await task.save();
      await task.populate([
        { path: 'projectId', select: 'name' },
        { path: 'assigneeId', select: 'name email' },
        { path: 'creatorId', select: 'name' },
      ]);

      res.json({ task: formatTask(task) });
    } catch {
      res.status(500).json({ error: 'Failed to update task' });
    }
  }
);

router.delete('/:taskId', async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (req.user.role !== 'ADMIN' && task.creatorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only admin or task creator can delete' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
