# 构建说明 / Club Edition 02

targetFinish: 一个可运行的俱乐部经营与比赛日原型：赛前管理、五项能力与适配、预算限制、训练磨合、自然移动与高清街区比赛，并能进入下一场。

必读：PRODUCT_BRIEF.md、GAME_DESIGN.md、ART_DIRECTION.md、docs/PLAYER_SYSTEM.md。

experienceProfile: 选择合适球员与执教体系 → 管理工资和首发能力预算 → 训练与磨合 → 开始比赛日 → 观察与临场决策 → 结算并准备下一场。

运行环境：支持 WebGL 的桌面和移动浏览器。实测为 Codex in-app browser / Chromium 的桌面与手机断点，非真实手机硬件。Three.js r128，Node.js 24.13.0，无依赖安装。

- install: NONE
- buildOrExport: `node build.mjs`
- start: `node serve.mjs`，或直接打开 index.html
- verify: `node qa/verify.mjs`
- completeRun: qa/verification.json#completeRun

验证启动、真实变化的画面、输入、核心循环、设计结果与新比赛归零。浏览器证据与构建 SHA-256 绑定。经营数值与身体间距另由 15 项回归覆盖。

输入边界：玩家操作教练与管理界面，不直接控制人物。相机固定；失焦后不追赶大量隐藏时间。身体间距约束是减少重叠的简化碰撞，不代表完整篮球物理。

限制：实际移动硬件帧率、长期数值平衡、跨浏览器、完整犯规与物理规则、云存档和赛季市场尚未验证或未实现。
