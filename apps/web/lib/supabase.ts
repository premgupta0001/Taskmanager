// Try to use real Supabase, fall back to mock if unavailable
let supabase: any;
let usesMock = false;

const getEnvVar = (key: string): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || '';
  }
  if (typeof window !== 'undefined' && (window as unknown as { ENV?: Record<string, string> }).ENV) {
    return (window as unknown as { ENV: Record<string, string> }).ENV[key] || '';
  }
  return '';
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || 'https://ukymolvmmrwgfjcybafg.supabase.co';
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || 'sb_publishable_hEPJQRgfJgEm935dldrnFg_LwyJO_-P';

// Try to initialize real Supabase
try {
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      flowType: 'pkce',
    },
  });
  console.log('Using real Supabase client');
} catch (err) {
  console.warn('Supabase unavailable, using mock client for local development');
  const mockModule = require('./supabase-mock');
  supabase = mockModule.supabase;
  usesMock = true;
}

export { supabase };

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

export type Session = {
  user: User;
  expires_at: number;
};

export const auth = {
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/callback`,
      },
    });
    return { data, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

export const tasks = {
  async create(taskInput: TaskInput) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('Not authenticated') };
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: taskInput.title,
        description: taskInput.description || null,
        priority: taskInput.priority || 3,
        completed: taskInput.completed || false,
        user_id: user.id,
      })
      .select()
      .single();

    return { data, error };
  },

  async getAll() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    return { data: data as Task[] | null, error };
  },

  async update(id: string, taskUpdate: TaskUpdate) {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...taskUpdate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    return { error };
  },

  async toggleComplete(id: string, completed: boolean) {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        completed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },
};
