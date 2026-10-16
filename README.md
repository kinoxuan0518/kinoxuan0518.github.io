# 漂流的舱 · The Drifting Cabin

Kino Xuan 的个人主页：一艘靠自转产生重力的飞船里的一节舱，漂在黑洞边上。舱里的东西都可以点开：录像机、唱机、书桌上的笔记本、望远镜、攀岩墙、小杏仁、舱门，还有一块地毯。

The home page of Kino Xuan: one cabin in a spinning ship drifting by a black hole. Everything in it opens up.

- 整个页面是一个 `index.html`：房间在 WebGL2 里实时光线步进绘制，没有框架。中文 / English 可切换。
- 本地预览：`python3 -m http.server`，打开 http://localhost:8000 。
- 部署：Vercel 按 `vercel.json` 运行 `node build.mjs`，把静态文件复制到 `dist/`。
- 小杏仁（Kino 的 AI persona）借用访客自己的 Claude 来思考，只在 Claude 上的那一版里能聊；persona 本身在 [`skills/kino-persona/SKILL.md`](skills/kino-persona/SKILL.md)。
- 旧版 React 主页保留在 `legacy-react-site` 分支。

字体：霞鹜文楷 LXGW WenKai（SIL Open Font License 1.1，见 `fonts/OFL.txt`），按页面用到的字做了子集。
