/**
 * 纳音五行算法
 * 
 * 纳音是根据干支组合推算出的五行属性，每两个干支组成一个纳音。
 * 共有60个干支组合，对应30种纳音五行。
 * 
 * 纳音五行分为：
 * - 金：海中金、金箔金、白蜡金、剑锋金、钗钏金、沙中金
 * - 木：大林木、杨柳木、松柏木、平地木、石榴木、桑柘木
 * - 水：涧下水、大溪水、长流水、天河水、大海水、泉中水
 * - 火：炉中火、山头火、霹雳火、山下火、覆灯火、天上火
 * - 土：城头土、屋上土、壁上土、大驿土、沙中土、路旁土
 */

import type { Tiangan, Dizhi } from './types';

/**
 * 纳音五行类型
 */
export type NaYin =
  // 金系
  | '海中金' | '金箔金' | '白蜡金' | '剑锋金' | '钗钏金' | '沙中金'
  // 木系
  | '大林木' | '杨柳木' | '松柏木' | '平地木' | '石榴木' | '桑柘木'
  // 水系
  | '涧下水' | '大溪水' | '长流水' | '天河水' | '大海水' | '泉中水'
  // 火系
  | '炉中火' | '山头火' | '霹雳火' | '山下火' | '覆灯火' | '天上火'
  // 土系
  | '城头土' | '屋上土' | '壁上土' | '大驿土' | '沙中土' | '路旁土';

/**
 * 纳音映射表
 * 根据干支组合查找对应的纳音五行
 * 
 * 数据来源：纳音.md
 */
const NAYIN_MAP: Record<string, NaYin> = {
  // 金系
  '甲子': '海中金', '乙丑': '海中金',
  '壬寅': '金箔金', '癸卯': '金箔金',
  '庚辰': '白蜡金', '辛巳': '白蜡金',
  '壬申': '剑锋金', '癸酉': '剑锋金',
  '庚戌': '钗钏金', '辛亥': '钗钏金',
  '甲午': '沙中金', '乙未': '沙中金',
  
  // 木系
  '戊辰': '大林木', '己巳': '大林木',
  '壬午': '杨柳木', '癸未': '杨柳木',
  '庚寅': '松柏木', '辛卯': '松柏木',
  '戊戌': '平地木', '己亥': '平地木',
  '庚申': '石榴木', '辛酉': '石榴木',
  '壬子': '桑柘木', '癸丑': '桑柘木',
  
  // 水系
  '丙子': '涧下水', '丁丑': '涧下水',
  '甲寅': '大溪水', '乙卯': '大溪水',
  '壬辰': '长流水', '癸巳': '长流水',
  '丙午': '天河水', '丁未': '天河水',
  '壬戌': '大海水', '癸亥': '大海水',
  '甲申': '泉中水', '乙酉': '泉中水',
  
  // 火系
  '丙寅': '炉中火', '丁卯': '炉中火',
  '甲戌': '山头火', '乙亥': '山头火',
  '戊子': '霹雳火', '己丑': '霹雳火',
  '丙申': '山下火', '丁酉': '山下火',
  '甲辰': '覆灯火', '乙巳': '覆灯火',
  '戊午': '天上火', '己未': '天上火',
  
  // 土系
  '戊寅': '城头土', '己卯': '城头土',
  '丙戌': '屋上土', '丁亥': '屋上土',
  '庚子': '壁上土', '辛丑': '壁上土',
  '戊申': '大驿土', '己酉': '大驿土',
  '丙辰': '沙中土', '丁巳': '沙中土',
  '庚午': '路旁土', '辛未': '路旁土'
};

/**
 * 获取干支的纳音五行
 * @param tiangan 天干
 * @param dizhi 地支
 * @returns 纳音五行
 */
export function getNaYin(tiangan: Tiangan, dizhi: Dizhi): NaYin {
  const key = tiangan + dizhi;
  const nayin = NAYIN_MAP[key];
  
  if (!nayin) {
    console.warn(`未找到纳音: ${key}`);
    return '海中金'; // 默认值
  }
  
  return nayin;
}

/**
 * 批量获取四柱的纳音
 * @param siZhu 四柱干支
 * @returns 四柱纳音数组
 */
export function getSiZhuNaYin(siZhu: {
  year: { gan: Tiangan; zhi: Dizhi };
  month: { gan: Tiangan; zhi: Dizhi };
  day: { gan: Tiangan; zhi: Dizhi };
  hour: { gan: Tiangan; zhi: Dizhi };
}): {
  year: NaYin;
  month: NaYin;
  day: NaYin;
  hour: NaYin;
} {
  return {
    year: getNaYin(siZhu.year.gan, siZhu.year.zhi),
    month: getNaYin(siZhu.month.gan, siZhu.month.zhi),
    day: getNaYin(siZhu.day.gan, siZhu.day.zhi),
    hour: getNaYin(siZhu.hour.gan, siZhu.hour.zhi)
  };
}

/**
 * 获取纳音的五行属性
 * @param nayin 纳音
 * @returns 五行属性（金木水火土）
 */
export function getNaYinWuXing(nayin: NaYin): '金' | '木' | '水' | '火' | '土' {
  if (nayin.includes('金')) return '金';
  if (nayin.includes('木')) return '木';
  if (nayin.includes('水')) return '水';
  if (nayin.includes('火')) return '火';
  if (nayin.includes('土')) return '土';
  return '金'; // 默认值
}

/**
 * 获取纳音五行的相生相克关系
 * @param nayin1 纳音1
 * @param nayin2 纳音2
 * @returns 关系（生、克、比和）
 */
export function getNaYinRelation(
  nayin1: NaYin,
  nayin2: NaYin
): '生' | '克' | '被生' | '被克' | '比和' {
  const wx1 = getNaYinWuXing(nayin1);
  const wx2 = getNaYinWuXing(nayin2);
  
  if (wx1 === wx2) return '比和';
  
  // 相生关系：木生火、火生土、土生金、金生水、水生木
  const sheng: Record<string, string> = {
    '木': '火', '火': '土', '土': '金', '金': '水', '水': '木'
  };
  
  if (sheng[wx1] === wx2) return '生';
  if (sheng[wx2] === wx1) return '被生';
  
  // 相克关系：木克土、土克水、水克火、火克金、金克木
  const ke: Record<string, string> = {
    '木': '土', '土': '水', '水': '火', '火': '金', '金': '木'
  };
  
  if (ke[wx1] === wx2) return '克';
  if (ke[wx2] === wx1) return '被克';
  
  return '比和'; // 默认值
}
