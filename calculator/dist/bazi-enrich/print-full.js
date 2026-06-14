"use strict";
// 综合输出: 八字 enrich + 紫微(从已有 fixture)
// 用法: npx tsx print-full.ts <caseId>  (caseId: A/C/D/E/F/G)
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const enrich_1 = require("./enrich");
const caseId = process.argv[2] || 'A';
const fixturePath = path.resolve(__dirname, `../../fixtures/case-${caseId}.json`);
const fx = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
const bazi = fx.bazi;
const ziwei = fx.ziwei;
const siZhu = {
    年: bazi.siZhu.year,
    月: bazi.siZhu.month,
    日: bazi.siZhu.day,
    时: bazi.siZhu.hour,
};
const enrich = (0, enrich_1.enrichBazi)(siZhu);
console.log(`\n${'='.repeat(60)}`);
console.log(`Case ${caseId}: ${bazi.birthInfo.year}-${bazi.birthInfo.month}-${bazi.birthInfo.day} ${bazi.birthInfo.hour}:${String(bazi.birthInfo.minute).padStart(2, '0')} ${bazi.birthInfo.gender === 'male' ? '男' : '女'}`);
console.log('='.repeat(60));
// ========== 八字部分 ==========
console.log('\n┌─────────── 八字 ───────────┐');
console.log(`四柱:  ${siZhu.年.gan}${siZhu.年.zhi}  ${siZhu.月.gan}${siZhu.月.zhi}  ${siZhu.日.gan}${siZhu.日.zhi}  ${siZhu.时.gan}${siZhu.时.zhi}`);
console.log(`日主:  ${bazi.dayMaster}`);
console.log(`十神:  年${bazi.shiShen.year} 月${bazi.shiShen.month} 时${bazi.shiShen.hour}`);
console.log(`星运:  年${bazi.zhangSheng.year} 月${bazi.zhangSheng.month} 日${bazi.zhangSheng.day} 时${bazi.zhangSheng.hour}  (Yiqi)`);
console.log(`自坐:  年${enrich.自坐.年} 月${enrich.自坐.月} 日${enrich.自坐.日} 时${enrich.自坐.时}  (新增)`);
console.log(`纳音:  年${bazi.naYin.year} 月${bazi.naYin.month} 日${bazi.naYin.day} 时${bazi.naYin.hour}`);
console.log(`起运:  ${bazi.dayunStart}岁`);
console.log('\n[ 新增字段(enrichBazi) ]');
console.log(`月令五行旺相: ${Object.entries(enrich.五行旺相).map(([k, v]) => `${k}${v}`).join(' ')}`);
const wx = enrich.五行统计;
console.log(`五行surface:  ${Object.entries(wx.surface).map(([k, v]) => `${k}${v}`).join(' ')}  → 最旺${wx.strongest.join('/')}  缺${wx.missing.join('/') || '无'}`);
console.log(`含藏干:       ${Object.entries(wx.withCangGan).map(([k, v]) => `${k}${v.toFixed(1)}`).join(' ')}`);
console.log(`十神归类:     ${Object.entries(wx.shiShenGroups).map(([wx, info]) => `${info.十神类}(${wx}${info.实例数})`).join(' ')}`);
console.log(`\n调候用神:     ${enrich.调候用神.join('、')}`);
console.log(`\n格局:         ${enrich.格局.primary}`);
console.log(`  依据:       ${enrich.格局.basis}`);
console.log(`  透干:       ${enrich.格局.透干.join('、') || '无'}`);
console.log(`  置信:       ${enrich.格局.confidence}`);
if (enrich.格局.notes.length)
    console.log(`  备注:       ${enrich.格局.notes.join('; ')}`);
console.log(`\n旺衰:         ${enrich.旺衰.verdict}  (score=${enrich.旺衰.score}, confidence=${enrich.旺衰.confidence})`);
console.log(`  得令${enrich.旺衰.breakdown.得令} | 长生${enrich.旺衰.breakdown.长生} | 得地${enrich.旺衰.breakdown.得地} | 得势${enrich.旺衰.breakdown.得势}`);
console.log(`  细节:`);
for (const d of enrich.旺衰.breakdown.details)
    console.log(`    · ${d}`);
console.log('\n天干关系:');
if (enrich.天干关系.length === 0)
    console.log('  无');
for (const r of enrich.天干关系)
    console.log(`  ${r.type}  ${r.gans.join('')}  (${r.pillars.join('-')})`);
console.log('\n地支关系:');
if (enrich.地支关系.length === 0)
    console.log('  无');
for (const r of enrich.地支关系)
    console.log(`  ${r.type}  ${r.zhi.join('')}  (${r.pillars.join('-')})  ${r.detail || ''}`);
console.log('\n整柱判定:');
for (const v of enrich.整柱)
    console.log(`  ${v.pillar}柱 ${v.gan}${v.zhi}: ${v.verdict}`);
// 大运(取前5步)
console.log('\n前5大运:');
for (const d of bazi.dayun.slice(0, 5)) {
    console.log(`  ${d.ganZhi.gan}${d.ganZhi.zhi}  ${d.startYear}-${d.endYear} (${d.startAge}岁起) 干${d.ganShiShen} 支${d.zhiShiShen}`);
}
// ========== 紫微部分 ==========
console.log('\n┌─────────── 紫微斗数 ───────────┐');
console.log(`阴阳: ${ziwei.yinYang} | 五行局: ${ziwei.wuXingJu.name}`);
const mingGong = ziwei.gongs.find((g) => g.gong === '命宫');
// shenGongIndex 是地支序号(子=0...亥=11),不是 gongs 数组下标
const DIZHI_ORDER = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const shenGongZhi = DIZHI_ORDER[ziwei.shenGongIndex];
console.log(`命宫: ${mingGong.dizhi}(${mingGong.tiangan})  身宫: ${shenGongZhi}`);
console.log('\n十二宫详情:');
const gongOrder = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '官禄', '田宅', '福德', '父母'];
for (const gn of gongOrder) {
    const g = ziwei.gongs.find((x) => x.gong === gn);
    if (!g)
        continue;
    const stars = [
        ...(g.mainStars || []).map((s) => `[${s}]`),
        ...(g.auxStars || []),
    ].join(' ');
    const sihua = (g.sihua || []).map((s) => `${s.star}${s.hua}`).join(' ');
    const dx = g.daXian ? ` 大限${g.daXian.startAge}-${g.daXian.endAge}${g.daXian.isCurrent ? '★' : ''}` : '';
    console.log(`  ${gn}(${g.dizhi}${g.tiangan})  ${stars}${sihua ? '  ' + sihua : ''}${dx}`);
}
