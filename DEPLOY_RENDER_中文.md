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
