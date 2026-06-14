"use strict";
// 旺衰判定 — 得令(月令) + 长生修正 + 得地(余三支) + 得势(余三干)
Object.defineProperty(exports, "__esModule", { value: true });
exports.judgeWangShuai = judgeWangShuai;
const tables_1 = require("./tables");
// 月令(月支本气)对日干的关系打分
function scoreMonthOrder(dayMaster, monthZhi) {
    const cangGan = tables_1.ZHI_CANG_GAN[monthZhi];
    const benqi = cangGan[0].gan;
    const ss = (0, tables_1.getShiShen)(dayMaster, benqi);
    // 余气是否含同行 / 印
    const yuqi = cangGan.slice(1);
    let extra = 0;
    let extraDesc = [];
    for (const cg of yuqi) {
        const ssY = (0, tables_1.getShiShen)(dayMaster, cg.gan);
        if (ssY === '比肩' || ssY === '劫财') {
            extra += 1;
            extraDesc.push(`月余气${cg.gan}比劫+1`);
        }
        else if (ssY === '正印' || ssY === '偏印') {
            extra += 0.7;
            extraDesc.push(`月余气${cg.gan}印+0.7`);
        }
    }
    let base = 0;
    let baseDesc = '';
    switch (ss) {
        case '比肩':
        case '劫财':
            base = 5;
            baseDesc = `月支本气${benqi}=${ss}(建禄/月刃) +5`;
            break;
        case '正印':
        case '偏印':
            base = 3;
            baseDesc = `月支本气${benqi}=${ss} +3`;
            break;
        case '食神':
        case '伤官':
            base = -3;
            baseDesc = `月支本气${benqi}=${ss} -3`;
            break;
        case '正官':
        case '七杀':
            base = -4;
            baseDesc = `月支本气${benqi}=${ss} -4`;
            break;
        case '偏财':
        case '正财':
            base = -5;
            baseDesc = `月支本气${benqi}=${ss} -5`;
            break;
    }
    return {
        score: base + extra,
        desc: [baseDesc, ...extraDesc].join('; ')
    };
}
// 日干在月支的长生位修正
function scoreChangSheng(dayMaster, monthZhi) {
    const cs = (0, tables_1.getChangSheng)(dayMaster, monthZhi);
    let s = 0;
    if (cs === '长生' || cs === '帝旺')
        s = 2;
    else if (cs === '临官' || cs === '冠带')
        s = 1;
    else if (cs === '沐浴' || cs === '衰')
        s = 0;
    else if (cs === '病' || cs === '死')
        s = -1;
    else
        s = -3; // 墓/绝/胎/养
    return { score: s, desc: `日主${dayMaster}在月支${monthZhi}为${cs} (${s >= 0 ? '+' : ''}${s})` };
}
// 得地: 年/日/时三支查同行/印的根
function scoreGround(dayMaster, siZhu) {
    const desc = [];
    let total = 0;
    for (const p of ['年', '日', '时']) {
        const zhi = siZhu[p].zhi;
        const cangGan = tables_1.ZHI_CANG_GAN[zhi];
        for (const cg of cangGan) {
            const ss = (0, tables_1.getShiShen)(dayMaster, cg.gan);
            if (ss === '比肩' || ss === '劫财') {
                const v = cg.role === '本气' ? 2 : cg.role === '中气' ? 0.8 : 0.5;
                total += v;
                desc.push(`${p}支${zhi}藏${cg.gan}(${ss}, ${cg.role}) +${v}`);
            }
            else if (ss === '正印' || ss === '偏印') {
                const v = cg.role === '本气' ? 1 : cg.role === '中气' ? 0.5 : 0.3;
                total += v;
                desc.push(`${p}支${zhi}藏${cg.gan}(${ss}, ${cg.role}) +${v}`);
            }
        }
    }
    return { score: total, desc };
}
// 得势: 年/月/时干
function scoreStems(dayMaster, siZhu) {
    const desc = [];
    let total = 0;
    for (const p of ['年', '月', '时']) {
        const gan = siZhu[p].gan;
        const ss = (0, tables_1.getShiShen)(dayMaster, gan);
        let v = 0;
        if (ss === '比肩' || ss === '劫财')
            v = 1;
        else if (ss === '正印' || ss === '偏印')
            v = 0.7;
        else if (ss === '食神' || ss === '伤官')
            v = -0.5;
        else if (ss === '正财' || ss === '偏财')
            v = -1;
        else if (ss === '正官' || ss === '七杀')
            v = -1.5;
        total += v;
        desc.push(`${p}干${gan}(${ss}) ${v >= 0 ? '+' : ''}${v}`);
    }
    return { score: total, desc };
}
function judgeWangShuai(siZhu) {
    const dm = siZhu.日.gan;
    const monthZhi = siZhu.月.zhi;
    const month = scoreMonthOrder(dm, monthZhi);
    const cs = scoreChangSheng(dm, monthZhi);
    const ground = scoreGround(dm, siZhu);
    const stems = scoreStems(dm, siZhu);
    const score = +(month.score + cs.score + ground.score + stems.score).toFixed(2);
    // 阈值不对称: 月令对负向影响更直接,偏弱区门槛略宽
    let verdict;
    if (score >= 8)
        verdict = '极旺(可能从强)';
    else if (score >= 3)
        verdict = '偏旺';
    else if (score > -2.5)
        verdict = '中和';
    else if (score > -8)
        verdict = '偏弱';
    else
        verdict = '极弱(可能从弱)';
    // 置信度: 越靠近阈值越低
    const dist = Math.min(Math.abs(score - 3), Math.abs(score - (-2.5)), Math.abs(score - 8), Math.abs(score - (-8)));
    let confidence;
    if (dist > 2)
        confidence = '高';
    else if (dist > 0.8)
        confidence = '中';
    else
        confidence = '低';
    return {
        score,
        verdict,
        confidence,
        breakdown: {
            得令: +month.score.toFixed(2),
            长生: cs.score,
            得地: +ground.score.toFixed(2),
            得势: +stems.score.toFixed(2),
            details: [month.desc, cs.desc, ...ground.desc, ...stems.desc]
        }
    };
}
