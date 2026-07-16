# 上传 GitHub 并部署到 Render

这个项目是纯静态网站，不需要数据库、后端服务器或环境变量。

## 方法一：网页操作（最简单）

1. 解压项目压缩包。
2. 在 GitHub 新建一个空仓库，例如：
   `roulette-education-simulator`
3. 将解压后的全部文件上传到仓库根目录，尤其要确认以下文件存在：
   - `index.html`
   - `styles.css`
   - `app.js`
   - `render.yaml`
4. 将下面地址里的用户名和仓库名换成你自己的，然后打开：

```text
https://dashboard.render.com/blueprint/new?repo=https://github.com/<你的用户名>/<仓库名>
```

5. 若 Render 要求授权 GitHub，按提示授权。
6. 确认 Blueprint 中出现一个名为 `roulette-education-simulator` 的 Static Site。
7. 点击 **Apply**。
8. 部署完成后，Render 会提供一个 `onrender.com` 地址。

## 方法二：Git 命令上传

在解压后的项目目录运行：

```bash
git init
git add .
git commit -m "Add multilingual roulette education simulator"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

然后打开：

```text
https://dashboard.render.com/blueprint/new?repo=https://github.com/<你的用户名>/<仓库名>
```

## 不使用 Blueprint，手动创建 Static Site

也可以在 Render Dashboard 选择：

```text
New → Static Site
```

设置为：

- Build Command: `echo "Static educational site ready"`
- Publish Directory: `.`

## 本地预览

```bash
python3 -m http.server 8080
```

浏览器打开：

```text
http://localhost:8080
```

## 后续修改

修改代码并推送到 GitHub 后，Render 默认会自动重新部署。
