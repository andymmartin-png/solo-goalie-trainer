import { useState, useEffect } from 'react';

const DISMISS_KEY = 'sgt-install-dismissed';

function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

function isIos() {
  const ua = window.navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua)
    || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1); // iPadOS reports as Mac
}

export default function InstallPrompt() {
  const [deferred, setDeferred]   = useState(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === 'true');

  useEffect(() => {
    function onPrompt(e) {
      e.preventDefault();        // stop Chrome's default mini-infobar
      setDeferred(e);            // stash it so our button can trigger it
    }
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  }

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  if (dismissed || isStandalone()) return null;

  // Android / desktop Chrome: a real install prompt is available.
  if (deferred) {
    return (
      <div className="install-banner">
        <span className="install-text">📲 Install for full-screen, offline use</span>
        <div className="install-actions">
          <button className="install-btn" onClick={install}>Install</button>
          <button className="install-dismiss" onClick={dismiss} aria-label="Dismiss">✕</button>
        </div>
      </div>
    );
  }

  // iOS Safari: no programmatic prompt — show the manual steps.
  if (isIos()) {
    return (
      <div className="install-banner">
        <span className="install-text">
          📲 Install: tap <strong>Share</strong> then <strong>Add to Home Screen</strong>
        </span>
        <button className="install-dismiss" onClick={dismiss} aria-label="Dismiss">✕</button>
      </div>
    );
  }

  return null;
}
