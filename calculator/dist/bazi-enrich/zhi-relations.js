"use strict";
// 地支关系检测 — 刑冲合害、三合三会、暗合、拱合拱会
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectZhiRelations = detectZhiRelations;
const tables_1 = require("./tables");
// 六冲
const LIU_CHONG = [
    ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']
];
// 六合
const LIU_HE = [
    ['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未']
];
// 三合局 (申子辰水 / 亥卯未木 / 寅午戌火 / 巳酉丑金)
const SAN_HE = [
    { zhi: ['申', '子', '辰'], wuxing: '水' },
    { zhi: ['亥', '卯', '未'], wuxing: '木' },
    { zhi: ['寅', '午', '戌'], wuxing: '火' },
    { zhi: ['巳', '酉', '丑'], wuxing: '金' }
];
// 三会方 (寅卯辰东方木 / 巳午未南方火 / 申酉戌西方金 / 亥子丑北方水)
const SAN_HUI = [
    { zhi: ['寅', '卯', '辰'], wuxing: '木' },
    { zhi: ['巳', '午', '未'], wuxing: '火' },
    { zhi: ['申', '酉', '戌'], wuxing: '金' },
    { zhi: ['亥', '子', '丑'], wuxing: '水' }
];
// 相刑 (无礼之刑 子卯; 恃势之刑 寅巳申; 无恩之刑 丑戌未)
const XIANG_XING = [
    { zhi: ['子', '卯'], name: '无礼之刑' },
    { zhi: ['寅', '巳', '申'], name: '恃势之刑' },
    { zhi: ['丑', '戌', '未'], name: '无恩之刑' }
];
const ZI_XING = ['辰', '午', '酉', '亥']; // 自刑
// 六害
const LIU_HAI = [
    ['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌']
];
// 暗合 — 地支藏干之间相合
// 天干五合: 甲己 乙庚 丙辛 丁壬 戊癸
const GAN_HE = {
    甲: '己', 己: '甲', 乙: '庚', 庚: '乙', 丙: '辛', 辛: '丙', 丁: '壬', 壬: '丁', 戊: '癸', 癸: '戊'
};
function detectZhiRelations(zhis) {
    const out = [];
    const pillars = ['年', '月', '日', '时'];
    const list = pillars.map(p => ({ pillar: p, zhi: zhis[p] }));
    // 两两组合
    const pairs = [];
    for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
            pairs.push([list[i], list[j]]);
        }
    }
    // 六冲
    for (const [a, b] of pairs) {
        for (const [x, y] of LIU_CHONG) {
            if ((a.zhi === x && b.zhi === y) || (a.zhi === y && b.zhi === x)) {
                out.push({ type: '六冲', zhi: [a.zhi, b.zhi], pillars: [a.pillar, b.pillar] });
            }
        }
    }
    // 六合
    for (const [a, b] of pairs) {
        for (const [x, y] of LIU_HE) {
            if ((a.zhi === x && b.zhi === y) || (a.zhi === y && b.zhi === x)) {
                out.push({ type: '六合', zhi: [a.zhi, b.zhi], pillars: [a.pillar, b.pillar] });
            }
        }
    }
    // 六害
    for (const [a, b] of pairs) {
        for (const [x, y] of LIU_HAI) {
            if ((a.zhi === x && b.zhi === y) || (a.zhi === y && b.zhi === x)) {
                out.push({ type: '六害', zhi: [a.zhi, b.zhi], pillars: [a.pillar, b.pillar] });
            }
        }
    }
    // 相刑
    for (const xing of XIANG_XING) {
        const matches = list.filter(p => xing.zhi.includes(p.zhi));
        if (xing.zhi.length === 2) {
            // 子卯刑：要两个都在
            const distinct = new Set(matches.map(m => m.zhi));
            if (distinct.size === 2) {
                out.push({ type: '相刑', zhi: [...distinct], pillars: matches.map(m => m.pillar), detail: xing.name });
            }
        }
        else {
            // 三刑：两个就构成半刑(实际三刑要全)
            const distinct = new Set(matches.map(m => m.zhi));
            if (distinct.size >= 2) {
                out.push({ type: '相刑', zhi: [...distinct], pillars: matches.map(m => m.pillar), detail: xing.name + (distinct.size === 3 ? '(全)' : '(半)') });
            }
        }
    }
    // 自刑
    for (const zx of ZI_XING) {
        const matches = list.filter(p => p.zhi === zx);
        if (matches.length >= 2) {
            out.push({ type: '自刑', zhi: [zx, zx], pillars: matches.map(m => m.pillar) });
        }
    }
    // 三合 / 三会 / 半合 / 拱合 / 拱会
    for (const sh of SAN_HE) {
        const present = list.filter(p => sh.zhi.includes(p.zhi));
        const distinctZhi = [...new Set(present.map(p => p.zhi))];
        if (distinctZhi.length === 3) {
            out.push({ type: '三合', zhi: distinctZhi, pillars: present.map(p => p.pillar), detail: `三合${sh.wuxing}局` });
        }
        else if (distinctZhi.length === 2) {
            // 缺一支 → 拱合
            const missing = sh.zhi.find(z => !distinctZhi.includes(z));
            out.push({ type: '拱合', zhi: distinctZhi, pillars: present.map(p => p.pillar), detail: `拱合${missing}(${sh.wuxing}局)` });
        }
    }
    for (const sh of SAN_HUI) {
        const present = list.filter(p => sh.zhi.includes(p.zhi));
        const distinctZhi = [...new Set(present.map(p => p.zhi))];
        if (distinctZhi.length === 3) {
            out.push({ type: '三会', zhi: distinctZhi, pillars: present.map(p => p.pillar), detail: `三会${sh.wuxing}方` });
        }
        else if (distinctZhi.length === 2) {
            const missing = sh.zhi.find(z => !distinctZhi.includes(z));
            out.push({ type: '拱会', zhi: distinctZhi, pillars: present.map(p => p.pillar), detail: `拱会${missing}(${sh.wuxing}方)` });
        }
    }
    // 暗合 — 地支藏干相合
    // 规则: 仅在该地支对没有其他显式关系(六冲/六合/六害/三合/三会/拱合/拱会/相刑)时才报暗合
    const explicitTypes = ['六冲', '六合', '六害', '三合', '三会', '拱合', '拱会', '相刑', '自刑'];
    function hasExplicit(za, zb) {
        return out.some(r => explicitTypes.includes(r.type) &&
            r.zhi.includes(za) && r.zhi.includes(zb));
    }
    for (const [a, b] of pairs) {
        if (a.zhi === b.zhi)
            continue;
        if (hasExplicit(a.zhi, b.zhi))
            continue;
        const aGans = tables_1.ZHI_CANG_GAN[a.zhi].map(c => c.gan);
        const bGans = tables_1.ZHI_CANG_GAN[b.zhi].map(c => c.gan);
        const hits = [];
        for (const ag of aGans) {
            for (const bg of bGans) {
                if (GAN_HE[ag] === bg) {
                    hits.push(`${ag}${bg}合`);
                }
            }
        }
        if (hits.length > 0) {
            out.push({ type: '暗合', zhi: [a.zhi, b.zhi], pillars: [a.pillar, b.pillar], detail: hits.join('、') });
        }
    }
    return out;
}
