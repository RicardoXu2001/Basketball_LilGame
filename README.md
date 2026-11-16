# Streetball Coach / 街头篮球教练

街头球队经营与比赛日原型。先签约、制定首发和训练，再在夕阳下的 3D 街区球场执教。

线上试玩：[Streetball Coach](https://ricardoxu2001.github.io/Basketball_LilGame/)

## 运行

直接打开 `index.html`，或运行 `node serve.mjs` 后访问 `http://127.0.0.1:8765`。

所有脚本、Three.js、样式和程序化纹理均已内联，不依赖 CDN、在线字体或图片。浏览器需要支持 WebGL。单文件的 file:// 打开方式受内置预览器限制，实际 QA 使用本地 HTTP。

## 从赛前准备开始

- 页面默认停留在球队总部，比赛时间冻结。点击「开始比赛日」后才开赛。
- 在「阵容与备战」选择五名首发及执教体系；查看每人的五项核心能力、OVR、打法和战术适配。
- 全队工资帽 140K / 周，五人首发能力预算 400，阵容最多十人。超出预算或未选满五人时禁止开赛。
- 「自由球员」支持签约；新援的熟悉度较低，需要合练。球队账本支持一次性重谈轮换合同及解约。
- 「训练中心」支持战术合练、专项培养和恢复；每个比赛日有两次额度。培养会重算总评与能力预算。
- 经营数据自动保存在当前浏览器。刷新会回到赛前，保留阵容和经营进度；不保存进行中的比赛，也没有云同步。

## 比赛中

蓝绿色是河畔队，橙色是铁街队，金色圆环标记持球人。比赛自动进行，可切换六种进攻、四种防守、三档节奏及四种进攻重点。球员详情显示五项核心与打法；细项能力在后台参与模拟。

支持换人、暂停恢复、技术统计、1× / 2× / 4×、战术视图与画质切换。主动换人同样遵守能力预算。空格暂停 / 继续，Esc 关闭对话框。

四节三分钟、24 秒进攻时限、第三节交换半场；平局进入一分钟加时。结束后结算游戏资金、熟悉度与体能，返回总部准备下一场。

默认使用高清画质与设备 DPR（最高 2），保留像素纹理；「复古」选项才主动降低内部渲染分辨率。手机采用更紧凑的固定构图与更大的操作文字。

## 构建与检查

无需安装依赖。开发需要 Node.js 18+，本次使用 24.13.0。

```sh
node build.mjs
node --test tests/match.test.cjs tests/club.test.cjs tests/motion.test.cjs
node qa/verify.mjs
```

| 源码 | 作用 |
| --- | --- |
| `src/match.js` | 球员模型、五项能力与 OVR、适配、回合和比赛规则 |
| `src/motion.js` | 固定时间步的移动、转向、加减速和身体间距 |
| `src/club.js` | 合同、预算、训练、磨合、比赛日结算及存档 |
| `src/hub.js` | 赛前球队管理界面 |
| `src/court.js` | Three.js 场景、关节动作、高清渲染与篮球轨迹 |
| `src/coach.js` | 教练台、比赛信息和界面连接 |
| `src/app.css`、`src/hub.css` | 桌面与手机界面 |
| `src/player.d.ts` | 对外球员数据结构 |

规则与计算公式详见 [球员系统说明](docs/PLAYER_SYSTEM.md)。`qa/verify.mjs` 将测试与当前构建的浏览器证据绑定；没有采集证据的新克隆会报告 NOT_RUN，不会复用旧的通过结果。

## 部署与后续更新

GitHub Pages 从 `main` 根目录发布，`.nojekyll` 跳过 Jekyll。

```sh
node --test tests/match.test.cjs tests/club.test.cjs tests/motion.test.cjs
node build.mjs
git add src tests docs index.html README.md build.mjs package.json
git commit -m "Update Streetball Coach"
git push origin main
```

推送后 Pages 自动更新，可在仓库 Actions 查看发布状态。浏览器缓存、旧实验脚本与本机截图由 `.gitignore` 排除。旧版编号源码留在本地，不参与新构建。

## 当前边界

本版采用简化概率防守和程序化动作，具有身体间距约束，但没有完整的掩护身体碰撞、裁判或球体物理求解。罚球直接结算。无合适替补时的犯规离场规则仍采用原型简化。训练和预算数值是首版调校，长期平衡仍需试玩验证。实际手机硬件性能、其他浏览器、完整赛季与动态合同市场未覆盖。

Three.js r128 沿用本地 MIT 许可版本，见 `THIRD_PARTY_NOTICES.md`。

