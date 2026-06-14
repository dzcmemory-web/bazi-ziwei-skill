"use strict";
// Case B 回归测试 — 对齐用户那段八字提示词里的样例数据
// 期望:
//  自坐: 衰/胎/胎/帝旺
//  五行旺相: 水旺/木相/金休/土囚/火死
//  最旺五行: 土3
//  缺失: 木0
//  调候: 甲、丙
//  格局: 偏财格
//  旺衰: 偏弱
//  天干: 丁辛相克
//  地支: 亥未拱合卯、巳未拱会(午)、巳亥相冲、子未相害、子巳暗合
//  整柱: 己亥盖头、戊子盖头
Object.defineProperty(exports, "__esModule", { value: true });
const enrich_1 = require("./enrich");
const siZhu = {
    年: { gan: '辛', zhi: '未' },
    月: { gan: '己', zhi: '亥' },
    日: { gan: '戊', zhi: '子' },
    时: { gan: '丁', zhi: '巳' }
};
const result = (0, enrich_1.enrichBazi)(siZhu);
console.log('========== Case B 回归 ==========');
console.log('\n【自坐】期望: 年衰/月胎/日胎/时帝旺');
console.log('实际:', result.自坐);
console.log('\n【五行旺相】期望: 水旺木相金休土囚火死');
console.log('实际:', result.五行旺相);
console.log('\n【五行统计 surface】期望: 土3, 木0, 火2, 金1, 水2');
console.log('实际:', result.五行统计.surface);
console.log('最旺:', result.五行统计.strongest, '缺失:', result.五行统计.missing);
console.log('\n【调候用神】期望: 甲, 丙');
console.log('实际:', result.调候用神);
console.log('\n【格局】期望: 偏财格');
console.log('实际:', result.格局);
console.log('\n【旺衰】期望: 偏弱');
console.log('实际:', result.旺衰);
console.log('\n【天干关系】期望: 丁辛相克');
console.log('实际:', result.天干关系);
console.log('\n【地支关系】期望: 亥未拱合卯, 巳未拱会(午), 巳亥相冲, 子未相害, 子巳暗合');
console.log('实际:');
for (const r of result.地支关系) {
    console.log(`  ${r.type} ${r.zhi.join('')} (${r.pillars.join('-')}) ${r.detail || ''}`);
}
console.log('\n【整柱】期望: 己亥盖头, 戊子盖头');
console.log('实际:');
for (const v of result.整柱) {
    console.log(`  ${v.pillar}柱 ${v.gan}${v.zhi}: ${v.verdict}`);
}
console.log('\n========== 完整 JSON ==========');
console.log(JSON.stringify(result, null, 2));
