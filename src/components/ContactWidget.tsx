import { useState } from 'react';

const TELEGRAM_URL = 'https://t.me/binhai_bot';
const WHATSAPP_URL = 'https://wa.me/8615840199999';
const WECHAT_ID = '13766611716';

export default function ContactWidget() {
  const [open, setOpen] = useState(false);
  const [showWeChat, setShowWeChat] = useState(false);
  return <>
    <div className="contact-fab-wrap" style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 15, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
      {open && <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
        <a href={TELEGRAM_URL} target="_blank" rel="noreferrer" style={{ background: '#229ED9', color: 'white', borderRadius: 999, padding: '10px 16px', fontWeight: 700, fontSize: 13 }}>Telegram ↗</a>
        <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" style={{ background: '#25D366', color: 'white', borderRadius: 999, padding: '10px 16px', fontWeight: 700, fontSize: 13 }}>WhatsApp ↗</a>
        <button onClick={() => setShowWeChat(true)} style={{ border: 0, background: '#07C160', color: 'white', borderRadius: 999, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}>WeChat</button>
      </div>}
      <button className="contact-fab" onClick={() => setOpen((value) => !value)} aria-label="Связаться с нами">{open ? '× Закрыть' : 'Связаться ↗'}</button>
    </div>
    {showWeChat && <div className="modal-backdrop" onClick={() => setShowWeChat(false)}><div className="modal" style={{ width: 360, padding: 28, textAlign: 'center' }} onClick={(event) => event.stopPropagation()}><h3 style={{ marginTop: 0 }}>Мы в WeChat</h3><p style={{ color: '#65727c' }}>Добавьте нас по ID или отсканируйте QR-код.</p><img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${WECHAT_ID}`} alt="WeChat QR" width="180" height="180" style={{ margin: '20px auto' }} /><strong>{WECHAT_ID}</strong><br /><button className="button-secondary" style={{ marginTop: 18 }} onClick={() => setShowWeChat(false)}>Закрыть</button></div></div>}
  </>;
}
