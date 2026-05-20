import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/dashboard')
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <div className="loading-screen">Loading dashboard...</div>;

  const { summary, overdue, dueSoon, recentTasks, myTasks } = data;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Overview of tasks, statuses, and overdue items</p>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total tasks</span>
          <span className="stat-value">{summary.totalTasks}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Projects</span>
          <span className="stat-value">{summary.projectCount}</span>
        </div>
        <div className="stat-card warn">
          <span className="stat-label">Overdue</span>
          <span className="stat-value">{summary.overdueCount}</span>
        </div>
        <div className="stat-card accent">
          <span className="stat-label">Due in 3 days</span>
          <span className="stat-value">{summary.dueSoonCount}</span>
        </div>
      </div>

      <div className="status-overview">
        <div className="status-pill todo">To Do: {summary.statusCounts.TODO}</div>
        <div className="status-pill progress">In Progress: {summary.statusCounts.IN_PROGRESS}</div>
        <div className="status-pill done">Done: {summary.statusCounts.DONE}</div>
      </div>

      <div className="dashboard-grid">
        <section className="panel highlight-overdue">
          <h3>Overdue tasks</h3>
          {overdue.length === 0 ? (
            <p className="empty">No overdue tasks — great work!</p>
          ) : (
            <ul className="task-list compact">
              {overdue.map((task) => (
                <li key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <span>{task.project.name}</span>
                  </div>
                  <div className="task-meta">
                    <StatusBadge status={task.status} />
                    <span className="overdue-date">{formatDate(task.dueDate)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <h3>Due soon</h3>
          {dueSoon.length === 0 ? (
            <p className="empty">Nothing due in the next 3 days</p>
          ) : (
            <ul className="task-list compact">
              {dueSoon.map((task) => (
                <li key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <span>{task.project.name}</span>
                  </div>
                  <div className="task-meta">
                    <StatusBadge status={task.status} />
                    <span>{formatDate(task.dueDate)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <h3>My assigned tasks</h3>
          {myTasks.length === 0 ? (
            <p className="empty">No tasks assigned to you</p>
          ) : (
            <ul className="task-list compact">
              {myTasks.map((task) => (
                <li key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <span>{task.project.name}</span>
                  </div>
                  <StatusBadge status={task.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel full-width">
          <div className="panel-header-row">
            <h3>Recent tasks</h3>
            <Link to="/tasks" className="link">View all</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Assignee</th>
                  <th>Status</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map((task) => (
                  <tr key={task.id} className={task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? 'row-overdue' : ''}>
                    <td>{task.title}</td>
                    <td>{task.project.name}</td>
                    <td>{task.assignee?.name || 'Unassigned'}</td>
                    <td><StatusBadge status={task.status} /></td>
                    <td>{formatDate(task.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
