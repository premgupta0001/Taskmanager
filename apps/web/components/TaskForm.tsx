'use client';

import { useState } from 'react';
import { tasks, TaskPriority } from '../lib/supabase';

interface TaskFormProps {
  onTaskAdded: () => void;
}

export default function TaskForm({ onTaskAdded }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError('');

    try {
      const { error } = await tasks.create({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
      });

      if (error) {
        setError(error.message);
      } else {
        setTitle('');
        setDescription('');
        setPriority(3);
        onTaskAdded();
      }
    } catch (err) {
      setError('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const priorityLabels: Record<TaskPriority, string> = {
    1: '1 - Critical',
    2: '2 - High',
    3: '3 - Medium',
    4: '4 - Low',
    5: '5 - Minimal',
  };

  const priorityColors: Record<TaskPriority, string> = {
    1: '#dc2626',
    2: '#ea580c',
    3: '#ca8a04',
    4: '#16a34a',
    5: '#64748b',
  };

  return (
    <form onSubmit={handleSubmit} style={{
      background: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '1.5rem'
    }}>
      <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Add New Task</h2>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          required
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem'
          }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add more details..."
          rows={2}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem',
            resize: 'vertical'
          }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
          Priority
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {([1, 2, 3, 4, 5] as TaskPriority[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              style={{
                padding: '0.5rem 1rem',
                border: priority === p ? `2px solid ${priorityColors[p]}` : '1px solid #ddd',
                borderRadius: '4px',
                background: priority === p ? `${priorityColors[p]}20` : 'white',
                color: priorityColors[p],
                fontWeight: priority === p ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {priorityLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ color: '#dc2626', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !title.trim()}
        style={{
          width: '100%',
          padding: '0.75rem',
          background: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '1rem',
          fontWeight: 500,
          cursor: loading || !title.trim() ? 'not-allowed' : 'pointer',
          opacity: loading || !title.trim() ? 0.7 : 1
        }}
      >
        {loading ? 'Adding...' : 'Add Task'}
      </button>
    </form>
  );
}
