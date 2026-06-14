"use strict";
// 天干关系 + 整柱盖头/截脚
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectGanRelations = detectGanRelations;
exports.judgePillars = judgePillars;
const tables_1 = require("./tables");
const GAN_HE_PAIRS = [
    ['甲', '己', '土'], ['乙', '庚', '金'], ['丙', '辛', '水'], ['丁', '壬', '木'], ['戊', '癸', '火']
];
function detectGanRelations(gans) {
    const out = [];
    const pillars = ['年', '月', '日', '时'];
    const list = pillars.map(p => ({ pillar: p, gan: gans[p] }));
    for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
            const a = list[i], b = list[j];
            // 五合
            const he = GAN_HE_PAIRS.find(([x, y]) => (a.gan === x && b.gan === y) || (a.gan === y && b.gan === x));
            if (he) {
                out.push({ type: '天干合', gans: [a.gan, b.gan], pillars: [a.pillar, b.pillar] });
                continue;
            }
            // 相克 (剔除合化情形)
            const rel = (0, tables_1.shengKe)(tables_1.GAN_WUXING[a.gan], tables_1.GAN_WUXING[b.gan]);
            if (rel === '克' || rel === '被克') {
                out.push({ type: '天干相克', gans: [a.gan, b.gan], pillars: [a.pillar, b.pillar] });
            }
        }
    }
    return out;
}
function judgePillars(siZhu) {
    const pillars = ['年', '月', '日', '时'];
    return pillars.map(p => {
        const { gan, zhi } = siZhu[p];
        const ganWx = tables_1.GAN_WUXING[gan];
        const zhiWx = tables_1.ZHI_WUXING[zhi];
        const rel = (0, tables_1.shengKe)(ganWx, zhiWx);
        let verdict;
        if (rel === '克')
            verdict = '盖头';
        else if (rel === '被克')
            verdict = '截脚';
        else if (rel === '生')
            verdict = '天干生地支';
        else if (rel === '被生')
            verdict = '地支生天干';
        else
            verdict = '天地同气';
        return { pillar: p, gan, zhi, verdict };
    });
}
