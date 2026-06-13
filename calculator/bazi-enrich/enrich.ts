// 八字增强分析主入口 — 给定四柱, 输出格局/旺衰/刑冲合害/调候/自坐 等所有 Yiqi 未算的字段

import { Tiangan, Dizhi, getChangSheng } from './tables';
import { detectZhiRelations } from './zhi-relations';
import { detectGanRelations, judgePillars } from './gan-relations';
import { countWuXing, wuXingMonthStatus } from './wu-xing';
import { judgeWangShuai } from './wang-shuai';
import { judgeGeJu } from './ge-ju';
import { getTiaoHou } from './tiao-hou';

type Pillar = '年'|'月'|'日'|'时';
type GanZhi = {gan: Tiangan, zhi: Dizhi};

export type BaziEnrichment = {
  自坐: Record<Pillar, string>;           // 每柱 干 vs 自身支 的长生
  五行旺相: Record<string, '旺'|'相'|'休'|'囚'|'死'>;
  五行统计: ReturnType<typeof countWuXing>;
  调候用神: string[];
  格局: ReturnType<typeof judgeGeJu>;
  旺衰: ReturnType<typeof judgeWangShuai>;
  天干关系: ReturnType<typeof detectGanRelations>;
  地支关系: ReturnType<typeof detectZhiRelations>;
  整柱: ReturnType<typeof judgePillars>;
};

export function enrichBazi(siZhu: Record<Pillar, GanZhi>): BaziEnrichment {
  const dm = siZhu.日.gan;
  const monthZhi = siZhu.月.zhi;

  // 自坐 — 每柱干在自身支的长生位
  const ziZuo: Record<Pillar, string> = {} as any;
  for (const p of ['年','月','日','时'] as Pillar[]) {
    ziZuo[p] = getChangSheng(siZhu[p].gan, siZhu[p].zhi);
  }

  return {
    自坐: ziZuo,
    五行旺相: wuXingMonthStatus(monthZhi),
    五行统计: countWuXing(siZhu, dm),
    调候用神: getTiaoHou(dm, monthZhi),
    格局: judgeGeJu(siZhu),
    旺衰: judgeWangShuai(siZhu),
    天干关系: detectGanRelations({
      年: siZhu.年.gan, 月: siZhu.月.gan, 日: siZhu.日.gan, 时: siZhu.时.gan
    }),
    地支关系: detectZhiRelations({
      年: siZhu.年.zhi, 月: siZhu.月.zhi, 日: siZhu.日.zhi, 时: siZhu.时.zhi
    }),
    整柱: judgePillars(siZhu)
  };
}
