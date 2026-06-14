"use strict";
// 排盘单一入口 — 输入生辰, 输出完整 JSON (Yiqi createChart + enrichBazi)
//
// 用法:
//   npx tsx run-chart.ts --year=2000 --month=1 --day=1 --hour=12 --minute=0 --gender=male
//   可选: --isLunar=true --timeZone=8 --output=path/to/file.json
//
// 不指定 --output 则打印到 stdout
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./yiqi-core/index");
const bazi_1 = require("./yiqi-core/bazi");
const enrich_1 = require("./bazi-enrich/enrich");
const fs = __importStar(require("fs"));
function parseArgs() {
    const args = {};
    for (const a of process.argv.slice(2)) {
        const m = a.match(/^--([^=]+)=(.*)$/);
        if (m)
            args[m[1]] = m[2];
    }
    return args;
}
function main() {
    const args = parseArgs();
    const required = ['year', 'month', 'day', 'hour', 'minute', 'gender'];
    for (const k of required) {
        if (!args[k]) {
            console.error(`Missing required arg: --${k}=...`);
            console.error('Usage: npx tsx run-chart.ts --year=2000 --month=1 --day=1 --hour=12 --minute=0 --gender=male');
            process.exit(1);
        }
    }
    const gender = args.gender === 'male' || args.gender === 'female' ? args.gender : (args.gender === '男' ? 'male' : 'female');
    const birthInfo = {
        year: +args.year,
        month: +args.month,
        day: +args.day,
        hour: +args.hour,
        minute: +args.minute,
        isLunar: args.isLunar === 'true',
        gender: gender,
        timeZone: args.timeZone ? +args.timeZone : 8,
    };
    // Step 1: Yiqi 算法层 — 四柱+紫微+大运+流年
    const chart = (0, index_1.createChart)(birthInfo);
    // 附加地支藏干 (含十神)
    const dm = chart.bazi.dayMaster;
    const z = chart.bazi.siZhu;
    chart.bazi.cangGan = {
        year: (0, bazi_1.getZhiCangGanFull)(z.year.zhi, dm),
        month: (0, bazi_1.getZhiCangGanFull)(z.month.zhi, dm),
        day: (0, bazi_1.getZhiCangGanFull)(z.day.zhi, dm),
        hour: (0, bazi_1.getZhiCangGanFull)(z.hour.zhi, dm),
    };
    // 补 endAge 字段 (Yiqi 只给了 startAge/endYear, OpenClaw 等下游脚本会查 endAge)
    if (chart.bazi.dayun && Array.isArray(chart.bazi.dayun)) {
        for (const d of chart.bazi.dayun) {
            if (d.startAge !== undefined && d.endAge === undefined) {
                d.endAge = d.startAge + 9;
            }
        }
    }
    // Step 2: enrichBazi 补层 — 格局/旺衰/调候/刑冲合害/盖头
    const siZhuForEnrich = {
        '年': chart.bazi.siZhu.year,
        '月': chart.bazi.siZhu.month,
        '日': chart.bazi.siZhu.day,
        '时': chart.bazi.siZhu.hour,
    };
    chart.bazi.enrichment = (0, enrich_1.enrichBazi)(siZhuForEnrich);
    const json = JSON.stringify(chart, null, 2);
    if (args.output) {
        fs.writeFileSync(args.output, json, 'utf-8');
        console.error(`Chart written to ${args.output}`);
    }
    else {
        process.stdout.write(json);
    }
}
main();
