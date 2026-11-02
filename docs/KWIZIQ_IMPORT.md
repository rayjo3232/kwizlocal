# KwizIQ 语法目录导入

用户在本聊天中明确表示已取得全部授权，并要求为个人学习抓取和导入该目录。授权声明记录为用户提供的信息；课程版权和作者署名仍归原权利人。

范围：https://french.kwiziq.com/revision/grammar 目录列出的 541 个课程 URL，包含 A0、A1、A2、B1、B2、C1。此目录不是“整个网站的全部页面”，不递归抓取论坛或任意外链。

本次结果：541/541 成功，0 失败；4,662 组双语例句，911 处正文课程链接转为本地。级别分布：A0 28、A1 134、A2 165、B1 98、B2 84、C1 32。

## 内容

- 保留课程正文、教学标题、例句、表格和注意事项，记录原文 URL、作者、原文更新日期、抓取时间、原始响应哈希。
- 同时保存正文中的双语例句和相关课程信息；已导入的课程链接会指向本地阅读器。
- 去除注册提示、广告、跟踪属性、脚本、表单及播放器。不调用 `/api/`，不导入在线测验、音频或视频；图示保留原图链接，需要联网。
- 已读只表示阅读进度，不改变原有语法掌握度和题库。原有 162 个知识点、1,334 道练习和个人学习记录继续使用。

## 重现

安装依赖：`python -m pip install --no-user -r tools/requirements-crawl.txt`。也支持已装在 `.dev/python-libs` 的 BeautifulSoup。

`python tools/crawl_kwiziq.py --delay 1` 串行抓取，使用明确的 KwizLocal User-Agent，检查 robots.txt，至少间隔一秒，遵守该 User-Agent 匹配的 Crawl-delay。抓取支持缓存恢复和失败记录，不规避登录或访问限制。

原始页面保存在被 Git 忽略的 `.dev/kwiziq/pages/`。输出为 `app/kwiziq-lessons.js`，懒加载脚本同时支持 HTTP(S) 和直接从 file:// 打开的本地应用。

`python tools/crawl_kwiziq.py --emit-only` 从已有原始页面重建，不访问网络。`--limit N` 仅供开发，不用于完整发布。输出记录目录总数、已导入数量及每篇状态，缺失页不会伪装成已导入。

运行 `node tools/check_source_archive.cjs` 验证完整性、署名溯源字段、安全 HTML、例句和本地链接；`node tools/smoke_studio.cjs` 覆盖阅读器、筛选、已读、移动端、离线及原有学习流程。

## 应用入口

课程库 → 原版语法库（`#/sources`）；单篇课程为 `#/source/<id>`。现有知识点精讲页可打开同级原版课程。

课程文件列入离线缓存和构建清单，更新按 `app/release.js` 的版本切换。
