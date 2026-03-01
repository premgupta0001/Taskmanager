'use client';

import { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { tasks, Task, TaskPriority } from '@taskmanager/supabase';

interface TaskListProps {
  refreshTrigger: number;
}

const priorityColors: Record<TaskPriority, string> = {
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

export default function TaskList({ refreshTrigger }: TaskListProps) {
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);

  const fetchTasks = async () => {
    try {
      const { data, error: err } = await tasks.getAll();
      if (err) {
        setError(err.message);
      } else {
        setTaskList(data || []);
      }
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [refreshTrigger]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const sortedTasks = useMemo(() => {
    const activeTasks = showCompleted
      ? taskList
      : taskList.filter((t) => !t.completed);

    return [...activeTasks].sort((a, b) => {
      const aCreated = new Date(a.created_at).getTime();
      const bCreated = new Date(b.created_at).getTime();
      const aDays = (Date.now() - aCreated) / (1000 * 60 * 60 * 24);
      const bDays = (Date.now() - bCreated) / (1000 * 60 * 60 * 24);

      const aScore = (6 - a.priority) * 100 + aDays;
      const bScore = (6 - b.priority) * 100 + bDays;

      return aScore - bScore;
    });
  }, [taskList, showCompleted]);

  const handleDelete = (id: string) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error: err } = await tasks.delete(id);
          if (!err) {
            fetchTasks();
          }
        },
      },
    ]);
  };

  const handleToggleComplete = async (task: Task) => {
    await tasks.toggleComplete(task.id, !task.completed);
    fetchTasks();
  };

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Loading tasks...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (sortedTasks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No tasks yet</Text>
        <Text style={styles.emptySubtext}>Add your first task above to get started!</Text>
      </View>
    );
  }

  const completedCount = taskList.filter((t) => t.completed).length;
  const pendingCount = taskList.filter((t) => !t.completed).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Tasks</Text>
        <TouchableOpacity onPress={() => setShowCompleted(!showCompleted)}>
          <Text style={styles.filterText}>
            {showCompleted ? 'Hide' : 'Show'} completed
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <Text style={styles.statText}>
          <Text style={styles.pendingText}>{pendingCount}</Text> pending
        </Text>
        <Text style={styles.statText}>
          <Text style={styles.completedText}>{completedCount}</Text> completed
        </Text>
      </View>

      <View style={styles.algorithm}>
        <Text style={styles.algorithmText}>
          Sorted by priority + age (top = do first)
        </Text>
      </View>

      {sortedTasks.map((task, index) => (
        <TouchableOpacity
          key={task.id}
          style={styles.taskCard}
          onLongPress={() => handleDelete(task.id)}
        >
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => handleToggleComplete(task)}
          >
            <View
              style={[
                styles.checkboxInner,
                task.completed && styles.checkboxChecked,
              ]}
            >
              {task.completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>

          <View style={styles.taskContent}>
            <Text
              style={[
                styles.taskTitle,
                task.completed && styles.taskTitleCompleted,
              ]}
              numberOfLines={2}
            >
              {task.title}
            </Text>
            {task.description && (
              <Text style={styles.taskDescription} numberOfLines={1}>
                {task.description}
              </Text>
            )}
          </View>

          <View style={styles.priorityBadge}>
            <Text
              style={[
                styles.priorityText,
                { color: priorityColors[task.priority] },
              ]}
            >
              P{task.priority}
            </Text>
          </View>

          {index === 0 && (
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  filterText: {
    fontSize: 14,
    color: '#2563eb',
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  pendingText: {
    color: '#16a34a',
    fontWeight: '600',
  },
  completedText: {
    color: '#666',
    fontWeight: '600',
  },
  algorithm: {
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  algorithmText: {
    fontSize: 12,
    color: '#92400e',
    textAlign: 'center',
  },
  emptyContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
  },
  taskCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rankBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400e',
  },
});
