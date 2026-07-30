/**
 * Floating WhatsApp button — bottom-right on the main dashboard. Opens WhatsApp
 * in a new tab. Set `href` to a wa.me link with a number to open a specific
 * chat, e.g. https://wa.me/919876543210 (country code, no +, no spaces).
 */
const WHATSAPP_URL = "https://web.whatsapp.com/";

export function WhatsAppFab({ href = WHATSAPP_URL }: { href?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Open WhatsApp"
      title="Open WhatsApp"
      className="group fixed bottom-6 right-6 z-[120] inline-flex size-14 items-center justify-center rounded-full text-white shadow-[0_12px_30px_-8px_rgba(37,211,102,0.7)] transition-transform hover:-translate-y-0.5 hover:scale-105 active:scale-95 max-md:bottom-5 max-md:right-5 max-md:size-12"
      style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
    >
      <span aria-hidden className="absolute inset-0 rounded-full ring-1 ring-white/40" />
      <svg viewBox="0 0 32 32" className="relative size-7 max-md:size-6" fill="currentColor" aria-hidden>
        <path d="M16.004 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.257.593 4.46 1.72 6.402L3.2 28.8l6.55-1.712a12.74 12.74 0 0 0 6.254 1.632h.005c7.06 0 12.8-5.74 12.8-12.8 0-3.42-1.332-6.635-3.75-9.053A12.72 12.72 0 0 0 16.004 3.2zm0 23.04h-.004a10.6 10.6 0 0 1-5.4-1.48l-.387-.23-4.006 1.05 1.07-3.905-.252-.4a10.56 10.56 0 0 1-1.62-5.64c0-5.86 4.77-10.63 10.63-10.63 2.84 0 5.51 1.107 7.52 3.117a10.56 10.56 0 0 1 3.113 7.52c0 5.86-4.77 10.628-10.63 10.628zm5.83-7.96c-.32-.16-1.89-.933-2.183-1.04-.293-.107-.507-.16-.72.16-.213.32-.826 1.04-1.013 1.253-.187.213-.373.24-.693.08-.32-.16-1.35-.498-2.57-1.587-.95-.847-1.59-1.893-1.777-2.213-.187-.32-.02-.493.14-.653.144-.143.32-.373.48-.56.16-.187.213-.32.32-.533.107-.213.053-.4-.027-.56-.08-.16-.72-1.733-.986-2.373-.26-.623-.524-.539-.72-.549l-.613-.011c-.213 0-.56.08-.853.4-.293.32-1.12 1.093-1.12 2.667 0 1.573 1.146 3.093 1.306 3.307.16.213 2.253 3.44 5.46 4.824.763.33 1.358.527 1.822.674.766.244 1.463.21 2.014.127.614-.092 1.89-.773 2.157-1.52.267-.746.267-1.386.187-1.52-.08-.133-.293-.213-.613-.373z" />
      </svg>
    </a>
  );
}
