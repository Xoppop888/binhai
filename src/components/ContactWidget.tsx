import { useState } from 'react';

const TELEGRAM_URL = 'https://t.me/binhai_bot';
const WHATSAPP_PHONE = '8615840199999'; // +86 158 4019 9999, только цифры
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_PHONE}`;
const WECHAT_ID = '13766611716';

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M21.9 2.6c-.3-.2-.7-.3-1.1-.2L2.4 9.4c-.6.2-1 .8-.9 1.5.1.6.5 1.1 1.1 1.2l4.9 1.4 1.9 6.1c.1.5.5.9 1 1 .1 0 .2 0 .3 0 .4 0 .8-.2 1.1-.5l2.7-2.8 4.9 3.6c.3.2.6.3.9.3.2 0 .4 0 .6-.1.5-.2.9-.7 1-1.2L22.5 3.8c.1-.5-.1-1-.6-1.2ZM8.9 12.9l8.6-6.5-6.9 8-1.7-1.5Zm.9 4.5-1-3.3 1.9 1.7-.9 1.6Zm3.1-1.2-1.5-1.1 6.8-7.9-5.3 9Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3 4.8 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.6.2-1.2.2-1.3-.1-.2-.3-.2-.6-.4Z" />
      <path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.4c1.4.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2Zm0 18.2c-1.6 0-3.1-.4-4.5-1.2l-.3-.2-3.1.8.8-3-.2-.3C4 14.8 3.5 13.4 3.5 12c0-4.7 3.8-8.5 8.5-8.5s8.5 3.8 8.5 8.5-3.8 8.5-8.5 8.5Z" />
    </svg>
  );
}

function WeChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M8.7 3C4.6 3 1.3 5.9 1.3 9.4c0 2 1.1 3.8 2.8 5l-.7 2.1 2.4-1.2c.6.2 1.2.3 1.9.3h.4c-.1-.4-.2-.8-.2-1.2 0-3.6 3.4-6.4 7.6-6.4h.4C15.4 5 12.3 3 8.7 3ZM6.3 8c-.6 0-1-.5-1-1s.4-1 1-1 1 .5 1 1-.4 1-1 1Zm5 0c-.6 0-1-.5-1-1s.4-1 1-1 1 .5 1 1-.4 1-1 1Z" />
      <path d="M16.3 9.7c-3.6 0-6.5 2.5-6.5 5.6s2.9 5.6 6.5 5.6c.7 0 1.4-.1 2-.3l2 1-.5-1.8c1.4-1 2.3-2.5 2.3-4.2 0-3.1-2.9-5.6-6.5-5.6h-.3Zm-2.1 4.6c-.5 0-.8-.4-.8-.8 0-.5.4-.8.8-.8.5 0 .8.4.8.8 0 .4-.4.8-.8.8Zm4.2 0c-.5 0-.8-.4-.8-.8 0-.5.4-.8.8-.8.5 0 .8.4.8.8 0 .4-.4.8-.8.8Z" />
    </svg>
  );
}

export default function ContactWidget() {
  const [open, setOpen] = useState(false);
  const [showWeChat, setShowWeChat] = useState(false);

  return (
    <>
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
        {open && (
          <div className="flex flex-col gap-3 mb-1">
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#229ED9] text-white pl-3 pr-4 py-2.5 rounded-full shadow-lg hover:opacity-90 transition-opacity"
            >
              <TelegramIcon />
              <span className="text-sm font-medium">Telegram</span>
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#25D366] text-white pl-3 pr-4 py-2.5 rounded-full shadow-lg hover:opacity-90 transition-opacity"
            >
              <WhatsAppIcon />
              <span className="text-sm font-medium">WhatsApp</span>
            </a>
            <button
              onClick={() => setShowWeChat(true)}
              className="flex items-center gap-2 bg-[#07C160] text-white pl-3 pr-4 py-2.5 rounded-full shadow-lg hover:opacity-90 transition-opacity"
            >
              <WeChatIcon />
              <span className="text-sm font-medium">WeChat</span>
            </button>
          </div>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-xl flex items-center justify-center hover:bg-blue-700 transition-colors"
          aria-label="Связаться с нами"
        >
          {open ? (
            <span className="text-2xl leading-none">×</span>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
            </svg>
          )}
        </button>
      </div>

      {showWeChat && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowWeChat(false)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-xs w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900 mb-1">Добавьте нас в WeChat</h3>
            <p className="text-sm text-slate-500 mb-4">Отсканируйте QR-код или добавьте по ID</p>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${WECHAT_ID}`}
              alt="WeChat QR"
              className="mx-auto mb-4 rounded-lg border border-slate-200"
              width={180}
              height={180}
            />
            <div className="flex items-center justify-center gap-2 bg-slate-100 rounded-lg py-2 px-3">
              <span className="font-mono text-slate-900">{WECHAT_ID}</span>
              <button
                onClick={() => navigator.clipboard?.writeText(WECHAT_ID)}
                className="text-xs text-blue-600 hover:underline"
              >
                Копировать
              </button>
            </div>
            <button
              onClick={() => setShowWeChat(false)}
              className="mt-4 text-sm text-slate-500 hover:text-slate-800"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
}
