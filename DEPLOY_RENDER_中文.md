# Roulette Lab 3D：Render 部署说明

新版使用 Three.js 和 Vite。上传新版文件后，Render 设置必须从旧版的“无构建”改成 Vite 构建。

## 一、推荐：使用 Blueprint

仓库根目录已经包含 `render.yaml`。

1. 将项目全部文件上传到 GitHub 仓库根目录。
2. 确认 GitHub 中可以看到：
   - `index.html`
   - `app.js`
   - `src/roulette3d.js`
   - `package.json`
   - `package-lock.json`
   - `render.yaml`
3. Render Dashboard 选择 **New → Blueprint**。
4. 选择对应 GitHub 仓库。
5. Blueprint 文件路径保持 `render.yaml`。
6. 点击 **Apply**。

不需要数据库和环境变量。

## 二、已有 Static Site：修改设置

如果你已经创建了 `roulette` Static Site，在 Render 中打开：

**Settings → Build & Deploy**

改成：

```text
Root Directory: 留空
Build Command: npm ci && npm run build
Publish Directory: dist
Branch: main
Auto Deploy: Yes
```

然后点击 **Save Changes**，再选择：

```text
Manual Deploy → Deploy latest commit
```

### 旧设置不能继续使用

旧版曾使用：

```text
Build Command: echo "No build required"
Publish Directory: .
```

3D新版不能继续使用这两个值，否则 Render 会发布源文件而不是 Vite 生产包。

## 三、GitHub 上传注意事项

需要上传源码和锁文件，但不要上传：

```text
node_modules/
dist/
```

Render 会根据 `package-lock.json` 自动安装依赖并生成 `dist/`。

## 四、成功日志

正常部署会出现类似：

```text
npm ci
npm run build
vite build
built in ...
```

随后状态变成 **Live**。

## 五、常见错误

### `Could not find package.json`

说明 `package.json` 不在 Render 设置的 Root Directory 中。通常将 Root Directory 留空，并把所有文件放在仓库根目录即可。

### `Publish directory dist does not exist`

检查 Build Command 是否为：

```text
npm ci && npm run build
```

### 页面仍是旧版本

执行一次：

```text
Manual Deploy → Clear build cache & deploy
```

### 3D画面不可用

网站会自动显示2D后备轮盘。先确认浏览器已启用 WebGL，并尝试最新版 Chrome、Edge、Safari 或 Firefox。
