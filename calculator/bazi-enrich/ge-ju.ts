// 格局判定 — 普通八格 + 建禄/月刃 + 特殊格局提示

import { Tiangan, Dizhi, GAN_YINYANG, ZHI_CANG_GAN, getShiShen, getChangSheng, ShiShen } from './tables';

type Pillar = '年'|'月'|'日'|'时';

export type GeJuResult = {
  primary: string;     // 主格局
  basis: string;       // 立格依据
  透干: Tiangan[];     // 月令藏干中透出天干的列表
  confidence: '高'|'中'|'低';
  notes: string[];     // 特殊提示 (如从格可能、格不纯等)
};

const SHI_SHEN_TO_GE: Record<ShiShen, string> = {
  比肩: '比肩格',
  劫财: '劫财格',
  食神: '食神格',
  伤官: '伤官格',
  偏财: '偏财格',
  正财: '正财格',
  七杀: '七杀格',
  正官: '正官格',
  偏印: '偏印格',
  正印: '正印格'
};

export function judgeGeJu(siZhu: Record<Pillar, {gan: Tiangan, zhi: Dizhi}>): GeJuResult {
  const dm = siZhu.日.gan;
  const monthZhi = siZhu.月.zhi;
  const cangGan = ZHI_CANG_GAN[monthZhi];
  const benqi = cangGan[0].gan;
  const benqiSS = getShiShen(dm, benqi);

  const otherGans = [siZhu.年.gan, siZhu.月.gan, siZhu.时.gan];
  const tougan: Tiangan[] = [];
  for (const cg of cangGan) {
    if (otherGans.includes(cg.gan)) tougan.push(cg.gan);
  }

  const notes: string[] = [];

  // 1. 月支为子/午/卯/酉 — 纯气月支, 直接立格
  // 2. 月支为四生(寅申巳亥) / 四库(辰戌丑未) — 先看透干
  const isPure = ['子','午','卯','酉'].includes(monthZhi);

  let primary: string;
  let basis: string;
  let confidence: '高'|'中'|'低' = '高';

  if (isPure) {
    primary = SHI_SHEN_TO_GE[benqiSS];
    basis = `月支${monthZhi}本气${benqi}(${benqiSS}) — 纯气月支直接立格`;
  } else {
    // 看月令藏干中是否有透出
    const touSS = tougan
      .map(g => ({gan: g, ss: getShiShen(dm, g)}))
      .filter(x => x.ss !== '比肩' && x.ss !== '劫财'); // 比劫一般不优先以透立格
    if (touSS.length > 0) {
      // 优先取本气透出的;若无,取中气/余气透出的
      const benqiTou = touSS.find(x => x.gan === benqi);
      if (benqiTou) {
        primary = SHI_SHEN_TO_GE[benqiTou.ss];
        basis = `月支${monthZhi}本气${benqi}透干 (${benqiTou.ss})`;
      } else {
        const first = touSS[0];
        primary = SHI_SHEN_TO_GE[first.ss];
        basis = `月支${monthZhi}藏干${first.gan}透干 (${first.ss})`;
        confidence = '中';
        notes.push(`月支本气${benqi}未透,取藏干${first.gan}立格(${first.ss}格)`);
      }
    } else {
      // 无非比劫透出 — 以本气立格
      primary = SHI_SHEN_TO_GE[benqiSS];
      basis = `月支${monthZhi}本气${benqi}(${benqiSS}) — 本气未透,以本气论格`;
      if (benqiSS !== '比肩' && benqiSS !== '劫财') confidence = '中';
    }
  }

  // 比肩/劫财: 默认按现代命名, 同时按传统派看日干在月支的长生位补 notes
  if (benqiSS === '比肩') {
    primary = '比肩格';
    basis = `月支本气${benqi}=日主同行(比肩) — 比肩格`;
    confidence = '高';
    notes.length = 0;
    const cs = getChangSheng(dm, monthZhi);
    if (cs === '临官') {
      notes.push(`日干${dm}在月支${monthZhi}为临官 — 传统称"建禄格"`);
    } else {
      notes.push(`日干${dm}在月支${monthZhi}为${cs}(非临官) — 传统子平派不立建禄, 现代按比肩格论`);
    }
  } else if (benqiSS === '劫财') {
    const yy = GAN_YINYANG[dm];
    notes.length = 0;
    primary = '劫财格';
    basis = `月支本气${benqi}=日主劫财 — 劫财格`;
    confidence = '高';
    const cs = getChangSheng(dm, monthZhi);
    if (cs === '帝旺') {
      const trad = yy === '阳' ? '羊刃格' : '月刃格(阴干月刃有争议)';
      notes.push(`日干${dm}在月支${monthZhi}为帝旺 — 传统称"${trad}"`);
    } else {
      notes.push(`日干${dm}在月支${monthZhi}为${cs}(非帝旺) — 传统不立月刃, 现代按劫财格论`);
    }
  }

  return {primary, basis, 透干: tougan, confidence, notes};
}
