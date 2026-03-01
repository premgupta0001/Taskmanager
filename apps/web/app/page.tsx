'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthProvider';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import { Task } from '@taskmanager/supabase';

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showCompleted, setShowCompleted] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user, refreshTrigger]);

  const loadTasks = async () => {
    const { supabase } = await import('@taskmanager/supabase');
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    setTasks(data as Task[] || []);
  };

  const sortedTasks = useMemo(() => {
    const activeTasks = showCompleted 
      ? tasks 
      : tasks.filter(t => !t.completed);

    return [...activeTasks].sort((a, b) => {
      const aCreated = new Date(a.created_at).getTime();
      const bCreated = new Date(b.created_at).getTime();
      const aDays = (Date.now() - aCreated) / (1000 * 60 * 60 * 24);
      const bDays = (Date.now() - bCreated) / (1000 * 60 * 60 * 24);
      
      const aScore = (6 - a.priority) * 100 + aDays;
      const bScore = (6 - b.priority) * 100 + bDays;
      
      return aScore - bScore;
    });
  }, [tasks, showCompleted]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.filter(t => !t.completed).length;

  return (
    <main style={{
      minHeight: '100vh',
      background: '#f5f5f5',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              Task Manager
            </h1>
            <p style={{ color: '#666' }}>
              {user.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              padding: '0.5rem 1rem',
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            Sign Out
          </button>
        </header>

        <TaskForm onTaskAdded={() => setRefreshTrigger(r => r + 1)} />

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h2 style={{ fontSize: '1.25rem' }}>Your Tasks</h2>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#666', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
              />
              Show completed
            </label>
          </div>

          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            <span style={{ color: '#16a34a', fontWeight: 500 }}>
              {pendingCount} pending
            </span>
            <span style={{ color: '#666' }}>
              {completedCount} completed
            </span>
          </div>

          {sortedTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              No tasks to show
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sortedTasks.map((task, index) => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    background: '#fafafa',
                    borderRadius: '8px',
                    border: '1px solid #eee'
                  }}
                >
                  <span style={{
                    width: '2rem',
                    height: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: index === 0 ? '#fef3c7' : '#f3f4f6',
                    borderRadius: '50%',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: index === 0 ? '#92400e' : '#666'
                  }}>
                    {index + 1}
                  </span>

                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={async () => {
                      const { supabase } = await import('@taskmanager/supabase');
                      await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id);
                      setRefreshTrigger(r => r + 1);
                    }}
                    style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      cursor: 'pointer',
                      accentColor: '#16a34a'
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 500,
                      textDecoration: task.completed ? 'line-through' : 'none',
                      color: task.completed ? '#999' : '#333'
                    }}>
                      {task.title}
                    </div>
                    {task.description && (
                      <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                        {task.description}
                      </div>
                    )}
                  </div>

                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: task.priority <= 2 ? '#fee2e2' : task.priority === 3 ? '#fef3c7' : '#f3f4f6',
                    color: task.priority <= 2 ? '#dc2626' : task.priority === 3 ? '#92400e' : '#666'
                  }}>
                    P{task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{
          textAlign: 'center',
          fontSize: '0.875rem',
          color: '#999',
          marginTop: '2rem'
        }}>
          Smart Algorithm: Tasks are sorted by priority (lower = do first) + age (older tasks get a slight boost)
        </div>
      </div>
    </main>
  );
}
