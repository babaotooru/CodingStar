import React from 'react';

const statusColors = {
  ACCEPTED: 'text-green-400',
  WRONG_ANSWER: 'text-red-400',
  TIME_LIMIT_EXCEEDED: 'text-yellow-400',
  MEMORY_LIMIT_EXCEEDED: 'text-yellow-400',
  RUNTIME_ERROR: 'text-orange-400',
  COMPILATION_ERROR: 'text-orange-400',
  PENDING: 'text-dark-400',
  RUNNING: 'text-blue-400',
};

const statusLabels = {
  ACCEPTED: 'Accepted',
  WRONG_ANSWER: 'Wrong Answer',
  TIME_LIMIT_EXCEEDED: 'Time Limit Exceeded',
  MEMORY_LIMIT_EXCEEDED: 'Memory Limit Exceeded',
  RUNTIME_ERROR: 'Runtime Error',
  COMPILATION_ERROR: 'Compilation Error',
  PENDING: 'Pending',
  RUNNING: 'Running...',
};

function StatusBadge({ status }) {
  return (
    <span className={`font-semibold ${statusColors[status] || 'text-dark-400'}`}>
      {statusLabels[status] || status}
    </span>
  );
}

export default StatusBadge;
