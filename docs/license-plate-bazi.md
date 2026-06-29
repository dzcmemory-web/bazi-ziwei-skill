# 八字车牌推荐原型

这是一个“传统民俗/娱乐参考”工具原型：输入出生信息和候选车牌，输出每个车牌的评分、推荐等级和解释。它不会宣称科学准确，也不作为实际上牌或购车决策依据。

## 技术方案

本仓库本身是 `SKILL.md` 兼容的 Agent Skill，所以原型优先做成 Skill 扩展。同时新增一个可测试的 Python 模块和 CLI：

- `SKILL.md`：告诉 Agent 什么时候触发车牌选号工作流
- `src/license_plate_bazi/`：确定性评分逻辑
- `config/license_plate_rules.json`：可配置评分规则
- `scripts/license_plate_recommend.py`：无需安装即可本地运行
- `tests/`：单元测试

CLI 会优先尝试调用本仓库的 `calculator/dist/run-chart.js` 完整排盘。如果 Node 依赖不可用，原型会退回到透明标注的简化五行参考，并在输出里提示先运行 `cd calculator && npm install`。

## 安装

无需安装 Python 包即可从仓库根目录运行：

```bash
python3 scripts/license_plate_recommend.py --help
```

这个脚本会自动把 `src/` 加进 Python 搜索路径，所以适合本地原型验证。

也可以从仓库根目录用模块方式运行：

```bash
python3 -m license_plate_bazi.cli --help
```

如果希望在任意目录使用命令 `license-plate-bazi`，先在虚拟环境里做一次可编辑安装：

```bash
python3 -m pip install -e .
```

若要启用主项目完整排盘能力：

```bash
cd calculator
npm install
cd ..
```

如果跳过这一步，CLI 仍会运行，但会明确标注为低置信度简化参考。

## 运行 CLI

```bash
python3 scripts/license_plate_recommend.py \
  --birth-date 1990-05-12 \
  --birth-time 08:30 \
  --gender female \
  --plates 粤B8A68Z 粤B52088 粤B3M96Q
```

出生时间未知：

```bash
python3 scripts/license_plate_recommend.py \
  --birth-date 1990-05-12 \
  --birth-time unknown \
  --gender unknown \
  --plates 粤B8A68Z 粤B52088
```

带当前地区前缀：

```bash
python3 scripts/license_plate_recommend.py \
  --birth-date 1990-05-12 \
  --birth-time 08:30 \
  --gender female \
  --current-prefix 粤B \
  --plates 粤B8A68Z 粤B52088 粤A6688Q
```

## 配置评分规则

编辑 `config/license_plate_rules.json` 可以调整：

- 数字五行映射
- 字母五行映射
- 喜用、补缺、忌神的加减分
- 重复号、连号、回文、168/668/888/520 等组合加分
- 4、14、250、748 等避雷谐音扣分
- 推荐等级阈值

也可以通过 `--rules path/to/rules.json` 传入自定义规则文件。

如果规则文件缺少必要字段，CLI 会报类似 `规则配置 ... 缺少字段：score_weights.bazi_match` 的错误，避免评分时悄悄套用不完整规则。

## 扩展到 Web/API

推荐做法：

1. 保留 `src/license_plate_bazi/scoring.py` 作为核心评分层。
2. 新增 FastAPI 或 Flask 接口，接收出生信息和候选车牌列表。
3. API 内部调用 `build_bazi_profile()` 和 `score_plates()`。
4. 前端只展示 Markdown 或 JSON 结构，不在前端重复写评分规则。
5. 若正式上线，把 Node `calculator` 依赖装好，并把完整排盘失败作为明确错误或降级提示。

## 免责声明

本工具基于传统八字五行、数字/字母民俗映射和车牌易记性规则，仅供文化研究与娱乐参考，不具备科学预测效力，不构成购车、上牌、投资、健康、安全等任何实际决策依据。
