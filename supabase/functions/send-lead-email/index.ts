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
  calculation?: {
    breakdown?: {
      carPriceRub?: number;
      bankCommissionRub?: number;
      customsDutyRub?: number;
      utilizationFeeRub?: number;
      declarationFeeRub?: number;
      sbktsRub?: number;
      eptsRub?: number;
      brokerFeeRub?: number;
    };
    totalRub?: number | null;
    disclaimer?: string | null;
    cnyToRub?: number | null;
    eurToRub?: number | null;
  } | null;
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

function formatRate(value: number | null | undefined): string {
  return typeof value === 'number' ? value.toLocaleString('ru-RU', { maximumFractionDigits: 4 }) : '—';
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
    return Response.json({ error: 'contactPhone must be a valid mobile number in +7 format' }, { status: 400, headers: corsHeaders });
  }

  const name = payload.contactName?.trim() || 'Не указано';
  const phone = payload.contactPhone.trim();
  const carTitle = payload.carTitle.trim();
  const vin = payload.vin?.trim() || 'Не указан';
  const calculation = payload.calculation;
  const breakdown = calculation?.breakdown;
  const subject = `Новая заявка BINHAI AUTO: ${carTitle}`;
  const html = `
    <h2>Новая заявка BINHAI AUTO</h2>
    <table cellpadding="8" cellspacing="0" border="0">
      <tr><td><b>Автомобиль</b></td><td>${escapeHtml(carTitle)}</td></tr>
      <tr><td><b>Имя</b></td><td>${escapeHtml(name)}</td></tr>
      <tr><td><b>Телефон</b></td><td>${escapeHtml(phone)}</td></tr>
      <tr><td><b>VIN</b></td><td>${escapeHtml(vin)}</td></tr>
      <tr><td><b>Статус расчёта</b></td><td>${escapeHtml(payload.status || 'manual_review')}</td></tr>
      ${calculation ? `
        <tr><td colspan="2"><b>Разбивка расчёта</b></td></tr>
        <tr><td>Курс CNY → RUB</td><td>${escapeHtml(formatRate(calculation.cnyToRub))}</td></tr>
        <tr><td>Курс EUR → RUB</td><td>${escapeHtml(formatRate(calculation.eurToRub))}</td></tr>
        <tr><td>Цена автомобиля</td><td>${escapeHtml(formatRub(breakdown?.carPriceRub))}</td></tr>
        <tr><td>Комиссия банка</td><td>${escapeHtml(formatRub(breakdown?.bankCommissionRub))}</td></tr>
        <tr><td>Таможенная пошлина</td><td>${escapeHtml(formatRub(breakdown?.customsDutyRub))}</td></tr>
        <tr><td>Утильсбор</td><td>${escapeHtml(formatRub(breakdown?.utilizationFeeRub))}</td></tr>
        <tr><td>Таможенное оформление</td><td>${escapeHtml(formatRub(breakdown?.declarationFeeRub))}</td></tr>
        <tr><td>СБКТС</td><td>${escapeHtml(formatRub(breakdown?.sbktsRub))}</td></tr>
        <tr><td>ЭПТС</td><td>${escapeHtml(formatRub(breakdown?.eptsRub))}</td></tr>
        <tr><td>Услуги брокера</td><td>${escapeHtml(formatRub(breakdown?.brokerFeeRub))}</td></tr>
        <tr><td><b>Итого</b></td><td><b>${escapeHtml(formatRub(calculation.totalRub))}</b></td></tr>
      ` : `<tr><td><b>Итого</b></td><td>${escapeHtml(formatRub(payload.totalRub))}</td></tr>`}
      <tr><td><b>Комментарий</b></td><td>${escapeHtml(payload.reason || '—')}</td></tr>
      ${calculation?.disclaimer ? `<tr><td><b>Примечание к расчёту</b></td><td>${escapeHtml(calculation.disclaimer)}</td></tr>` : ''}
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
