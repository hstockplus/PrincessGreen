import { unlockAudio } from '../systems/SimpleSFX.js';

const GESTURE_KEY = 'pg_user_gesture';

function isLandscape() {
  return window.innerWidth >= window.innerHeight;
}

function getFullscreenElement() {
  return document.fullscreenElement
    || document.webkitFullscreenElement
    || document.mozFullScreenElement
    || document.webkitCurrentFullScreenElement
    || null;
}

function requestOnElement(el) {
  if (!el) return Promise.reject(new Error('no element'));
  const fn = el.requestFullscreen
    || el.webkitRequestFullscreen
    || el.webkitRequestFullScreen
    || el.mozRequestFullScreen
    || el.msRequestFullscreen;
  if (!fn) return Promise.reject(new Error('fullscreen unsupported'));
  try {
    const result = fn.call(el, { navigationUI: 'hide' });
    return Promise.resolve(result);
  } catch {
    return Promise.resolve(fn.call(el));
  }
}

async function requestFullscreen() {
  const targets = [
    document.getElementById('game-container'),
    document.querySelector('canvas'),
    document.documentElement,
    document.body,
  ].filter(Boolean);

  for (const el of targets) {
    try {
      await requestOnElement(el);
      if (getFullscreenElement()) return true;
    } catch {
      /* try next target */
    }
  }
  return !!getFullscreenElement();
}

function exitFullscreen() {
  const fn = document.exitFullscreen
    || document.webkitExitFullscreen
    || document.webkitCancelFullScreen
    || document.mozCancelFullScreen
    || document.msExitFullscreen;
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

function applyImmersiveCss() {
  document.documentElement.classList.add('immersive-mode');
  try {
    window.scrollTo(0, 1);
  } catch {
    /* ignore */
  }
}

function clearImmersiveCss() {
  document.documentElement.classList.remove('immersive-mode');
}

function lockLandscape() {
  try {
    screen.orientation?.lock?.('landscape-primary').catch(() => {});
  } catch {
    /* ignore */
  }
}

export function syncOrientationFullscreen() {
  if (isLandscape()) {
    applyImmersiveCss();
    if (hasUserGesture() && !getFullscreenElement()) {
      requestFullscreen().then((ok) => {
        if (ok) lockLandscape();
      });
    }
  } else {
    clearImmersiveCss();
    exitFullscreen();
    try {
      screen.orientation?.unlock?.();
    } catch {
      /* ignore */
    }
  }
}

export function enterGameMode() {
  markUserGesture();
  unlockAudio();
  applyImmersiveCss();
  return requestFullscreen().then((ok) => {
    if (ok) lockLandscape();
    syncOrientationFullscreen();
    return ok;
  });
}

export function initOrientationFullscreen() {
  const onGesture = () => {
    enterGameMode();
  };

  const events = ['pointerdown', 'touchstart', 'click', 'keydown'];
  events.forEach((evt) => {
    window.addEventListener(evt, onGesture, { passive: true, capture: true });
  });

  window.addEventListener('orientationchange', () => {
    setTimeout(syncOrientationFullscreen, 200);
  });
  window.addEventListener('resize', () => {
    if (isLandscape()) applyImmersiveCss();
  });

  if (isLandscape()) applyImmersiveCss();
  syncOrientationFullscreen();

  if (hasUserGesture()) {
    enterGameMode();
  }
}
