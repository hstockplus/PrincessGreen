const GESTURE_KEY = 'pg_user_gesture';

function isLandscape() {
  return window.innerWidth >= window.innerHeight;
}

function getFullscreenElement() {
  return document.fullscreenElement
    || document.webkitFullscreenElement
    || document.mozFullScreenElement
    || null;
}

function requestFullscreen() {
  const el = document.documentElement;
  const fn = el.requestFullscreen
    || el.webkitRequestFullscreen
    || el.mozRequestFullScreen;
  if (!fn) return Promise.reject(new Error('fullscreen unsupported'));
  return Promise.resolve(fn.call(el)).catch(() => {});
}

function exitFullscreen() {
  const fn = document.exitFullscreen
    || document.webkitExitFullscreen
    || document.mozCancelFullScreen;
  if (!fn || !getFullscreenElement()) return Promise.resolve();
  return Promise.resolve(fn.call(document)).catch(() => {});
}

function markUserGesture() {
  try {
    sessionStorage.setItem(GESTURE_KEY, '1');
  } catch {
    /* ignore */
  }
}

function hasUserGesture() {
  try {
    return sessionStorage.getItem(GESTURE_KEY) === '1';
  } catch {
    return false;
  }
}

export function syncOrientationFullscreen() {
  if (isLandscape()) {
    if (hasUserGesture() && !getFullscreenElement()) {
      requestFullscreen();
    }
  } else {
    exitFullscreen();
  }
}

export function initOrientationFullscreen() {
  const onGesture = () => {
    markUserGesture();
    syncOrientationFullscreen();
    window.removeEventListener('pointerdown', onGesture);
    window.removeEventListener('keydown', onGesture);
  };

  window.addEventListener('pointerdown', onGesture, { passive: true });
  window.addEventListener('keydown', onGesture);

  window.addEventListener('orientationchange', () => {
    setTimeout(syncOrientationFullscreen, 300);
  });

  syncOrientationFullscreen();
}
