const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface LeadEmailPayload {
  carTitle?: string;
  status?: string;
  totalRub?: number | null;
  reason?: string | null;
  contactName?: string | null;
  contactPhone?: string;
  vin?: string | null;
  source?: string;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatRub(value: number | null | undefined): string {
  return typeof value === 'number' ? `${Math.round(value).toLocaleString('ru-RU')} ₽` : '—';
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    return Response.json({ error: 'RESEND_API_KEY is not configured' }, { status: 500, headers: corsHeaders });
  }

  let payload: LeadEmailPayload;
  try {
    payload = await request.json() as LeadEmailPayload;
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: corsHeaders });
  }

  if (!payload.contactPhone?.trim() || !payload.carTitle?.trim()) {
    return Response.json({ error: 'carTitle and contactPhone are required' }, { status: 400, headers: corsHeaders });
  }

  if (!/^\+7\s?\(?9\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/.test(payload.contactPhone.trim())) {
    return Response.json({ error: 'contactPhone must be a valid Russian mobile number in +7 format' }, { status: 400, headers: corsHeaders });
  }

  const name = payload.contactName?.trim() || 'Не указано';
  const phone = payload.contactPhone.trim();
  const carTitle = payload.carTitle.trim();
  const vin = payload.vin?.trim() || 'Не указан';
  const subject = `Новая заявка BINHAI AUTO: ${carTitle}`;
  const html = `
    <h2>Новая заявка BINHAI AUTO</h2>
    <table cellpadding="8" cellspacing="0" border="0">
      <tr><td><b>Автомобиль</b></td><td>${escapeHtml(carTitle)}</td></tr>
      <tr><td><b>Имя</b></td><td>${escapeHtml(name)}</td></tr>
      <tr><td><b>Телефон</b></td><td>${escapeHtml(phone)}</td></tr>
      <tr><td><b>VIN</b></td><td>${escapeHtml(vin)}</td></tr>
      <tr><td><b>Статус расчёта</b></td><td>${escapeHtml(payload.status || 'manual_review')}</td></tr>
      <tr><td><b>Итого</b></td><td>${escapeHtml(formatRub(payload.totalRub))}</td></tr>
      <tr><td><b>Комментарий</b></td><td>${escapeHtml(payload.reason || '—')}</td></tr>
      <tr><td><b>Источник</b></td><td>${escapeHtml(payload.source || 'web')}</td></tr>
    </table>
    <p>Заявка также сохранена в админ-панели Supabase.</p>
  `;

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'BINHAI AUTO <onboarding@resend.dev>',
      to: ['binhaiexport@gmail.com'],
      subject,
      html,
    }),
  });

  if (!resendResponse.ok) {
    const details = await resendResponse.text();
    console.error('Resend error:', details);
    return Response.json({ error: 'Email provider rejected the message' }, { status: 502, headers: corsHeaders });
  }

  const result = await resendResponse.json();
  return Response.json({ ok: true, id: result.id }, { headers: corsHeaders });
});
