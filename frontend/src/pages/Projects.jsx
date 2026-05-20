import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Projects() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', memberIds: [] });

  const load = () => {
    api('/projects')
      .then(({ projects }) => setProjects(projects))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    load();
    if (isAdmin) {
      api('/users').then(({ users }) => setUsers(users)).catch(() => {});
    }
  }, [isAdmin]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api('/projects', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setForm({ name: '', description: '', memberIds: [] });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleMember = (id) => {
    setForm((f) => ({
      ...f,
      memberIds: f.memberIds.includes(id)
        ? f.memberIds.filter((m) => m !== id)
        : [...f.memberIds, id],
    }));
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2>Projects</h2>
          <p>Manage team projects and members</p>
        </div>
        {isAdmin && (
          <button type="button" className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'New project'}
          </button>
        )}
      </header>

      {error && <div className="alert error">{error}</div>}

      {showForm && isAdmin && (
        <form className="card form-card" onSubmit={handleCreate}>
          <h3>Create project</h3>
          <label>
            Name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Description
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </label>
          <fieldset>
            <legend>Add team members</legend>
            {users.map((u) => (
              <label key={u.id} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.memberIds.includes(u.id)}
                  onChange={() => toggleMember(u.id)}
                />
                {u.name} ({u.role})
              </label>
            ))}
          </fieldset>
          <button type="submit" className="btn-primary">Create project</button>
        </form>
      )}

      <div className="project-grid">
        {projects.map((project) => (
          <Link key={project.id} to={`/projects/${project.id}`} className="project-card">
            <h3>{project.name}</h3>
            <p>{project.description || 'No description'}</p>
            <div className="project-meta">
              <span>{project._count.tasks} tasks</span>
              <span>{project.members.length} members</span>
            </div>
          </Link>
        ))}
      </div>
      {projects.length === 0 && <p className="empty">No projects yet</p>}
    </div>
  );
}
