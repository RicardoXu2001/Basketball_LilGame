# 构建说明

targetFinish: 一个可运行的第一版原型：街头篮球场景 + 比赛展示区 + 教练控制台 + 基础模拟逻辑。

必读设计：`PRODUCT_BRIEF.md`、`GAME_DESIGN.md`、`ART_DIRECTION.md`。

experienceProfile: 观察比赛 → 读取球员状态和局势 → 调整阵容 / 战术 / 节奏 → 观察执行结果 → 再次决策。

必须保真：街区日落微缩模型、完整全场和两个篮架、自动比赛、教练战术和轮换实际影响模拟结果。按 GAME_DESIGN 的完整路径证明从开赛到比赛结果再到重开。

toolchain:

- targetPlatform: 桌面浏览器
- targetRuntime: 支持 WebGL 的现代 Chromium 浏览器，离线 HTML
- testedRuntime: Codex in-app browser / Chromium（实际版本见 qa/evidence/browser.json）
- engine: 本地 Three.js；无框架和网络依赖
- engineVersion: Three.js r128（目录中已有的本地版本）
- runtimeVersion: Node.js 24.13.0
- packageManager: none

commands:

- install: NONE
- buildOrExport: `node build.mjs`
- start: 双击 `index.html`，或 `node serve.mjs`
- verify: `node qa/verify.mjs`

verification:

- completeRun: `qa/verification.json#completeRun`
- browser evidence: `qa/evidence/browser.json`
- engine regression: `tests/match.test.cjs`

连续 3D 输入边界：玩家只控制教练台，相机固定；不提供自由移动和人物操控，没有需要验证的玩家碰撞路线。窗口失焦后 dt 上限 .075 秒，恢复时不追赶大量隐藏时间。

当前限制：原型概率模型，身体碰撞与完整裁判规则未实现；罚球直接结算；长期生涯、存档、移动设备性能和其他浏览器未覆盖。
