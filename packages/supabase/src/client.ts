import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const createSupabaseClient = (): SupabaseClient => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (web) or EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (mobile)');
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
};

export const supabase = createSupabaseClient();

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
        redirectTo: `${window.location.origin}/api/auth/callback`,
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
