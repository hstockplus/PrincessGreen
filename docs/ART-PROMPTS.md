# 《青蛙公主》美术资产生成提示词

整体风格：暗黑水墨武侠 · 月影传说质感 · 萧瑟肃杀 · 志怪传奇 · 纯色背景便于抠图

| # | 文件 | 说明 |
|---|------|------|
| 1 | `public/assets/characters/warrior.png` | 勇士（斗笠灰披风单刀） |
| 2 | `public/assets/characters/princess.png` | 青蛙公主·人类形态 |
| 3 | `public/assets/characters/dragon.png` | 恶龙（墨绿、金锁链） |
| 4 | `public/assets/characters/frog_guardian.png` | 青蛙守护者（金冠） |
| 5 | `public/assets/characters/frog_princess_beast.png` | 复仇巨蛙形态 |
| 6 | `public/assets/backgrounds/palace.jpg` | 王宫悬赏大殿 |
| 7 | `public/assets/backgrounds/swamp.jpg` | 绝望沼泽 |
| 8 | `public/assets/backgrounds/castle.jpg` | 恶龙城堡洞穴 |
| 9 | `public/assets/backgrounds/chase.jpg` | 城堡密道 |
| 10 | `public/assets/backgrounds/ending.jpg` | 夕阳沼泽结局 |
| 11 | `public/assets/items/lingzhi.png` | 墨色灵芝 |
| 12 | `public/assets/ui/skill_dash.png` | 金蟾脱壳技能图标 |

角色/道具已做边缘泛洪抠图（去灰底）。

## 2026-07 朝向与比例修正
- 勇士 / 公主 / 青蛙公主：统一为**侧视朝右**立绘，移动时 `flipX` 左右翻转（解决「背对走路」）
- 青蛙公主巨兽形态改为**美人蛙**（红衣金冠、柔美非恐怖）
- 显示高度统一见 `ACTOR` 常量（勇士/公主 168、恶龙 200、蛙形态 188）
