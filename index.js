import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://cpebkpckoqypdbqhicmw.supabase.co';
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY || 'sb_publishable_ssz6g9ZtGtPTLqk_WbMOGQ_TYipbztR';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Boletins ──────────────────────────────────────────────────────────────────
export async function fetchBoletins() {
  const { data, error } = await supabase
    .from('boletins')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(row => ({ ...row.data, id: row.id, author: row.author, date: row.date, type: row.type, createdAt: row.created_at }));
}

export async function insertBoletim(entry) {
  const { type, author, date, ...rest } = entry;
  const { data, error } = await supabase
    .from('boletins')
    .insert({ type, author, date, data: rest })
    .select()
    .single();
  if (error) throw error;
  return { ...data.data, id: data.id, author: data.author, date: data.date, type: data.type, createdAt: data.created_at };
}

// ── Feedbacks ─────────────────────────────────────────────────────────────────
export async function fetchFeedbacks() {
  const { data, error } = await supabase.from('feedbacks').select('*');
  if (error) throw error;
  return data.reduce((acc, row) => { acc[row.author] = row.feedback; return acc; }, {});
}

export async function upsertFeedback(author, feedback) {
  const { error } = await supabase
    .from('feedbacks')
    .upsert({ author, feedback, updated_at: new Date().toISOString() }, { onConflict: 'author' });
  if (error) throw error;
}

// ── Viewers ───────────────────────────────────────────────────────────────────
export async function fetchViewers() {
  const { data, error } = await supabase.from('viewers').select('*').order('id');
  if (error) throw error;
  return data;
}

export async function insertViewer(name, email) {
  const { data, error } = await supabase.from('viewers').insert({ name, email }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteViewer(id) {
  const { error } = await supabase.from('viewers').delete().eq('id', id);
  if (error) throw error;
}
