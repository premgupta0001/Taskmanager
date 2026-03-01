export type TaskPriority = 1 | 2 | 3 | 4 | 5;

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  completed: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface TaskInput {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  completed?: boolean;
}

export interface TaskUpdate {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  completed?: boolean;
}
