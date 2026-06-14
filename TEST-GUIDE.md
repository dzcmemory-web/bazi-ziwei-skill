# 测试指南

> 在 Claude Code / Claude Desktop / Codex / Cursor / Hermes / OpenClaw 等支持 SKILL.md 的 Agent 中测试本 Skill。
> 本指南使用合成示例生辰 **2000-01-01 12:00 男**（非真人），其完整排盘见 `examples/sample-chart.json` 与 `examples/sample-chart.txt`。

---

## 0. 装好之后先跑 Smoke Test（人工，可选）

确认算法层和依赖正常。在仓库根目录：

```bash
cd calculator
npm install          # 首次使用需要
node dist/run-chart.js --year=2000 --month=1 --day=1 --hour=12 --minute=0 --gender=male > smoke.json
```

**预期**：
- 命令秒级返回
- `smoke.json` 首字符是 `{`（纯 JSON）
- stderr 会输出 `🔍 八字计算结果 - ...` 两行 debug，这是正常的

检查关键字段：
```bash
node -e "const j=require('./smoke.json'); console.log('日柱:', j.bazi.siZhu.day.gan+j.bazi.siZhu.day.zhi, '/ 格局:', j.bazi.enrichment.格局.primary)"
```
**预期输出**：`日柱: 戊午 / 格局: 正财格`

跑通即装配正确。`smoke.json` 内容应与 `examples/sample-chart.json` 完全一致。

> 注意：Agent 装好 Skill 后**不会主动**跑此自检（SKILL.md 明确要求装好不自检，避免浪费 token）。Smoke Test 由你手动执行。

---

## 5 种用户路径速查

| 编号 | 用户选择 | 输出 |
|---|---|---|
| 路径 1 | 八字独立分析 | Markdown 长文 |
| 路径 2 | 紫微独立分析 | Markdown 长文 |
| 路径 3 | 综合印证 + 长文（A） | Markdown 长文 |
| 路径 4 | 综合印证 + 海报（B）⭐ | 单文件 HTML 海报 |
| 路径 5 | 综合印证 + 两种（C） | Markdown + HTML |

---

## 路径 1：八字独立分析（长文）

**测试输入**（发给 Agent）：
```
我是 2000 年 1 月 1 日中午 12 点出生的男生，帮我看下八字。
```

**期望 Agent 做的事**：
1. 触发 Skill，进入决策门，问你要哪种分析（你回"八字"）
2. 跑 `run-chart.ts` → chart.json
3. 跑 `dump-text.ts` → chart.txt
4. 加载 `prompts/bazi-prompt.md`，喂入 chart.txt，输出 Markdown

**验证点**：
- ✅ 标明 "日主：戊土"
- ✅ 提到 "正财格"
- ✅ 提到 "调候用神：丙、甲"
- ✅ 提到 "子午相冲" 或地支关系
- ✅ 末尾有 "仅供文化研究与娱乐参考" 免责声明

**❌ 失败信号**：
- 出现非 "戊" 的日主 → AI 自己排盘了，没用算法层
- 完全没有 "戊 / 正财 / 调候" 字样 → 没读到 chart.txt

---

## 路径 2：紫微独立分析（长文）

**测试输入**：
```
我是 2000 年 1 月 1 日中午 12 点出生的男生，帮我看下紫微。
```

**验证点**：
- ✅ 提到 "命宫在午" 或 "命宫 紫微"
- ✅ 提到生年四化（武曲化禄 / 贪狼化权 / 天梁化科 / 文曲化忌）至少 1-2 个
- ✅ 提到 "土五局"
- ✅ 末尾免责声明

---

## 路径 3：综合印证 + 长文（A）

**测试输入**：
```
我是 2000 年 1 月 1 日中午 12 点出生的男生，请做八字+紫微的综合分析（长文）。
```

**期望**：先跑八字独立 + 紫微独立拿中间报告，再喂 `zonghe-yinzheng-prompt.md`。

**验证点**：
- ✅ 有"主轴印证"段，明说"同向 / 互补 / 矛盾"
- ✅ 至少 1-2 处八字与紫微互相印证或冲突的具体点
- ✅ 给出关键时间窗口
- ✅ 末尾免责声明

**注意**：综合印证输出最长，可能被 Agent 自动截断。如截断，让 Agent 分段输出。

---

## 路径 4：综合印证 + 海报 HTML ⭐ 杀手锏

**测试输入**：
```
我是 2000 年 1 月 1 日中午 12 点出生的男生，请生成综合印证的 HTML 海报。
```

**期望 Agent 做的事**：
1. 跑算法层（run-chart + dump-text）
2. 加载 `prompts/zonghe-poster.md`，喂入 chart.txt
3. LLM 输出**严格 JSON**（不是 markdown 散文）
4. JSON 存为 `analysis.json`
5. 跑渲染脚本：
   ```bash
   cd calculator
   node dist/render.js \
     --chart=chart.json \
     --analysis=analysis.json \
     --template=../templates/report-zonghe-poster.html \
     --output=report.html \
     --currentYear=2026
   ```
6. 告诉你 HTML 路径，你用浏览器打开

**验证点**：
- ✅ HTML 生成（约 45-50 KB）
- ✅ 浏览器打开能看到完整海报：Hero + 紫微盘 + 八字盘 + 命盘核心数据 + 六维交叉对账 + 综合定论
- ✅ 无可见 `{{占位符}}` 残留
- ✅ 紫微 12 宫每宫有星曜，八字四柱含藏干/星运/自坐/纳音
- ✅ 02 阶段印证时间轴有数据（不空白）

**❌ 失败信号**：
- LLM 输出 markdown 包装的 JSON → 渲染前需剥掉，否则 HTML 全是占位符
- HTML 里大量 `-`（兜底字符）→ LLM 的 JSON schema 不完整

**快速验证 LLM 输出 JSON 是否合格**：
```bash
node -e "const j=require('./analysis.json'); console.log('strengths:', j.strengths?.length, '/dim:', Object.keys(j.dim||{}).length, '/nodes:', j.final?.nodes?.length, '（应为 3 / 6 / 5）')"
```

---

## 路径 5：综合印证 + 两种（C）

**测试输入**：
```
我是 2000 年 1 月 1 日中午 12 点出生的男生，请同时给我综合印证的长文版和 HTML 海报。
```

**期望**：路径 3 + 路径 4 都跑。如上下文紧张，先出 HTML 海报（更核心）。

---

## 常见问题排查

| 现象 | 可能原因 | 处理 |
|---|---|---|
| Agent 找不到 Skill | SKILL.md 不在 Agent 扫描路径 | 把整个仓库放进 Agent 的 skills 目录（如 `~/.claude/skills/bazi-ziwei/`） |
| 排盘脚本报错 | 时辰格式错 / 日期超 1900-2100 | 校正输入 |
| `node dist/...` 报找不到模块 | 没装依赖 | `cd calculator && npm install` |
| 改了 .ts 源码后没生效 | dist 是预编译产物 | 重新编译 `npm run build` |
| 渲染 HTML 后全是占位符 | analysis.json 解析失败 | 看 analysis.json 第一字符是不是 `{`，不是就剥掉 markdown 包装 |
| 海报里命主信息错 | LLM 自行排盘没用算法层 | 重跑，强调"必须读 chart.txt 不要自己排" |
| 当前大限算错 | `--currentYear` 没传或传错 | 渲染时加 `--currentYear=<当前年份>` |
| Windows 中文路径/PowerShell 编码错乱 | 平台特性 | 用 git bash / WSL 替代 PowerShell |

---

## 多 Agent 兼容性

本 Skill 遵循 SKILL.md 开放标准，理论兼容：Claude Code / Claude Desktop / Codex CLI / Codex Desktop / Cursor / Gemini CLI / GitHub Copilot / Hermes Agent / OpenClaw 等。

测完一个 Agent 把结果记下来，方便对比。
