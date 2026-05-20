import { useEffect, useState } from 'react';
import { Download, Share, Plus, X, Apple, Smartphone } from 'lucide-react';

const DISMISS_KEY = 'wvl-install-dismissed-until';
const DISMISS_DAYS = 7;

function detectPlatform() {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent || '';
  // iPadOS 13+ reports as Mac with maxTouchPoints > 1
  const isIPad =
    /iPad/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isIOS = /iPhone|iPod/.test(ua) || isIPad;
  if (isIOS) return 'ios';
  if (/Android/.test(ua)) return 'android';
  // Treat Macs (non-iPad) as "apple desktop" — same as iOS guidance for Safari
  if (/Mac OS X/.test(ua) && !/Mobile/.test(ua)) return 'mac';
  return 'other';
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true // iOS Safari flag
  );
}

function isDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const until = Number(raw);
    if (!Number.isFinite(until)) return false;
    return Date.now() < until;
  } catch {
    return false;
  }
}

function dismissFor(days) {
  try {
    localStorage.setItem(
      DISMISS_KEY,
      String(Date.now() + days * 24 * 60 * 60 * 1000),
    );
  } catch {
    /* ignore */
  }
}

export default function InstallPrompt() {
  const [platform] = useState(detectPlatform);
  const [deferredEvent, setDeferredEvent] = useState(null);
  const [visible, setVisible] = useState(false);
  const [iosModalOpen, setIosModalOpen] = useState(false);

  useEffect(() => {
    if (isStandalone()) return; // already installed
    if (isDismissed()) return;

    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredEvent(e);
      setVisible(true);
    };

    const onAppInstalled = () => {
      setVisible(false);
      setDeferredEvent(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    // On iOS / Safari there is no beforeinstallprompt; show our banner
    // after a small delay so it doesn't appear immediately on first load.
    if (platform === 'ios' || platform === 'mac') {
      const t = setTimeout(() => setVisible(true), 1500);
      return () => {
        clearTimeout(t);
        window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
        window.removeEventListener('appinstalled', onAppInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, [platform]);

  const handleInstallClick = async () => {
    if (deferredEvent) {
      // Android / Chrome native prompt
      deferredEvent.prompt();
      const { outcome } = await deferredEvent.userChoice;
      if (outcome === 'accepted' || outcome === 'dismissed') {
        setDeferredEvent(null);
        setVisible(false);
        if (outcome === 'dismissed') dismissFor(DISMISS_DAYS);
      }
    } else if (platform === 'ios' || platform === 'mac') {
      // No automatic install prompt on iOS — show instructions modal
      setIosModalOpen(true);
    }
  };

  const handleDismiss = () => {
    dismissFor(DISMISS_DAYS);
    setVisible(false);
  };

  if (!visible) return null;
  if (isStandalone()) return null;

  const labelByPlatform = {
    android: 'Instal·la l\'app',
    ios: 'Afegeix a la pantalla d\'inici',
    mac: 'Afegeix a la pantalla d\'inici',
    other: 'Instal·la l\'app',
  };

  const IconByPlatform = {
    android: Smartphone,
    ios: Apple,
    mac: Apple,
    other: Download,
  };
  const Icon = IconByPlatform[platform] || Download;

  return (
    <>
      <div className="install-banner">
        <Icon size={22} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
            Wavelength com a app
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
            {platform === 'ios' || platform === 'mac'
              ? "Afegeix-la a la pantalla d'inici amb un toc"
              : 'Instal·la-la al teu mòbil i juga sense obrir el navegador'}
          </div>
        </div>
        <button className="install-banner-cta" onClick={handleInstallClick}>
          {labelByPlatform[platform]}
        </button>
        <button
          className="install-banner-close"
          onClick={handleDismiss}
          title="Tancar"
        >
          <X size={18} />
        </button>
      </div>

      {iosModalOpen && (
        <div className="install-modal-overlay" onClick={() => setIosModalOpen(false)}>
          <div className="install-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="install-modal-close"
              onClick={() => setIosModalOpen(false)}
              title="Tancar"
            >
              <X size={20} />
            </button>
            <Apple size={48} style={{ marginBottom: '0.5rem' }} />
            <h2 style={{ margin: '0 0 0.5rem' }}>
              Instal·la a {platform === 'mac' ? 'Mac' : 'iPhone / iPad'}
            </h2>
            <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: 0 }}>
              Safari no instal·la apps automàticament, però pots afegir
              Wavelength com una app a la pantalla d&apos;inici:
            </p>
            <ol className="ios-steps">
              <li>
                Obre aquesta pàgina amb <strong>Safari</strong>{' '}
                {platform === 'mac' ? '' : '(no Chrome ni Firefox)'}.
              </li>
              <li>
                Toca el botó <Share size={16} style={{ verticalAlign: 'middle' }} />{' '}
                <strong>Compartir</strong>{' '}
                {platform === 'mac' ? "a la barra d'eines" : 'a la barra inferior'}.
              </li>
              <li>
                Tria{' '}
                <Plus size={16} style={{ verticalAlign: 'middle' }} />{' '}
                <strong>«Afegeix a la pantalla d&apos;inici»</strong>{' '}
                {platform === 'mac' ? '(o «Afegir a Dock»)' : ''}.
              </li>
              <li>
                Confirma amb <strong>Afegir</strong>. L&apos;app apareixerà amb
                la seva icona pròpia.
              </li>
            </ol>
            <button onClick={() => setIosModalOpen(false)} style={{ width: '100%' }}>
              Entesos
            </button>
          </div>
        </div>
      )}
    </>
  );
}
