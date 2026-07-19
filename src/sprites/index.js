import { renderPixelArt, renderSpriteSheet } from '../core/PixelRenderer.js';
import { DARK_PALETTE, SPRITE_SCALE } from './palette.js';
import { WARRIOR_IDLE, WARRIOR_WALK } from './player.js';
import { DRAGON, PRINCESS, FROG_PRINCESS, KING } from './enemies.js';
import { FROG, LINGZHI, PLATFORM, TOAD, TREASURE } from './items.js';
import { FIREBALL, SLASH } from './projectiles.js';

export function registerAllSprites(scene) {
  const P = DARK_PALETTE;
  const S = SPRITE_SCALE;

  renderPixelArt(scene, WARRIOR_IDLE, P, 'tex_warrior', S);
  renderSpriteSheet(scene, WARRIOR_WALK, P, 'sheet_warrior', S);
  renderPixelArt(scene, DRAGON, P, 'tex_dragon', S);
  renderPixelArt(scene, PRINCESS, P, 'tex_princess', S);
  renderPixelArt(scene, FROG_PRINCESS, P, 'tex_frog_princess', S);
  renderPixelArt(scene, KING, P, 'tex_king', S);
  renderPixelArt(scene, FROG, P, 'tex_frog', 3);
  renderPixelArt(scene, LINGZHI, P, 'tex_lingzhi', 3);
  renderPixelArt(scene, TOAD, P, 'tex_toad', 3);
  renderPixelArt(scene, TREASURE, P, 'tex_treasure', 3);
  renderPixelArt(scene, FIREBALL, P, 'tex_fireball', 3);
  renderPixelArt(scene, SLASH, P, 'tex_slash', 3);
  renderPixelArt(scene, PLATFORM, P, 'tex_platform', S);

  if (!scene.anims.exists('warrior-walk')) {
    scene.anims.create({
      key: 'warrior-walk',
      frames: [{ key: 'sheet_warrior', frame: 0 }, { key: 'sheet_warrior', frame: 1 }],
      frameRate: 8,
      repeat: -1,
    });
  }
  if (!scene.anims.exists('warrior-idle')) {
    scene.anims.create({
      key: 'warrior-idle',
      frames: [{ key: 'tex_warrior' }],
      frameRate: 1,
    });
  }
}
