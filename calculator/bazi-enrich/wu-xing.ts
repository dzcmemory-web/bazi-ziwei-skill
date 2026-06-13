// 五行统计 + 旺相休囚死

import { Tiangan, Dizhi, WuXing, GAN_WUXING, ZHI_WUXING, ZHI_CANG_GAN, getWuXingMonthStatus, getShiShen, ShiShen } from './tables';

type Pillar = '年'|'月'|'日'|'时';

export type WuXingCount = {
  // 不算藏干 (只数天干+地支本气? — 按提示词"不算藏干"理解为干支字面五行)
  surface: Record<WuXing, number>;
  // 算藏干 (本气1分,中气0.5,余气0.3)
  withCangGan: Record<WuXing, number>;
  // 哪些五行缺失 (surface 计法)
  missing: WuXing[];
  // 最旺五行 (surface 计法)
  strongest: WuXing[];
  // 转十神: 日干视角下五行对应的十神类别
  shiShenGroups: Record<WuXing, {十神类: string, 实例数: number}>;
};

export function countWuXing(
  siZhu: Record<Pillar, {gan: Tiangan, zhi: Dizhi}>,
  dayMaster: Tiangan
): WuXingCount {
  const allWx: WuXing[] = ['木','火','土','金','水'];
  const surface: Record<WuXing, number> = {木:0,火:0,土:0,金:0,水:0};
  const withCangGan: Record<WuXing, number> = {木:0,火:0,土:0,金:0,水:0};
  const pillars: Pillar[] = ['年','月','日','时'];
  for (const p of pillars) {
    const {gan, zhi} = siZhu[p];
    surface[GAN_WUXING[gan]] += 1;
    surface[ZHI_WUXING[zhi]] += 1;
    withCangGan[GAN_WUXING[gan]] += 1;
    for (const cg of ZHI_CANG_GAN[zhi]) {
      const weight = cg.role === '本气' ? 1 : cg.role === '中气' ? 0.5 : 0.3;
      withCangGan[GAN_WUXING[cg.gan]] += weight;
    }
  }
  const missing = allWx.filter(w => surface[w] === 0);
  const maxCount = Math.max(...allWx.map(w => surface[w]));
  const strongest = allWx.filter(w => surface[w] === maxCount);

  // 每个五行映射到日干视角的十神类
  const shiShenGroups: Record<WuXing, {十神类: string, 实例数: number}> = {} as any;
  const repGanByWx: Record<WuXing, Tiangan> = {木:'甲',火:'丙',土:'戊',金:'庚',水:'壬'};
  for (const wx of allWx) {
    const ss = getShiShen(dayMaster, repGanByWx[wx]);
    // 归类: 比劫/食伤/财/官杀/印
    let group: string;
    if (ss === '比肩' || ss === '劫财') group = '比劫';
    else if (ss === '食神' || ss === '伤官') group = '食伤';
    else if (ss === '偏财' || ss === '正财') group = '财';
    else if (ss === '七杀' || ss === '正官') group = '官杀';
    else group = '印';
    shiShenGroups[wx] = {十神类: group, 实例数: surface[wx]};
  }

  return {surface, withCangGan, missing, strongest, shiShenGroups};
}

export function wuXingMonthStatus(monthZhi: Dizhi) {
  return getWuXingMonthStatus(monthZhi);
}
