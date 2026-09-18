import { supabase } from '../lib/supabaseClient';

export interface SiteContacts {
  telegram: string;
  whatsapp: string;
  wechat: string;
  email: string;
  address: string;
}

export const DEFAULT_CONTACTS: SiteContacts = {
  telegram: 'https://t.me/binhai_bot',
  whatsapp: '+86 158 4019 9999',
  wechat: '13766611716',
  email: '576909777@qq.com',
  address: 'Уссурийск · Приморский край',
};

export async function loadContacts(): Promise<SiteContacts> {
  if (!supabase) return DEFAULT_CONTACTS;
  const { data, error } = await supabase.from('site_settings').select('contacts').eq('id', 'main').maybeSingle();
  if (error || !data?.contacts) return DEFAULT_CONTACTS;
  return { ...DEFAULT_CONTACTS, ...(data.contacts as Partial<SiteContacts>) };
}

export async function saveContacts(contacts: SiteContacts): Promise<string | null> {
  if (!supabase) return 'Supabase не настроен';
  const { error } = await supabase.from('site_settings').upsert({ id: 'main', contacts, updated_at: new Date().toISOString() });
  return error?.message ?? null;
}

export function whatsappUrl(phone: string): string {
  return `https://wa.me/${phone.replace(/[^\d]/g, '')}`;
}
