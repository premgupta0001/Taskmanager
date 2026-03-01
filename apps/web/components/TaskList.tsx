'use client';

import { useState, useEffect } from 'react';
import { tasks, Task } from '../lib/supabase';

interface TaskListProps {
  refreshTrigger: number;
  onTaskDeleted: () => void;
  onTaskUpdated: () => void;
}

const priorityColors: Record<number, string> = {
  1: '#dc2626',
  2: '#ea580c',
  3: '#ca8a04',
  4: '#16a34a',
  5: '#64748b',
};

const priorityLabels: Record<number, string> = {
  1: 'Critical',
  2: 'High',
  3: 'Medium',
  4: 'Low',
  5: 'Minimal',
};

export default function TaskList({ refreshTrigger, onTaskDeleted, onTaskUpdated }: TaskListProps) {
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await tasks.getAll();
      if (error) {
        setError(error.message);
      } else {
        setTaskList(data || []);
      }
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [refreshTrigger]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    const { error } = await tasks.delete(id);
    if (error) {
      setError(error.message);
    } else {
      onTaskDeleted();
      fetchTasks();
    }
  };

  const handleToggleComplete = async (task: Task) => {
    const { error } = await tasks.toggleComplete(task.id, !task.completed);
    if (!error) {
      onTaskUpdated();
      fetchTasks();
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
        Loading tasks...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#dc2626' }}>
        Error: {error}
      </div>
    );
  }

  if (taskList.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <p style={{ fontSize: '1.125rem', color: '#666', marginBottom: '0.5rem' }}>
          No tasks yet
        </p>
        <p style={{ color: '#999' }}>
          Add your first task above to get started!
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {taskList.map((task) => (
        <div
          key={task.id}
          style={{
            background: 'white',
            padding: '1rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            opacity: task.completed ? 0.6 : 1,
            transition: 'opacity 0.2s'
          }}
        >
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => handleToggleComplete(task)}
            style={{
              width: '1.25rem',
              height: '1.25rem',
              cursor: 'pointer',
              accentColor: '#16a34a'
            }}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 500,
              fontSize: '1rem',
              textDecoration: task.completed ? 'line-through' : 'none',
              color: task.completed ? '#999' : '#333'
            }}>
              {task.title}
            </div>
            {task.description && (
              <div style={{
                fontSize: '0.875rem',
                color: '#666',
                marginTop: '0.25rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {task.description}
              </div>
            )}
          </div>

          <span style={{
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 600,
            background: `${priorityColors[task.priority]}20`,
            color: priorityColors[task.priority],
            whiteSpace: 'nowrap'
          }}>
            {priorityLabels[task.priority]}
          </span>

          <button
            onClick={() => handleDelete(task.id)}
            style={{
              padding: '0.5rem',
              background: 'none',
              border: 'none',
              color: '#dc2626',
              cursor: 'pointer',
              borderRadius: '4px',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#fee2e2')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
