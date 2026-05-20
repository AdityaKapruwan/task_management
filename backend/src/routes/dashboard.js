import { Router } from 'express';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import { formatTask } from '../utils/format.js';
import { authenticate, loadUser } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, loadUser);

router.get('/', async (req, res) => {
  try {
    const now = new Date();
    let filter = {};

    if (req.user.role !== 'ADMIN') {
      const projectIds = (
        await Project.find({ memberIds: req.user.id }).select('_id')
      ).map((p) => p._id);

      filter = {
        $or: [{ projectId: { $in: projectIds } }, { assigneeId: req.user.id }],
      };
    }

    const tasks = await Task.find(filter)
      .populate('projectId', 'name')
      .populate('assigneeId', 'name email')
      .sort({ dueDate: 1, createdAt: -1 });

    const formatted = tasks.map(formatTask);

    const statusCounts = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    for (const task of formatted) {
      statusCounts[task.status]++;
    }

    const overdue = formatted.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
    );
    const dueSoon = formatted.filter((t) => {
      if (!t.dueDate || t.status === 'DONE') return false;
      const diff = new Date(t.dueDate).getTime() - now.getTime();
      return diff >= 0 && diff <= 3 * 24 * 60 * 60 * 1000;
    });
    const myTasks = formatted.filter((t) => t.assigneeId === req.user.id);

    const projectFilter =
      req.user.role === 'ADMIN' ? {} : { memberIds: req.user.id };
    const projectCount = await Project.countDocuments(projectFilter);

    res.json({
      summary: {
        totalTasks: formatted.length,
        projectCount,
        statusCounts,
        overdueCount: overdue.length,
        dueSoonCount: dueSoon.length,
        myTaskCount: myTasks.length,
      },
      overdue,
      dueSoon,
      recentTasks: formatted.slice(0, 10),
      myTasks: myTasks.slice(0, 10),
    });
  } catch {
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

export default router;
