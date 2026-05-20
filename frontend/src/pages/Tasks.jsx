import { useEffect, useState } from 'react';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    const query = filter ? `?status=${filter}` : '';
    api(`/tasks${query}`)
      .then(({ tasks }) => setTasks(tasks))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    load();
  }, [filter]);

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

  const isOverdue = (task) =>
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2>All tasks</h2>
          <p>Track and update task progress</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
          <option value="">All statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
      </header>

      {error && <div className="alert error">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Project</th>
              <th>Assignee</th>
              <th>Status</th>
              <th>Due</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className={isOverdue(task) ? 'row-overdue' : ''}>
                <td>
                  <strong>{task.title}</strong>
                  {isOverdue(task) && <span className="overdue-tag">Overdue</span>}
                </td>
                <td>{task.project.name}</td>
                <td>{task.assignee?.name || 'Unassigned'}</td>
                <td><StatusBadge status={task.status} /></td>
                <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</td>
                <td>
                  <select value={task.status} onChange={(e) => handleStatusChange(task.id, e.target.value)}>
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
      {tasks.length === 0 && <p className="empty">No tasks found</p>}
    </div>
  );
}
