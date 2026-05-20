export function toId(doc) {
  if (!doc) return null;
  return doc._id?.toString() || doc.id?.toString() || String(doc);
}

export function formatUser(user) {
  if (!user) return null;
  const u = user.toObject ? user.toObject() : user;
  return {
    id: toId(u),
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt,
  };
}

export function formatTask(task) {
  const t = task.toObject ? task.toObject() : task;
  const project = t.projectId?.name ? t.projectId : t.project;
  const assignee = t.assigneeId?.name !== undefined ? t.assigneeId : t.assignee;
  const creator = t.creatorId?.name !== undefined ? t.creatorId : t.creator;

  return {
    id: toId(t),
    title: t.title,
    description: t.description,
    status: t.status,
    dueDate: t.dueDate,
    projectId: toId(t.projectId?._id ? t.projectId : { _id: t.projectId }),
    assigneeId: t.assigneeId ? toId(t.assigneeId?._id ? t.assigneeId : { _id: t.assigneeId }) : null,
    creatorId: toId(t.creatorId?._id ? t.creatorId : { _id: t.creatorId }),
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    project: project?.name
      ? { id: toId(project), name: project.name }
      : project,
    assignee: formatUser(assignee),
    creator: creator ? { id: toId(creator), name: creator.name } : null,
  };
}

export async function formatProject(project, Task) {
  const p = project.toObject ? project.toObject() : project;
  const members = (p.memberIds || []).map((user) => ({
    id: toId(user),
    user: formatUser(user),
  }));
  const taskCount = await Task.countDocuments({ projectId: p._id });

  return {
    id: toId(p),
    name: p.name,
    description: p.description,
    createdAt: p.createdAt,
    creatorId: toId(p.creatorId?._id ? p.creatorId : { _id: p.creatorId }),
    creator: formatUser(p.creatorId),
    members,
    tasks: p.tasks ? p.tasks.map(formatTask) : undefined,
    _count: { tasks: taskCount },
  };
}
