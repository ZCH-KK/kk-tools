# kk-tools · 部署到 GitHub Pages

## 前置
- 已用 `.netrc` 存好 GitHub token（`machine github.com login ghp_*** password x-access-token`）
- 仓库 `kk-tools` 在 GitHub 已存在（你要先在 https://github.com/new 建空仓库，名字 `kk-tools`）

## 一行部署
```bash
cd /Users/kk/kk-tools
git init -b main
echo ".DS_Store" > .gitignore
git add .
git commit -m "feat: kk tools v1 - notes + snippets"
git remote add origin https://github.com/ZCH-KK/kk-tools.git
git push -u origin main
```

## GitHub Pages 设置
仓库 → Settings → Pages：
- Source: **Deploy from a branch**
- Branch: **main** / **(root)
- 等 30-60 秒，访问：https://zch-kk.github.io/kk-tools/

## 验证清单
打开浏览器硬刷 `Cmd+Shift+R`：
- [ ] 标题 "kk tools" 玻璃字渲染
- [ ] 4 个彩色 blob 在背景旋转
- [ ] Tab 切换 笔记 / 片段
- [ ] 新建笔记 → 写 Markdown → 预览实时渲染
- [ ] 新建片段 → 选语言 → 双击列表项复制
- [ ] Cmd+Shift+C 复制当前片段
- [ ] 刷新页面 → 数据还在（localStorage）
- [ ] DevTools Console 无 CSP 报错

## 文件
- `index.html` — 主页（笔记+片段双 tab）
- `style.css` — 液态玻璃样式
- `app.js` — 笔记 + 片段 + Markdown 渲染
- 无外部依赖，无 build step，无网络请求