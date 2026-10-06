// Build 144: minimal, no-reload bridge for Attendance · Coaches -> Drills.
// The main app already owns #rp-drills routing. This capture handler only makes
// the transition deterministic on iOS/PWA and deliberately does not reload.

document.addEventListener('click', event => {
  const button = event.target.closest?.('#next-coaches-drills');
  if (!button) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  // Preserve the current coach selections before leaving the screen. The main
  // app saves each checkbox change already; this is only a defensive flush for
  // the PWA path.
  try {
    const key = 'RebelsPrep:coach-pilot:1';
    const active = localStorage.getItem(key + ':active-team');
    if (active) {
      const storageKey = key + ':team:' + active;
      const raw = localStorage.getItem(storageKey) || localStorage.getItem(key);
      if (raw) {
        const draft = JSON.parse(raw);
        draft.steps = {...(draft.steps || {}), attendance: true};
        draft.started = true;
        draft.drillStationTarget = null;
        localStorage.setItem(storageKey, JSON.stringify(draft));
      }
    }
  } catch {}

  // Do not reload. Reloading was the source of the earlier loop back to Coaches.
  if (location.hash === '#rp-drills') {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    location.hash = 'rp-drills';
  }
}, true);
