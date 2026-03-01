// Mock Supabase client for local testing when real Supabase is unavailable
export type User = {
  id: string;
  email: string;
  created_at: string;
};

export type TaskPriority = 1 | 2 | 3 | 4 | 5;

export type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  completed: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type TaskInput = {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  completed?: boolean;
};

export type TaskUpdate = {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  completed?: boolean;
};

// In-memory storage for mock data
let currentUser: User | null = null;
let mockTasksStore: Task[] = [];
let authListeners: Array<(event: string, session: unknown) => void> = [];

export const supabase = {
  auth: {
    async signUp({ email, password }: { email: string; password: string }) {
      const users = JSON.parse(localStorage.getItem('mock_users') || '{}');
      if (users[email]) {
        return { 
          data: null, 
          error: new Error('User already exists') 
        };
      }
      
      const userId = Math.random().toString(36).substr(2, 9);
      const newUser: User = {
        id: userId,
        email,
        created_at: new Date().toISOString(),
      };
      
      users[email] = { ...newUser, password };
      localStorage.setItem('mock_users', JSON.stringify(users));
      localStorage.setItem('mock_current_user', JSON.stringify(newUser));
      localStorage.setItem('mock_session', JSON.stringify({ user: newUser }));
      
      currentUser = newUser;
      notifyAuthListeners('SIGNED_IN', { user: newUser });
      
      return { data: { user: newUser, session: { user: newUser } }, error: null };
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const users = JSON.parse(localStorage.getItem('mock_users') || '{}');
      const user = users[email];
      
      if (!user || user.password !== password) {
        return { 
          data: null, 
          error: new Error('Invalid email or password') 
        };
      }
      
      const { password: _, ...userWithoutPassword } = user;
      localStorage.setItem('mock_current_user', JSON.stringify(userWithoutPassword));
      localStorage.setItem('mock_session', JSON.stringify({ user: userWithoutPassword }));
      
      currentUser = userWithoutPassword;
      notifyAuthListeners('SIGNED_IN', { user: userWithoutPassword });
      
      return { 
        data: { 
          user: userWithoutPassword, 
          session: { user: userWithoutPassword } 
        }, 
        error: null 
      };
    },

    async signInWithOAuth({ provider }: any) {
      return {
        data: null,
        error: new Error(`OAuth with ${provider} requires Supabase project`)
      };
    },

    async signOut() {
      localStorage.removeItem('mock_current_user');
      localStorage.removeItem('mock_session');
      currentUser = null;
      notifyAuthListeners('SIGNED_OUT', null);
      return { error: null };
    },

    async getSession() {
      const session = localStorage.getItem('mock_session');
      if (session) {
        const parsed = JSON.parse(session);
        currentUser = parsed.user;
        return { data: { session: parsed }, error: null };
      }
      return { data: { session: null }, error: null };
    },

    async getUser() {
      const user = localStorage.getItem('mock_current_user');
      if (user) {
        const parsed = JSON.parse(user);
        currentUser = parsed;
        return { data: { user: parsed }, error: null };
      }
      return { data: { user: null }, error: null };
    },

    onAuthStateChange(callback: (event: string, session: unknown) => void) {
      authListeners.push(callback);
      
      const session = localStorage.getItem('mock_session');
      if (session) {
        const parsed = JSON.parse(session);
        callback('RESTORED', parsed);
      }
      
      return {
        data: { subscription: { unsubscribe: () => {} } },
        unsubscribe: () => {
          authListeners = authListeners.filter(listener => listener !== callback);
        }
      };
    }
  },

  from: (table: string) => ({
    insert: (data: any) => ({
      select: () => ({
        single: async () => {
          const newTask: Task = {
            id: Math.random().toString(36).substr(2, 9),
            title: data.title || '',
            description: data.description || null,
            priority: data.priority || 3,
            completed: data.completed || false,
            user_id: currentUser?.id || 'guest',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          mockTasksStore.push(newTask);
          localStorage.setItem('mock_tasks', JSON.stringify(mockTasksStore));
          return { data: newTask, error: null };
        }
      })
    }),

    select: () => ({
      order: () => ({
        async: async () => {
          const sorted = [...mockTasksStore].sort((a, b) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
          return { data: sorted, error: null };
        }
      })
    }),

    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        select: () => ({
          single: async () => {
            const idx = mockTasksStore.findIndex(t => t.id === value);
            if (idx >= 0) {
              mockTasksStore[idx] = {
                ...mockTasksStore[idx],
                ...data,
                updated_at: new Date().toISOString(),
              };
              localStorage.setItem('mock_tasks', JSON.stringify(mockTasksStore));
              return { data: mockTasksStore[idx], error: null };
            }
            return { data: null, error: new Error('Not found') };
          }
        })
      })
    }),

    delete: () => ({
      eq: (column: string, value: any) => {
        mockTasksStore = mockTasksStore.filter(t => t.id !== value);
        localStorage.setItem('mock_tasks', JSON.stringify(mockTasksStore));
        return { error: null };
      }
    })
  })
};

function notifyAuthListeners(event: string, session: unknown) {
  authListeners.forEach(listener => listener(event, session));
}

// Initialize tasks from localStorage
const storedTasks = localStorage.getItem('mock_tasks');
if (storedTasks) {
  mockTasksStore = JSON.parse(storedTasks);
}

export const auth = {
  async signUp(email: string, password: string) {
    return supabase.auth.signUp({ email, password });
  },

  async signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  },

  async signInWithGoogle() {
    return {
      data: null,
      error: new Error('Google OAuth requires Supabase project')
    };
  },

  async signOut() {
    return supabase.auth.signOut();
  },

  async getSession() {
    return supabase.auth.getSession();
  },

  async getUser() {
    return supabase.auth.getUser();
  },

  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

export const tasks = {
  async create(taskInput: TaskInput) {
    if (!currentUser) {
      return { data: null, error: new Error('Not authenticated') };
    }

    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: taskInput.title,
      description: taskInput.description || null,
      priority: taskInput.priority || 3,
      completed: taskInput.completed || false,
      user_id: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockTasksStore.push(newTask);
    localStorage.setItem('mock_tasks', JSON.stringify(mockTasksStore));
    return { data: newTask, error: null };
  },

  async getAll() {
    const sorted = [...mockTasksStore].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return { data: sorted, error: null };
  },

  async update(id: string, taskUpdate: TaskUpdate) {
    const idx = mockTasksStore.findIndex(t => t.id === id);
    if (idx >= 0) {
      mockTasksStore[idx] = {
        ...mockTasksStore[idx],
        ...taskUpdate,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem('mock_tasks', JSON.stringify(mockTasksStore));
      return { data: mockTasksStore[idx], error: null };
    }
    return { data: null, error: new Error('Task not found') };
  },

  async delete(id: string) {
    mockTasksStore = mockTasksStore.filter(t => t.id !== id);
    localStorage.setItem('mock_tasks', JSON.stringify(mockTasksStore));
    return { error: null };
  },

  async toggleComplete(id: string, completed: boolean) {
    const idx = mockTasksStore.findIndex(t => t.id === id);
    if (idx >= 0) {
      mockTasksStore[idx] = {
        ...mockTasksStore[idx],
        completed,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem('mock_tasks', JSON.stringify(mockTasksStore));
      return { data: mockTasksStore[idx], error: null };
    }
    return { data: null, error: new Error('Task not found') };
  },
};
