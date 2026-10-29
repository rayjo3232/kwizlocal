# 部署到公网（手机随时访问）

## 先回答两个问题

**要不要买服务器？**
不需要。这个应用是纯静态网页（HTML/CSS/JS，2.7 MB），任何静态托管都能跑，免费额度绰绰有余。只有两种情况才需要买：

- 想绑自己的域名 + 国内访问要稳 → 域名 + 备案（7–20 天）+ 国内服务器
- 想要**跨设备自动同步进度** → 需要后端（Supabase 免费版够用）

**网页还是 APK？**
先做网页。这个应用已经是 PWA（有 manifest + service worker），安卓 Chrome 可以"添加到主屏幕"，得到图标、全屏、离线缓存，体验接近原生。更新时改文件就生效，不用重新打包。

APK 唯一的好处是不依赖浏览器。真需要的话，用 [PWABuilder](https://www.pwabuilder.com/) 输入网址就能生成签名的 APK，不用写 Android 代码。

---

## 部署包

已经准备好了两个东西：

```
dist/                    ← 直接上传这个文件夹
kwizlocal-site.zip       ← 或者上传这个压缩包（0.78 MB）
```

`dist/` 里只有运行必需的文件，去掉了 README、截图和 bat 脚本。

---

## 方案对比

| 方案 | 成本 | 国内速度 | 备案 | 上手 |
|---|---|---|---|---|
| **Cloudflare Pages** | 免费 | 中等 | 不需要 | 拖 zip，2 分钟 |
| Netlify Drop | 免费 | 较慢 | 不需要 | 拖 zip，1 分钟 |
| GitHub Pages | 免费 | 时好时坏 | 不需要 | 需要 git |
| 腾讯云 COS | ~¥1/月 | 快 | 绑自定义域名要备案 | 中等 |
| 轻量应用服务器 | ~¥100/年 | 快 | 要备案 | 中等 |

**推荐 Cloudflare Pages**：免费、自动 HTTPS、拖拽上传、全球 CDN。`*.pages.dev` 域名在国内大部分时候能直接打开。

---

## Cloudflare Pages 部署步骤

1. 打开 <https://dash.cloudflare.com/sign-up> 注册（邮箱即可，不用绑卡）
2. 左侧 **Workers & Pages** → **Create** → **Pages** → **Upload assets**
3. 项目名随便填，比如 `kwizlocal`
4. 把 `kwizlocal-site.zip` 拖进去（或者拖 `dist` 文件夹）
5. 点 **Deploy site**
6. 拿到地址，形如 `https://kwizlocal.pages.dev`

### 手机上装成 App

1. 安卓 Chrome 打开那个网址
2. 右上角 **⋮** → **添加到主屏幕**（或"安装应用"）
3. 桌面出现橙色 K 图标，点开全屏无地址栏

iOS 的话用 Safari → 分享 → 添加到主屏幕。

---

## 数据怎么跟着走（重要）

**PWA 的学习进度存在手机浏览器的 localStorage 里**，和电脑上的进度是两份独立的。

- 清除浏览器数据 → 进度丢失
- 换手机 → 进度不跟过去

所以：

1. **电脑上**：Settings → Export → 得到一个 JSON 文件
2. 把 JSON 传到手机（微信文件传输助手、邮件附件都行）
3. **手机上**：Settings → Import → 选那个 JSON
4. 之后每隔一两周导一次备份

应用本身不联网，不会自动同步——这是设计上的取舍，换来的是零成本、零账号、完全离线。

如果以后确实需要自动同步，可以接 Supabase（免费版：500 MB 数据库 + 邮箱登录），但那是另一个工程。

---

## 想改成 APK（可选）

1. 先按上面部署，拿到 HTTPS 网址
2. 打开 <https://www.pwabuilder.com/>
3. 输入网址 → **Start** → 选 **Android** → **Generate package**
4. 下载 zip，里面有 `.apk`（直接安装）和 `.aab`（上架用）
5. 手机允许"安装未知来源应用"后侧载

注意：APK 里的数据是独立的 WebView 存储，和浏览器里的进度**不互通**。而且每次改代码都要重新生成、重新安装。

---

## 本地继续开发

改完 `app/` 里的文件后，先自检再打包：

```bash
# 在项目根目录
python tools/check_deploy.py     # 检查离线缓存是否完整
python tools/build_dist.py       # 重建 dist/ 和 zip
```

`check_deploy.py` 会抓一类只在**离线时**才暴露的 bug：`index.html` 引用了某个文件，但 `sw.js` 的预缓存列表里没有它。装上 PWA 后断网打开，那个文件就加载失败。

（这个检查是有来历的：`deep.js` 第一次加进来时确实漏在了 SW 缓存外面，讲解加厚的内容离线全部消失。所以别跳过这一步。）

改完代码记得把 `app/sw.js` 里的 `CACHE = "kwizlocal-v2"` 往上加（`v3`、`v4`……），否则老用户的手机会一直用缓存里的旧版本。

---

## 常见问题

**打开是白屏？**
浏览器控制台看报错。最常见是 `sentences.js` 没上传完整（2.3 MB，有些上传工具会截断）。

**"添加到主屏幕"没反应？**
必须是 HTTPS（`https://` 开头），且 `manifest.json` 和 `sw.js` 都能正常访问。

**手机上的进度和电脑不一样？**
正常。两份独立存储，用导出/导入手动同步。

**域名可以换吗？**
Cloudflare Pages 支持绑自定义域名，免费。但域名本身要买（约 ¥60/年），绑国内服务器才需要备案。
