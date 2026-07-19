export const GAME = {
  WIDTH: 1280,
  HEIGHT: 720,
  GRAVITY: 800,
};

export const COLORS = {
  BG_DARK: 0x0c1014,
  INK: 0x1a1f1a,
  INK_GREEN: 0x1e2a22,
  SWAMP: 0x142018,
  SWAMP_FOG: 0x4a3060,
  GOLD: 0xc9a227,
  GOLD_LIGHT: 0xffd878,
  BLOOD: 0x8b2020,
  UI_BG: 0x0a0a0c,
  UI_TEXT: '#f0e6d0',
  UI_MUTED: '#a89878',
  WARRIOR: 0x6a6a6a,
  WARRIOR_HAT: 0x3a3a3a,
  PRINCESS: 0xb02030,
  PRINCESS_FROG: 0x2d8a4e,
  DRAGON: 0x2a4a3a,
  FROG: 0x3cb371,
  CROWN: 0xffd700,
  LINGZHI: 0x4a2060,
  FIRE: 0xff5520,
  PLATFORM: 0x2a3228,
};

export const PLAYER = {
  WIDTH: 36,
  HEIGHT: 56,
  SPEED: 260,
  JUMP: -420,
  MAX_JUMPS: 2,
  MAX_HP: 100,
  ATTACK_DAMAGE: 12,
  ATTACK_COOLDOWN: 350,
  INVULN_MS: 800,
};

export const DRAGON = {
  WIDTH: 160,
  HEIGHT: 48,
  MAX_HP: 100,
  SPEED: 80,
  FIRE_COOLDOWN: 1800,
  CONTACT_DAMAGE: 15,
  FIRE_DAMAGE: 18,
};

export const CHASE = {
  SCROLL_SPEED: 180,
  PRINCESS_SPEED: 200,
  CATCH_DAMAGE: 20,
  DASH_DISTANCE: 220,
  DASH_COOLDOWN: 3000,
  DASH_INVULN: 500,
};

export const ITEM = {
  LINGZHI_HEAL: 0.3,
  BAG_MAX: 5,
};

export const FONT = {
  FAMILY: '"STKaiti", "KaiTi", "SimKai", "Microsoft YaHei", serif',
};
