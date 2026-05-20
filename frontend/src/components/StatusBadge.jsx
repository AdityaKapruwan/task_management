const labels = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

export default function StatusBadge({ status }) {
  return <span className={`status-badge status-${status.toLowerCase().replace('_', '-')}`}>{labels[status] || status}</span>;
}
