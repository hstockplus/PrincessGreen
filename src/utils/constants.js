export const GAME = {
  WIDTH: 1280,
  HEIGHT: 720,
  GRAVITY: 0, // ARPG 平面，无重力
};

/** ARPG 无重力平面；密道逃亡也不用平台跳跃 */
export const WORLD = {
  WALK_Y_MIN: 0.42,
  WALK_Y_MAX: 0.88,
};

export const COLORS = {
  BG_DARK: 0x0c1014,
  INK: 0x1a1f1a,
  GOLD: 0xc9a227,
  GOLD_LIGHT: 0xffd878,
  BLOOD: 0x8b2020,
  MP: 0x2a6aaa,
  UI_BG: 0x0a0a0c,
  UI_TEXT: '#f0e6d0',
  UI_MUTED: '#a89878',
  WARRIOR: 0x6a6a6a,
  PRINCESS: 0xb02030,
  DRAGON: 0x2a4a3a,
  FROG: 0x3cb371,
  BUG: 0x5a3060,
  LINGZHI: 0x4a2060,
  BLADE_QI: 0xffe08a,
  SWAMP_FOG: 0x4a6050,
};

export const PLAYER = {
  SPEED: 240,
  MAX_HP: 100,
  MAX_MP: 100,
  MP_REGEN: 8, // per second
  ATTACK_DAMAGE: 14,
  ATTACK_COOLDOWN: 400,
  ATTACK_RANGE_W: 70,
  ATTACK_RANGE_H: 50,
  ATTACK_DURATION: 120,
  QI_COST: 30,
  QI_DAMAGE: 28,
  QI_SPEED: 500,
  QI_RANGE: 400,
  QI_COOLDOWN: 2000,
  QI_RADIUS: 18,
  INVULN_MS: 600,
  HEAL_RATIO: 0.3,
  BAG_MAX: 5,
};

export const ITEM = {
  BAG_MAX: 5,
};

export const BUG = {
  HP: 30,
  SPEED: 90,
  DAMAGE: 8,
  ATTACK_CD: 1200,
};

/** 沼泽小怪种类 — 攻击方式各不相同 */
export const ENEMIES = {
  bug: {
    NAME: '沼泽毒虫',
    TEXTURE: 'enemy_bug',
    TINT: 0xffffff,
    BAR: 0xaa3333,
    HP: 28,
    SPEED: 95,
    DAMAGE: 8,
    ATTACK_CD: 1100,
    AGGRO: 230,
    HEIGHT: 34,
  },
  spitter: {
    NAME: '沼蛊',
    TEXTURE: 'enemy_spitter',
    TINT: 0xe8c0ff,
    BAR: 0x8844aa,
    HP: 24,
    SPEED: 80,
    DAMAGE: 10,
    ATTACK_CD: 1600,
    AGGRO: 320,
    KEEP_MIN: 140,
    KEEP_MAX: 240,
    SHOT_SPEED: 260,
    HEIGHT: 38,
  },
  charger: {
    NAME: '蛮鳄',
    TEXTURE: 'enemy_charger',
    TINT: 0xffddaa,
    BAR: 0xcc6622,
    HP: 40,
    SPEED: 70,
    DAMAGE: 14,
    ATTACK_CD: 2400,
    AGGRO: 280,
    CHARGE_SPEED: 380,
    HEIGHT: 42,
  },
  slammer: {
    NAME: '石蟹',
    TEXTURE: 'enemy_slammer',
    TINT: 0xc8c8d8,
    BAR: 0x6688aa,
    HP: 50,
    SPEED: 55,
    DAMAGE: 16,
    ATTACK_CD: 2200,
    AGGRO: 200,
    SLAM_RANGE: 70,
    HEIGHT: 44,
  },
};

export const DRAGON = {
  HP: 180,
  MAX_HP: 180,
  SPEED: 70,
  CLAW_DAMAGE: 16,
  FIRE_DAMAGE: 20,
  CLAW_CD: 1400,
  FIRE_CD: 2200,
  FIRE_CD_RAGE: 1200,
  FIREBALL_CD: 2200,
  FIREBALL_CD_RAGE: 1200,
  FIREBALL_SPEED: 280,
};

export const CHASE = {
  SCROLL_SPEED: 160,
  PRINCESS_SPEED: 190,
  CATCH_DAMAGE: 18,
  DASH_DISTANCE: 240,
  DASH_COOLDOWN: 3000,
  DASH_INVULN: 1000,
};

/** 角色显示高度（像素）— 统一比例，避免忽大忽小 */
export const ACTOR = {
  WARRIOR_H: 168,
  PRINCESS_H: 168,
  DRAGON_H: 200,
  FROG_H: 70,
  FROG_BEAST_H: 188,
  BUG_H: 36,
  /** 当前勇士立绘实际朝左；前进(右)时需要 flipX */
  FACE_RIGHT: false,
};

export const FONT = {
  FAMILY: '"STKaiti", "KaiTi", "SimKai", "Microsoft YaHei", serif',
};
