import { SiteContacts } from '../data/siteSettings';
import { supabase } from './supabaseClient';

export async function saveContacts(contacts: SiteContacts): Promise<string | null> {
  if (!supabase) return 'Supabase не настроен';

  const { error } = await supabase
    .from('site_settings')
    .upsert({ id: 'main', contacts, updated_at: new Date().toISOString() });

  return error?.message ?? null;
}
