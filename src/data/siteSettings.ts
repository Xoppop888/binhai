import { isPublicSupabaseConfigured, publicSupabaseFetch } from '../lib/publicSupabase';

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
  if (!isPublicSupabaseConfigured()) return DEFAULT_CONTACTS;

  try {
    const response = await publicSupabaseFetch('/site_settings?select=contacts&id=eq.main');
    if (!response.ok) return DEFAULT_CONTACTS;

    const rows = await response.json() as Array<{ contacts?: Partial<SiteContacts> }>;
    return rows[0]?.contacts ? { ...DEFAULT_CONTACTS, ...rows[0].contacts } : DEFAULT_CONTACTS;
  } catch {
    return DEFAULT_CONTACTS;
  }
}

export function whatsappUrl(phone: string): string {
  return `https://wa.me/${phone.replace(/[^\d]/g, '')}`;
}
