// 调候用神 — 穷通宝鉴查表 wrapper

import { Tiangan, Dizhi, TIAO_HOU } from './tables';

export function getTiaoHou(dayMaster: Tiangan, monthZhi: Dizhi): string[] {
  return TIAO_HOU[dayMaster][monthZhi];
}
