# Render 部署说明

## 1. 覆盖 GitHub 文件

解压项目，将所有文件上传到 GitHub 仓库根目录并覆盖旧版本。确认根目录直接包含：

```text
index.html
app.js
styles.css
src/
package.json
package-lock.json
render.yaml
```

## 2. Render 设置

进入 Render 静态站点：

```text
Settings → Build & Deploy
```

填写：

```text
Root Directory: 留空
Build Command: npm ci --no-audit --no-fund && npm run build
Publish Directory: dist
```

环境变量可由 `render.yaml` 自动提供。手动设置时使用：

```text
NODE_VERSION=22.22.1
NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
NPM_CONFIG_REPLACE_REGISTRY_HOST=always
```

## 3. 清缓存部署

选择：

```text
Manual Deploy → Clear build cache & deploy
```

普通 Deploy 可能继续使用旧CSS和旧JavaScript缓存，因此版本大改后建议清除构建缓存。

## 4. 部署后检查

- 顶部应显示“游戏／规则教学／概率科普”三个标签。
- 手机端应显示底部标签栏。
- 游戏页应有“下注台／下注单／数据”三个分段按钮。
- 规则页应能切换四个教学步骤。
- 语言切换应同步更新三个页面。

## v7 额外检查

- 语言菜单应显示 `🇨🇳 中文 / 🇬🇧 English / 🇫🇷 Français`。
- 规则页应出现“这次的球不是预设轨迹”物理说明。
- 3D 模式中，下注约在发球后 9 秒关闭，通常在 12–18 秒之间开奖。
- 若设备无法启用 WebGL，轮盘区域会自动显示 2D 回退；这是预期行为，不是部署失败。

## v8 额外检查

- 3D 模式中可拖动调整视角，并使用滚轮、触控板或双指缩放。
- 点击轮盘右上角的复位按钮，应恢复默认镜头。
- 点击“本局后暂停”，开奖完成后应出现暂停页面。
- 暂停页面应包含继续、重置模拟、恢复视角、音效、环境声与总音量。
- 浏览器首次点击后，若环境声已开启，应播放本地合成的低音量赌场氛围。
- README 应先显示完整中文说明，分隔线后显示完整英文说明。
