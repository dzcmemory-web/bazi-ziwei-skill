"use strict";
// 五行统计 + 旺相休囚死
Object.defineProperty(exports, "__esModule", { value: true });
exports.countWuXing = countWuXing;
exports.wuXingMonthStatus = wuXingMonthStatus;
const tables_1 = require("./tables");
function countWuXing(siZhu, dayMaster) {
    const allWx = ['木', '火', '土', '金', '水'];
    const surface = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    const withCangGan = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    const pillars = ['年', '月', '日', '时'];
    for (const p of pillars) {
        const { gan, zhi } = siZhu[p];
        surface[tables_1.GAN_WUXING[gan]] += 1;
        surface[tables_1.ZHI_WUXING[zhi]] += 1;
        withCangGan[tables_1.GAN_WUXING[gan]] += 1;
        for (const cg of tables_1.ZHI_CANG_GAN[zhi]) {
            const weight = cg.role === '本气' ? 1 : cg.role === '中气' ? 0.5 : 0.3;
            withCangGan[tables_1.GAN_WUXING[cg.gan]] += weight;
        }
    }
    const missing = allWx.filter(w => surface[w] === 0);
    const maxCount = Math.max(...allWx.map(w => surface[w]));
    const strongest = allWx.filter(w => surface[w] === maxCount);
    // 每个五行映射到日干视角的十神类
    const shiShenGroups = {};
    const repGanByWx = { 木: '甲', 火: '丙', 土: '戊', 金: '庚', 水: '壬' };
    for (const wx of allWx) {
        const ss = (0, tables_1.getShiShen)(dayMaster, repGanByWx[wx]);
        // 归类: 比劫/食伤/财/官杀/印
        let group;
        if (ss === '比肩' || ss === '劫财')
            group = '比劫';
        else if (ss === '食神' || ss === '伤官')
            group = '食伤';
        else if (ss === '偏财' || ss === '正财')
            group = '财';
        else if (ss === '七杀' || ss === '正官')
            group = '官杀';
        else
            group = '印';
        shiShenGroups[wx] = { 十神类: group, 实例数: surface[wx] };
    }
    return { surface, withCangGan, missing, strongest, shiShenGroups };
}
function wuXingMonthStatus(monthZhi) {
    return (0, tables_1.getWuXingMonthStatus)(monthZhi);
}
