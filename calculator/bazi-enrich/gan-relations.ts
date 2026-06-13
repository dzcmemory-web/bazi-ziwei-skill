// 天干关系 + 整柱盖头/截脚

import { Tiangan, GAN_WUXING, ZHI_WUXING, Dizhi, shengKe } from './tables';

export type GanRelation = {
  type: '天干合'|'天干相克'|'天干同';
  gans: Tiangan[];
  pillars: string[];
};

const GAN_HE_PAIRS: Array<[Tiangan, Tiangan, string]> = [
  ['甲','己','土'],['乙','庚','金'],['丙','辛','水'],['丁','壬','木'],['戊','癸','火']
];

type Pillar = '年'|'月'|'日'|'时';

export function detectGanRelations(gans: Record<Pillar, Tiangan>): GanRelation[] {
  const out: GanRelation[] = [];
  const pillars: Pillar[] = ['年','月','日','时'];
  const list = pillars.map(p => ({pillar: p, gan: gans[p]}));
  for (let i = 0; i < list.length; i++) {
    for (let j = i+1; j < list.length; j++) {
      const a = list[i], b = list[j];
      // 五合
      const he = GAN_HE_PAIRS.find(([x,y]) => (a.gan===x && b.gan===y) || (a.gan===y && b.gan===x));
      if (he) {
        out.push({type:'天干合', gans:[a.gan, b.gan], pillars:[a.pillar, b.pillar]});
        continue;
      }
      // 相克 (剔除合化情形)
      const rel = shengKe(GAN_WUXING[a.gan], GAN_WUXING[b.gan]);
      if (rel === '克' || rel === '被克') {
        out.push({type:'天干相克', gans:[a.gan, b.gan], pillars:[a.pillar, b.pillar]});
      }
    }
  }
  return out;
}

// 整柱盖头/截脚
// 盖头: 天干克地支(以五行论)
// 截脚: 地支克天干
export type PillarVerdict = {
  pillar: Pillar;
  gan: Tiangan;
  zhi: Dizhi;
  verdict: '盖头'|'截脚'|'天干生地支'|'地支生天干'|'天地同气'|'天地异气无生克';
};

export function judgePillars(siZhu: Record<Pillar, {gan: Tiangan, zhi: Dizhi}>): PillarVerdict[] {
  const pillars: Pillar[] = ['年','月','日','时'];
  return pillars.map(p => {
    const {gan, zhi} = siZhu[p];
    const ganWx = GAN_WUXING[gan];
    const zhiWx = ZHI_WUXING[zhi];
    const rel = shengKe(ganWx, zhiWx);
    let verdict: PillarVerdict['verdict'];
    if (rel === '克') verdict = '盖头';
    else if (rel === '被克') verdict = '截脚';
    else if (rel === '生') verdict = '天干生地支';
    else if (rel === '被生') verdict = '地支生天干';
    else verdict = '天地同气';
    return {pillar: p, gan, zhi, verdict};
  });
}
