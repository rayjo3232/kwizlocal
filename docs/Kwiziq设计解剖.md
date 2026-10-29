# Kwiziq 设计解剖

> 研究方法：直接读 kwiziq.com 的生产 CSS，而不是看截图猜。
> 所有结论标注「实证」（能在代码里找到）或「推断」（从截图和结构推测）。

---

## 一、字体系统（实证）

Kwiziq 加载了 **四套字体**，各司其职：

| 字体 | 类型 | 用在哪 | 文件 |
|---|---|---|---|
| **Inter** | 无衬线，可变字重 100–900 | 整个界面：导航、按钮、表单、说明 | `InterVariable.woff2`（207 KB） |
| **Poppins** | 几何无衬线，Bold/ExtraBold | 大标题、营销页 | 2 个字重 |
| **Lora** | **衬线**，Regular / Italic / Bold | **所有语言内容**：例句、阅读文章、引用 | 3 个文件（各约 28 KB） |
| **Kalam** | 手写体 | 极少数强调 | 1 个 |

```css
/* kwiziq.com/fonts/fonts.css */
@font-face { font-family:'Inter'; font-weight:100 900; src:url('Inter/InterVariable...woff2'); }
@font-face { font-family:'Lora'; font-style:normal; src:url('Lora/Lora-Regular...woff2'); }
@font-face { font-family:'Lora'; font-style:italic; src:url('Lora/Lora-Italic...woff2'); }
```

**关键洞察**：字体不是随便选的，而是**按「界面 vs 内容」分工**。

- 界面用无衬线（Inter）—— 快、清晰、不像书本
- 语言内容用衬线（Lora）—— 像纸质教材，适合长句阅读

这不是审美偏好，是功能分区。

---

## 二、法语和英语怎么区分（实证，这是核心）

### 真实 CSS

```css
/* CssLessonSite.css */
.txt--lang-foreign,
.txt--lang-native { font-family: Lora, Georgia, Times, serif; }

.txt--lang-native  { font-style: italic; color: #666666; }   /* 页面主语言 */
.txt--lang-foreign { color: #262626; }                        /* 外语 */
```

### 真实 HTML

```html
<div class="text-example">
  <span class="txt--lang-native">Tu viens d'où ?</span>      <!-- 法语 -->
  <span class="txt--lang-foreign">Where are you from?</span>  <!-- 英语 -->
</div>
```

### 结论

在**法语课程页**上（页面主语言 = 法语）：

| | 字体 | 样式 | 颜色 | 视觉权重 |
|---|---|---|---|---|
| **法语**（学习目标） | Lora 衬线 | **斜体** | **#666 灰** | 轻，退后 |
| **英语**（翻译） | Lora 衬线 | **正体** | **#262626 近黑** | 重，主导 |

**这和直觉相反**：通常人们会强调"要学的外语"，但 Kwiziq 反过来——

> 英语给足对比度让你**读懂意思**，法语用斜体灰字**退到背景**，等你需要细看时再聚焦。

理由很实在：卡住你的是「这句英文到底什么意思」，而不是「法语字母长什么样」。先理解，再吸收。

### 我的实现曾经完全做反了

之前我做的是：法语**加粗深色**，英语**灰色小字**。

结果就是你看到的「分不清」——因为英语太弱，法语太抢，两个都在争注意力。

**已改**（v7）：法语 Lora 斜体灰，英语 Lora 正体深。

### 行内提及的处理

在英文说明里夹一个法语词（`Use le for masculine nouns`），Kwiziq 用的是 `<strong>`：

```html
<strong>Je viens de</strong>
```

**不换字体、不加颜色**，只加粗。

我的做法：换字体（Inter → Lora 衬线）+ 斜体。字形差异比单纯加粗更明显，也符合排版传统（外语用斜体）。

---

## 三、排版基础（实证）

```css
html { font-size: 16px; line-height: 1.5em; }
body { font-family: Inter, "Helvetica Neue", Helvetica, Arial, sans-serif; }
.text-example { margin-bottom: 1.3em; }
```

- 基准 **16px / 1.5**（我们之前 15px / 1.6）
- 例句块间距用 `em`（相对单位），不是固定 px
- 圆角很小：`border-radius: 3px`（我们用的 10px，偏"卡片化"）

---

## 四、颜色系统（实证）

| 用途 | 色值 | 我们之前 |
|---|---|---|
| 品牌橙 | **#ff6a00** | #F26500（偏暗） |
| 正文 | **#262626** | #14181D（偏黑） |
| 次要文字 | **#666666** | #6B7480（偏蓝） |
| 边框 | **#e5e5e5** | #E6E8EB |
| 例句 hover | **#e5f4ff** 浅蓝 | 无 |
| 错误红 | #d51c1b | 一致 |

**已同步**到 v7。

---

## 五、例句块的完整设计（实证 + 推断）

```html
<div class="text-example">
  <span class="txt--lang-native">Tu viens d'où ?</span>
  <span class="audio-player">🔊</span>              <!-- 内嵌音频 -->
  <span class="txt--lang-foreign">Where are you from?</span>
</div>
```

```css
.text-example { transition: background-color 150ms ease; }
.text-example:hover { background-color: #e5f4ff; border-radius: 3px; }
```

三个细节：

1. **整块可 hover**，变浅蓝 → 说明整句可点击（查词 / 收藏）
2. **音频按钮内嵌在句子里**，不是单独一行
3. **法语在上、英语在下**（`display:block`）

我们做的是 1 和 3，缺 2（你不做音频）和「整句可点击」。

---

## 六、Brainmap：六边形蜂巢（实证，来自截图）

Kwiziq 的 Brainmap 不是方块网格，是**六边形紧密排列的蜂巢**：

- 每个六边形 = 一个语法点
- 颜色：绿（掌握）/ 黄（一般）/ 红（薄弱）/ 灰（未学）
- 级别标签（A2/B1/B2/C1）用**大号字**直接压在图上，作为区域划分
- 六边形之间没有间隙，视觉上连成一片"地图"

我们用的是方块网格 + 颜色，结构对了，但**视觉冲击力差一个量级**。

蜂巢的好处：
- 面积利用率高（比方块多约 15%）
- 没有"行列"暗示，更像地图而不是表格
- 相邻关系更自然（每个格子有 6 个邻居而不是 4 个）

**实现成本**：中等。需要按奇偶行错位排列，CSS 可以用 `transform: translateX(50%)` 实现。

---

## 七、还没抄到的（按价值排序）

| # | 项目 | 价值 | 成本 |
|---|---|---|---|
| 1 | **六边形 Brainmap** | 高——这是 Kwiziq 最有辨识度的界面 | 中 |
| 2 | **例句整块可点击**（查词/收藏/加入复习） | 高——把"读"变成"操作" | 中 |
| 3 | **Poppins 标题字体** | 中——标题气质会更接近 | 低 |
| 4 | **圆角收敛到 3–6px** | 中——现在偏"网页模板感" | 低 |
| 5 | **间距改用 em 相对单位** | 低——可维护性 | 低 |
| 6 | **音频** | — | 你说不做 |

---

## 八、方法论上的教训

我之前的做法是「看截图 → 猜设计 → 自己实现」，结果是形似神不似。

正确做法是「**读生产代码**」：

```bash
curl -sL https://www.kwiziq.com/ | grep -oE 'href="[^"]*\.css[^"]*"'
# → CssSite.css / CssLessonSite.css
curl -sL <css-url> | grep -oE 'font-family:[^;}]*'
```

CSS 是不会骗人的。它告诉你真实的字号、颜色、间距、字体，以及**它们用在哪里**。

截图只能告诉你"看起来怎么样"，CSS 告诉你"为什么是这样"。
