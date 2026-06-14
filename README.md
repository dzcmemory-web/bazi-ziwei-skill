<div align="center">

# bazi-ziwei-skill

**AI 八字 + 紫微斗数排盘与综合印证 Skill**

精准排盘（不靠 LLM 猜）· 三种分析模式 · 一键生成水墨风 HTML 命盘海报

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![SKILL.md](https://img.shields.io/badge/SKILL.md-compatible-c1432f.svg)](#-安装)

简体中文 | [English](./README.en.md)

<br>

<img src="./docs/jietu.png" alt="综合印证海报示例" width="680">

<sub>综合印证海报示例（合成命主，仅供展示）</sub>

</div>

---

## 这是什么

一个遵循 [SKILL.md 开放标准](https://code.claude.com/docs/en/skills) 的命理分析 Skill，可装入 Claude Code / Claude Desktop / Codex / Cursor / Hermes / OpenClaw 等支持该标准的 AI Agent。

它做三件大模型单独做不好的事：

1. **精准排盘**：八字四柱、紫微十二宫、大运流年由内置算法库计算，**不让 LLM 自己排**——纯 LLM 排盘常把日柱、日主、格局算错，一步错则全盘失真。
2. **格局补层**：在排盘之上补一层"格局 / 旺衰 / 调候 / 刑冲合害 / 盖头截脚"算法，喂给 LLM 做有依据的分析。
3. **综合印证**：把八字与紫微两套独立体系的结论做交叉对账——主轴是否一致、人生窗口是否对齐、冲突时听谁。这是本 Skill 区别于"任意 LLM + 任意排盘工具"的核心增量。

---

## ✨ 特性

- 🎯 **算法精准**：排盘核心源自开源项目 Yiqi（MIT），经实测对齐；补层算法经 7 组案例多维度回归验证
- 🧭 **三种分析模式**：八字独立 / 紫微独立 / 八字+紫微综合印证
- 📜 **两种呈现形态**：Markdown 长文深度版 + 🎴 单文件 HTML 海报版（综合印证专属）
- 🎴 **水墨风命盘海报**：现代极简 × 中式水墨，含紫微 12 宫盘 + 八字四柱盘 + 六维交叉对账，可截图分享
- 🔌 **跨 Agent**：一份 SKILL.md，多个主流 Agent 通用
- 🔒 **隐私优先**：所有排盘在本地完成，无需联网；运行产物默认 gitignore

---

## 🚀 安装

### 1. 克隆仓库

```bash
git clone https://github.com/dzcmemory-web/bazi-ziwei-skill.git
```

### 2. 安装算法层依赖

```bash
cd bazi-ziwei-skill/calculator
npm install
```
> 需要 Node.js >= 18。算法层依赖仅一个：`lunar-typescript`（MIT）。

### 3. 注册到你的 Agent

把整个 `bazi-ziwei-skill/` 文件夹放进 Agent 的 skills 目录：

| Agent | skills 目录 |
|---|---|
| Claude Code / Claude Desktop | `~/.claude/skills/bazi-ziwei/` |
| Codex | `~/.codex/skills/bazi-ziwei/` 或项目内 AGENTS.md 引用 |
| Cursor | 项目 `.cursor/` 规则引用 |
| Hermes Agent | `~/.hermes/skills/bazi-ziwei/` |
| OpenClaw | 其 skills 目录 / ClawHub 本地安装 |

Agent 会自动读取 `SKILL.md` 并按需调用。

---

## 📖 使用

装好后，直接对 Agent 说出生时间即可：

```
我是 2000 年 1 月 1 日中午 12 点出生的男生，帮我看下命盘。
```

Agent 会：
1. 问你要哪种分析（八字 / 紫微 / 综合印证）
2. 综合印证时再问要长文还是 HTML 海报
3. 调用算法层排盘 → 加载对应提示词 → 输出分析或渲染海报

详细流程见 [`SKILL.md`](./SKILL.md)，测试方法见 [`TEST-GUIDE.md`](./TEST-GUIDE.md)。

### 命令行直接排盘（不经 Agent）

```bash
cd calculator
# 排盘 → JSON
node dist/run-chart.js --year=2000 --month=1 --day=1 --hour=12 --minute=0 --gender=male > chart.json
# JSON → 可读文本盘
node dist/dump-text.js --input=chart.json --output=chart.txt
# JSON + 分析 JSON + 模板 → HTML 海报
node dist/render.js --chart=chart.json --analysis=analysis.json \
  --template=../templates/report-zonghe-poster.html --output=report.html --currentYear=2026
```

仓库自带一份合成示例（2000-01-01 男，非真人）：
- `examples/sample-chart.json` — 算法层排盘输出
- `examples/sample-chart.txt` — 文墨天机风文本盘
- `examples/sample-analysis.json` — 综合印证分析（示例）
- `examples/sample-report.html` — **综合印证海报成品，下载后用浏览器打开即可预览效果**

---

## 📁 目录结构

```
bazi-ziwei-skill/
├── SKILL.md                       Skill 主入口（Agent 读这个）
├── TEST-GUIDE.md                  测试指南（5 条用户路径）
├── calculator/
│   ├── run-chart.ts               排盘入口：生辰 → JSON
│   ├── dump-text.ts               JSON → 文墨天机风文本盘
│   ├── render.ts                  JSON + 分析 + 模板 → 单文件 HTML
│   ├── yiqi-core/                 排盘核心算法（vendored from Yiqi, MIT）
│   └── bazi-enrich/               格局/旺衰/调候/刑冲合害 补层算法
├── prompts/
│   ├── bazi-prompt.md             八字独立分析（长文）
│   ├── ziwei-prompt.md            紫微独立分析（长文）
│   ├── zonghe-yinzheng-prompt.md  综合印证（长文）
│   └── zonghe-poster.md           综合印证（海报 JSON 输出）
├── templates/
│   └── report-zonghe-poster.html  综合印证海报模板（占位符）
└── examples/
    ├── sample-chart.json          合成示例排盘
    └── sample-chart.txt           合成示例文本盘
```

---

## 🏗️ 工作原理

```
生辰 ──> run-chart.ts ──> chart.json ──> dump-text.ts ──> chart.txt
                          (算法层精准排盘)                 (LLM 友好文本)
                                                              │
                                  ┌───────────────────────────┤
                                  ▼                           ▼
                           长文提示词                    海报提示词
                          (Markdown 散文)              (严格 JSON 输出)
                                                              │
                                                       render.ts + 模板
                                                              ▼
                                                       单文件 HTML 海报
```

**关键设计**：LLM 只负责"分析"，不负责"排盘"和"画 HTML"。排盘交给确定性算法，HTML 视觉交给固定模板，LLM 产出的结构化内容填进模板槽位——三者各司其职，互不污染。

---

## 🙏 致谢

- 排盘核心算法源自 [Yiqi 八字紫微排盘系统](https://github.com/fdxuyq/Yiqi-BaZi-ZiWei)（MIT 协议），详见 [`NOTICE`](./NOTICE)
- 农历换算依赖 [lunar-typescript](https://github.com/6tail/lunar-typescript)（MIT）

---

## 📬 联系 / Contact

问题反馈、合作或交流，欢迎邮件：**dzcmemory@gmail.com**

如果这个项目对你有帮助，欢迎点一个 ⭐ Star 支持。

---

## ⚠️ 免责声明

本项目基于传统八字与紫微斗数理论框架，**仅供文化研究与娱乐参考**，不构成医疗、投资、婚姻、法律等任何决策依据。命运由个人选择与客观环境共同塑造。

---

## 📄 License

[MIT](./LICENSE) © 2026 dzcmemory-web
