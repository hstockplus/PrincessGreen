# 青蛙公主

双主角反转叙事的 2D 角色扮演游戏（MVP）。使用 Phaser 4 + Vite 构建。

## 环境要求

- Node.js 20+（推荐 22）
- 现代浏览器（Chrome、Edge、Firefox）

## 快速开始

```bash
npm install
npm run dev:open    # 在系统默认浏览器中打开（推荐）
# 或
npm run dev         # 手动打开 http://localhost:3000
```

## 测试

```bash
npm test            # 无头自动化测试
npm run test:browser # 在真实 Chrome 窗口中运行测试（非 Cursor 内嵌浏览器）
```

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（热更新） |
| `npm run build` | 生产构建到 `dist/` |
| `npm run preview` | 本地预览构建结果 |
| `npm test` | 运行 Playwright 端到端测试 |

## 操作说明

| 按键 | 勇士篇 | 公主篇 |
|------|--------|--------|
| WASD | 移动 | 移动 |
| E | 与 NPC 对话 | 交互 |
| 空格 | QTE 战斗 | 蓄力跳跃 |
| J | — | 吐舌攻击 |

## 项目结构

```
src/
├── core/       EventBus、GameState、Constants
├── scenes/     菜单、沼泽、城堡、公主场景
├── entities/   勇士、青蛙伙伴、青蛙公主
├── systems/    对话、QTE
└── ui/         好感度条、章节标题
assets/dialogues/  对话 JSON 配置
```
