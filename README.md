# Roulette Lab v5

一个用于讲解轮盘规则、赌场优势和负数学期望的多语言3D网页。项目不连接真钱、账户或支付系统，所有模拟均在浏览器本地运行。

## v5 重点

- Liquid Glass-inspired 应用式界面
- 游戏、规则教学、概率科普三个独立页面
- 桌面端顶部标签栏、移动端底部标签栏
- 游戏页分为下注台、下注单、数据三个紧凑面板
- 四步规则教学与赔率速查表
- 连续文章式概率科普，减少“AI卡片墙”观感
- 中英法切换
- Three.js 3D自动轮盘和2D回退
- 多注、撤销、清空、重复下注、批量模拟

## 本地运行

需要 Node.js 22：

```bash
npm ci --no-audit --no-fund
npm run dev
```

生产构建：

```bash
npm run build
```

输出目录为 `dist/`。

## Render

静态站点设置：

```text
Build Command: npm ci --no-audit --no-fund && npm run build
Publish Directory: dist
```

仓库中的 `render.yaml` 已固定 Node 22.22.1，并使用公共 npm registry。

## 设计说明

该网页参考 Apple 对 Liquid Glass、层级、和谐与一致性的公开设计指导，但不是 Apple 产品、官方模板或系统组件的复制品。毛玻璃主要用于导航与操作层，正文和游戏内容保持清晰、稳定和高对比度。

## 技术栈

- Three.js
- Vite
- 原生 HTML / CSS / JavaScript
- Web Crypto API

## 免责声明

项目仅用于概率教育。短期获胜不代表存在可持续盈利策略。赌博可能造成财务与心理伤害。
