# 漂流的舱 · The Drifting Cabin

Kino Xuan 的个人主页：一艘靠自转产生重力的飞船里的一节舱，漂在黑洞边上。舱里的东西都可以点开：录像机、唱机、书桌上的笔记本、望远镜、攀岩墙、小杏仁、舱门，还有一块地毯。

The home page of Kino Xuan: one cabin in a spinning ship drifting by a black hole. Everything in it opens up.

- 整个页面是一个 `index.html`：房间在 WebGL2 里实时光线步进绘制，没有框架。中文 / English 可切换。
- 本地预览：`python3 -m http.server`，打开 http://localhost:8000 。
- 部署：网页由 GitHub Pages 发布在 https://kinoxuan0518.github.io/ 。Vercel 只负责 `api/` 下的两个小接口（访问 Vercel 域名的首页会跳回 github.io）。
- 小杏仁（Kino 的 AI persona）：在 Claude 上那一版里借用访客自己的 Claude；在这里走 `api/chat.js`（Vercel 函数），persona 提示词放在服务端 `api/_persona.js`，模型 Key 只在 Vercel 环境变量里。persona 原文在 [`skills/kino-persona/SKILL.md`](skills/kino-persona/SKILL.md)。
- 笔记本的隐形墨水：写完字消失，内容由 `api/ink.js` 发到 Kino 的邮箱。

## 需要在 Vercel 设置的环境变量

| 变量 | 用途 |
| --- | --- |
| `DEEPSEEK_API_KEY` | 小杏仁用的 DeepSeek Key（必填） |
| `INK_TO` | 笔记本留言发到的邮箱（必填） |
| `LLM_MODEL` / `LLM_BASE_URL` | 可选，换模型或换成别家兼容 OpenAI 的接口 |
| `RESEND_API_KEY` | 可选，填了就用 Resend 发信，否则用 FormSubmit（第一次会收到一封激活邮件，点一下即可） |
- 旧版 React 主页保留在 `legacy-react-site` 分支。

字体全部自托管、按页面用到的字做了子集，不依赖任何外部字体服务：霞鹜文楷 LXGW WenKai（`fonts/OFL.txt`），Anton、Space Mono、VT323、Noto Serif SC（来自 google/fonts，`fonts/OFL-*.txt`），均为 SIL Open Font License 1.1。
