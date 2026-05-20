import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toISOString().slice(0, 10);
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assigneeId: '',
    dueDate: '',
    status: 'TODO',
  });
  const [memberId, setMemberId] = useState('');

  const load = () => {
    api(`/projects/${id}`)
      .then(({ project }) => setProject(project))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    load();
    if (isAdmin) {
      api('/users').then(({ users }) => setUsers(users)).catch(() => {});
    }
  }, [id, isAdmin]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          ...taskForm,
          projectId: id,
          assigneeId: taskForm.assigneeId || undefined,
          dueDate: taskForm.dueDate || undefined,
        }),
      });
      setTaskForm({ title: '', description: '', assigneeId: '', dueDate: '', status: 'TODO' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await api(`/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberId) return;
    try {
      await api(`/projects/${id}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId: memberId }),
      });
      setMemberId('');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!project) return <div className="loading-screen">Loading project...</div>;

  const members = project.members.map((m) => m.user);
  const availableUsers = users.filter((u) => !members.some((m) => m.id === u.id));

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <Link to="/projects" className="back-link">← Projects</Link>
          <h2>{project.name}</h2>
          <p>{project.description}</p>
        </div>
      </header>

      {error && <div className="alert error">{error}</div>}

      <div className="detail-grid">
        <section className="panel">
          <h3>Team members</h3>
          <ul className="member-list">
            {members.map((m) => (
              <li key={m.id}>
                <strong>{m.name}</strong>
                <span>{m.email}</span>
                <span className={`role-badge ${m.role.toLowerCase()}`}>{m.role}</span>
              </li>
            ))}
          </ul>
          {isAdmin && availableUsers.length > 0 && (
            <form className="inline-form" onSubmit={handleAddMember}>
              <select value={memberId} onChange={(e) => setMemberId(e.target.value)} required>
                <option value="">Add member...</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              <button type="submit" className="btn-secondary">Add</button>
            </form>
          )}
        </section>

        <section className="panel">
          <h3>Create task</h3>
          <form className="form-card" onSubmit={handleCreateTask}>
            <label>
              Title
              <input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required />
            </label>
            <label>
              Description
              <textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} rows={2} />
            </label>
            <label>
              Assign to
              <select value={taskForm.assigneeId} onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}>
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>
            <label>
              Due date
              <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
            </label>
            <button type="submit" className="btn-primary">Add task</button>
          </form>
        </section>
      </div>

      <section className="panel">
        <h3>Project tasks ({project.tasks.length})</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Assignee</th>
                <th>Status</th>
                <th>Due</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {project.tasks.map((task) => (
                <tr key={task.id}>
                  <td>
                    <strong>{task.title}</strong>
                    {task.description && <p className="sub">{task.description}</p>}
                  </td>
                  <td>{task.assignee?.name || '—'}</td>
                  <td><StatusBadge status={task.status} /></td>
                  <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</td>
                  <td>
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
