# Roulette Lab 3D v4：Render 部署说明

本版使用 Three.js、Vite 和固定 Node 22 LTS。仓库中的 `package-lock.json` 已改为公共 npm registry，不再包含内部镜像地址。

## 推荐：覆盖 GitHub 仓库后清缓存部署

把压缩包内的文件上传并覆盖到 GitHub 仓库根目录。不要上传 `node_modules/`；`dist/` 可不上传。

Render 的 Static Site 设置：

```text
Root Directory: 留空
Build Command: npm ci --no-audit --no-fund && npm run build
Publish Directory: dist
Branch: main
```

环境变量：

```text
NODE_VERSION=22.22.1
NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
NPM_CONFIG_REPLACE_REGISTRY_HOST=always
```

如果使用仓库内的 `render.yaml` 创建 Blueprint，上述设置会自动写入。

上传后执行：

```text
Manual Deploy → Clear build cache & deploy
```

必须清除旧缓存，避免继续使用之前 Node 24 或损坏的 npm 安装缓存。

## 正常日志

```text
Using Node.js version 22.22.1
npm ci --no-audit --no-fund
npm run build
vite build
built in ...
```

随后站点状态应变为 **Live**。

## 常见问题

### `Exit handler never called`

确认 Node 已固定为 `22.22.1`，然后使用 **Clear build cache & deploy**。

### `Could not find package.json`

所有项目文件应位于仓库根目录，Root Directory 留空。

### `Publish directory dist does not exist`

确认 Build Command 包含 `npm run build`，Publish Directory 为 `dist`。

### 页面还是旧动画或仍然需要手动发球

确认 GitHub 最新 commit 已包含新的：

```text
src/roulette3d.js
app.js
index.html
styles.css
package-lock.json
```

然后清缓存重部署。
