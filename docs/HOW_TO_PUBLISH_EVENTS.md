# NECINA 活动发布教程（Sanity 版）

> English summary: this guide explains how NECINA admins publish events through Sanity Studio,
> and how a technical maintainer sets Studio up once. Developer-side setup details are in
> [`../SANITY_TRIAL.md`](../SANITY_TRIAL.md).

本教程分两部分：

- **第一部分：一次性搭建**。由一位懂技术的负责人做一次，之后不用再做。
- **第二部分：日常发布活动**。每位管理人员发布或修改活动时照着做，不需要会写代码。

后面还有字段速查表、常见问题和注意事项。

---

## 当前阶段说明

目前 Sanity 版还在试用阶段，和原版并存：

| 版本 | 网址 | 数据来源 |
|---|---|---|
| 原版 | `/events` | 代码里的 `officialContent.ts`，改动要改代码并重新部署 |
| Sanity 试用版 | `/sanity/events` | Sanity 后台，发布后网站自动读取 |

试用版代码在分支 `sanity-events-trial` 上，还没有合并到 `main`，也没有部署到正式网址。
试用期间，验证发布效果需要在本地运行网站（见第二部分第 6 步），或由开发人员部署该分支的预览版。
如果团队决定采用 Sanity，开发人员再把正式的 `/events` 切换到 Sanity 数据源。

Sanity 项目信息：

- 项目 ID：`3p40dgwx`
- 数据集：`production`（公开）
- 后台地址：<https://www.sanity.io/manage>

---

## 第一部分：一次性搭建（技术负责人）

### 1. 确认 Sanity 项目设置

登录 <https://www.sanity.io/manage>，进入项目 `3p40dgwx`：

1. **Datasets**：确认 `production` 是 **Public**。网站匿名读取数据必须公开。
2. **API → CORS origins**：添加网站运行的地址，每个地址一条：
   - `http://localhost:3000`（本地开发）
   - 正式域名，例如 `https://necina.org` 和 Vercel 的预览域名（部署后再加）
   
   不要勾选 "Allow credentials"。缺少这一步时，网站会显示 `Failed to fetch`。

### 2. 创建 Sanity Studio（编辑后台）

Studio 是管理人员用来编辑活动的网页。它是一个独立的小项目，建议放在本仓库以外的文件夹。

```bash
npm create sanity@latest -- --project 3p40dgwx --dataset production --template clean
```

过程中会要求在浏览器登录 Sanity，并询问项目文件夹名称（例如 `necina-studio`）。

### 3. 放入活动的字段定义（schema）

把本仓库的 `sanity/schemaTypes/event.mjs` 复制到 Studio 项目中，并注册：

```bash
cp sanity/schemaTypes/event.mjs <studio目录>/schemaTypes/event.js
```

编辑 `<studio目录>/schemaTypes/index.ts`，改成：

```ts
import event from './event.js';

export const schemaTypes = [event];
```

字段定义和网站代码里的 `OfficialEvent` 类型一一对应。以后要加字段，两边都要改。

### 4. 本地运行并检查 Studio

```bash
cd <studio目录> && npm run dev
```

浏览器打开 <http://localhost:3333>，登录后左侧应出现 **Event** 类型，里面能看到已导入的 6 个活动。

### 5. 部署 Studio，让管理人员在任何地方都能用

```bash
cd <studio目录> && npx sanity deploy
```

会要求选择一个子域名，例如 `necina`，部署后的地址是 `https://necina.sanity.studio`。
把这个地址发给管理人员。部署后的 Studio 的 CORS 会由 Sanity 自动管理，不用手动加。

以后修改了字段定义，重新运行一次 `npx sanity deploy` 即可。

### 6. 邀请管理人员

Sanity manage → 项目 → **Members** → Invite，填写对方邮箱。

角色说明：

- 免费套餐只有 **Administrator**（可编辑、可改项目设置）和 **Viewer**（只能看）两种角色。要让多人编辑，只能都设为 Administrator。
- 需要区分"只能编辑内容、不能改项目设置"的 Editor 角色，要升级到 Growth 套餐。
- 免费套餐最多 20 个成员。

### 7. 导入现有活动（只做一次，已完成）

现有的 6 个活动已经在 2026 年 10 月导入。**不要再运行** `scripts/seed-sanity.mjs`：
它会用代码里的旧数据覆盖 Sanity 里同名的活动，管理人员在后台做过的修改会丢失。

只有在建立全新的数据集时才需要导入，步骤见 `SANITY_TRIAL.md`。

### 8. 配置网站读取 Sanity

本地开发：在仓库根目录创建 `.env.local`（此文件不提交）：

```
VITE_SANITY_PROJECT_ID=3p40dgwx
VITE_SANITY_DATASET=production
```

Vercel 部署：在 Vercel 项目的 Environment Variables 里添加同样的两个变量。

网站读取不需要任何令牌（token）。

### 9. 令牌安全

写入令牌（Editor token）只在导入数据时用。用完后在 manage → API → Tokens 删除。
令牌不要发到聊天、邮件或代码里；凡是出现在聊天记录里的令牌，都应视为泄露并立即删除。

---

## 第二部分：日常发布一个活动（管理人员）

### 第 1 步：登录 Studio

打开技术负责人发给你的 Studio 地址（形如 `https://necina.sanity.studio`），用受邀请的邮箱登录。

### 第 2 步：新建活动

左侧点击 **Event**，再点右上角的 **+**（Create new document），会出现一张空白表单。

要修改已有活动，直接在列表里点开它即可。

### 第 3 步：填写字段

必填的四项：

| 字段 | 填什么 | 示例 |
|---|---|---|
| **Stable ID** | 唯一标识，小写字母、数字和连字符，**发布后不要再改** | `ai-summit-2026` |
| **URL slug** | 网址的最后一段，通常和 ID 相同 | `ai-summit-2026` → 网址 `/sanity/events/ai-summit-2026` |
| **Category** | 下拉选择 | `AI & Tech` |
| **Status** | `upcoming`（即将举行）或 `past`（已结束） | `upcoming` |

其他建议填写的字段：

| 字段 | 说明 |
|---|---|
| **Title (EN) / Title (中文)** | 活动标题，中英文都要填。网站切换语言时分别显示 |
| **Date (display text)** | 显示用的日期文字，例如 `March 14, 2026, 6:00–9:00 PM` / `2026年3月14日 18:00–21:00` |
| **Venue** | 地点，中英文 |
| **Description** | 活动简介，中英文 |
| **Sort order** | 数字越小越靠前。现有活动是 0 到 5，新活动想排最前面就填 `-1`、`-2`……或者给所有活动重新编号 |
| **Registration URL / button text** | 报名链接和按钮文字 |
| **Speakers、Highlights、Co-organizers** | 列表类字段，点 Add item 一条一条加 |
| **Category (中文)** | 分类的中文名，和下拉选项对应：旗舰峰会 / 前沿科技 / 青年创业 / 商业领袖 / 社区活动 |

所有带 `(中文)` 或 `_zh` 的字段是中文版本，请成对填写，否则中文页面会缺内容。

### 第 4 步：上传图片

| 字段 | 用途 |
|---|---|
| **Cover image** | 列表卡片和详情页头图，**请一定上传** |
| **Poster image** | 海报视图（`/sanity/events/<slug>/poster`）。不填时用 Cover image |
| **Photo image** | 详情页的现场照片。不填时网站用一张默认照片 |

点击字段里的 **Upload**，选择本地图片即可。图片会存到 Sanity 的图片 CDN，不需要再放进代码仓库。

### 第 5 步：发布

表单右下角点击 **Publish**。

- 填写过程中的内容会自动保存为**草稿**，草稿不会出现在网站上。
- 只有点了 Publish，网站才能读到。
- 发布后再修改，需要**再点一次 Publish**，否则改动只停留在草稿。

### 第 6 步：在网站上检查

试用阶段，在本地运行网站：

```bash
cd <仓库目录> && npm run dev
```

打开 <http://localhost:3000/sanity/events>：

- 页面顶部的黄色提示条会显示 `Sanity trial: N events loaded from Sanity`，N 应该比发布前多 1。
- `upcoming` 的活动在 **Upcoming Events** 标签页，`past` 的在 **Past Events Archive** 标签页（默认显示的是 Past）。
- 点开活动，确认中英文、图片和报名链接都正确。

发布后通常一分钟内生效，看不到时刷新页面再试。

### 第 7 步：活动结束后

把该活动的 **Status** 从 `upcoming` 改为 `past`，再点 **Publish**。活动就会从"即将举行"移到"往期回顾"。

要让某个活动从网站上消失：打开该活动，点标题旁边的 **⋯** 菜单，选 **Unpublish**（保留草稿，可再发布）或 **Delete**（彻底删除）。

---

## 字段速查表

| Studio 字段 | 代码字段 | 必填 | 类型 |
|---|---|---|---|
| Stable ID | `id` | 是 | 文本 |
| URL slug | `slug` | 是 | 文本 |
| Sort order | `sortOrder` | 否 | 数字 |
| Title (EN / 中文) | `title` / `title_zh` | 建议 | 文本 |
| Subtitle | `subtitle` / `subtitle_zh` | 否 | 文本 |
| Date (display text) | `date` / `date_zh` | 建议 | 文本 |
| Start date | `startDate` | 否 | 日期（暂未被网站使用，为将来自动排序预留） |
| Publish date label | `publishDate` / `publishDate_zh` | 否 | 文本 |
| Venue | `venue` / `venue_zh` | 建议 | 文本 |
| Category | `category` | 是 | 下拉：Flagship, AI & Tech, Youth, Entrepreneurship, Community |
| Category (中文) | `category_zh` | 建议 | 文本 |
| Status | `status` | 是 | 单选：upcoming / past |
| Description | `description` / `description_zh` | 建议 | 多行文本 |
| Speakers | `speakers` / `speakers_zh` | 否 | 列表 |
| Registration URL / text | `registrationUrl`, `registrationText` / `_zh` | 否 | 文本 |
| Cover / Poster / Photo image | `image`, `posterImage`, `photoImage` | Cover 建议 | 图片 |
| Organizer / Co-organizers | `organizer` / `_zh`, `coOrganizers` / `_zh` | 否 | 文本 / 列表 |
| Target audience | `targetAudience` / `_zh` | 否 | 文本 |
| Source URL / name | `sourceUrl`, `sourceName` / `_zh` | 否 | 文本 |
| Highlights | `highlights` / `highlights_zh` | 否 | 列表 |
| Curriculum | `curriculum` | 否 | 列表，每项含 title / title_zh / desc / desc_zh |
| Paragraphs | `paragraphs` / `paragraphs_zh` | 否 | 列表 |

---

## 常见问题

**网站顶部显示 `Sanity trial: failed to load (Failed to fetch)`**
网站所在的地址没有加进 Sanity 的 CORS origins。按第一部分第 1 步添加（本地是 `http://localhost:3000`）。

**显示 `VITE_SANITY_PROJECT_ID is not set`**
网站缺少环境变量。本地检查 `.env.local`，Vercel 检查 Environment Variables，改完要重启 `npm run dev` 或重新部署。

**发布了，但网站上找不到**
依次检查：
1. 是否真的点了 **Publish**，而不是只保存了草稿。
2. **Status** 对不对：`upcoming` 在 Upcoming 标签页，`past` 在 Past 标签页。
3. 分类筛选：分类按钮只列出 Flagship、AI & Tech、Youth、Entrepreneurship 四类，`Community` 类的活动只在 **All Categories** 下显示。
4. 等一分钟后刷新。

**图片不显示**
对应的图片字段没有上传。Cover image 是列表和详情页都用的，优先检查它。

**中文页面内容是英文或空白**
对应的 `(中文)` 字段没填。

**点开活动显示 "Event not found"**
网址里的 slug 和活动的 **URL slug** 不一致，或活动还没发布。

**误删了活动**
Sanity 会保留文档历史。在 Studio 里打开该文档（或在 manage 里查看 history），可以恢复到之前的版本。具体操作以 Sanity 当前界面为准。

---

## 注意事项

1. **不要重新运行导入脚本** `scripts/seed-sanity.mjs`，它会覆盖后台里的修改。
2. **Stable ID 发布后不要改**。网站用它关联上一条/下一条活动，改了可能导致旧链接失效。
3. **数据集是公开的**。任何已发布的内容任何人都能读到，不要在活动里放内部信息（如内部联系方式、未公开的赞助金额）。草稿不会被公开读取。
4. **令牌不要共享**。管理人员编辑活动不需要令牌，只需要 Studio 登录。
5. **免费套餐额度**：20 个成员、1 万个文档、每月 25 万次 API 请求和 100GB 带宽。活动网站正常使用远达不到上限，超出时需要升级。

---

## 相关文件

- [`SANITY_TRIAL.md`](../SANITY_TRIAL.md)：开发者视角的试用说明和已知限制
- [`sanity/schemaTypes/event.mjs`](../sanity/schemaTypes/event.mjs)：字段定义
- [`services/sanityEvents.ts`](../services/sanityEvents.ts)：网站读取 Sanity 的代码
- [`scripts/seed-sanity.mjs`](../scripts/seed-sanity.mjs)：一次性导入脚本
