// 天干地支基础数据和工具函数

import { Tiangan, Dizhi, GanZhi } from './types';

// 天干数组
export const TIANGAN: Tiangan[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

// 地支数组
export const DIZHI: Dizhi[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 天干五行属性
export const TIANGAN_WUXING = {
  '甲': '木', '乙': '木', 
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水'
} as const;

// 地支五行属性
export const DIZHI_WUXING = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水'
} as const;

// 地支对应的月份（节气月）
export const DIZHI_MONTH = {
  '寅': 1, '卯': 2, '辰': 3, '巳': 4, '午': 5, '未': 6,
  '申': 7, '酉': 8, '戌': 9, '亥': 10, '子': 11, '丑': 12
} as const;

// 十神关系表（以日干为中心）
export const SHISHEN_MAP = {
  '甲': { '甲': '比肩', '乙': '劫财', '丙': '食神', '丁': '伤官', '戊': '偏财', '己': '正财', '庚': '七杀', '辛': '正官', '壬': '偏印', '癸': '正印' },
  '乙': { '甲': '劫财', '乙': '比肩', '丙': '伤官', '丁': '食神', '戊': '正财', '己': '偏财', '庚': '正官', '辛': '七杀', '壬': '正印', '癸': '偏印' },
  '丙': { '甲': '偏印', '乙': '正印', '丙': '比肩', '丁': '劫财', '戊': '食神', '己': '伤官', '庚': '偏财', '辛': '正财', '壬': '七杀', '癸': '正官' },
  '丁': { '甲': '正印', '乙': '偏印', '丙': '劫财', '丁': '比肩', '戊': '伤官', '己': '食神', '庚': '正财', '辛': '偏财', '壬': '正官', '癸': '七杀' },
  '戊': { '甲': '七杀', '乙': '正官', '丙': '偏印', '丁': '正印', '戊': '比肩', '己': '劫财', '庚': '食神', '辛': '伤官', '壬': '偏财', '癸': '正财' },
  '己': { '甲': '正官', '乙': '七杀', '丙': '正印', '丁': '偏印', '戊': '劫财', '己': '比肩', '庚': '伤官', '辛': '食神', '壬': '正财', '癸': '偏财' },
  '庚': { '甲': '偏财', '乙': '正财', '丙': '七杀', '丁': '正官', '戊': '偏印', '己': '正印', '庚': '比肩', '辛': '劫财', '壬': '食神', '癸': '伤官' },
  '辛': { '甲': '正财', '乙': '偏财', '丙': '正官', '丁': '七杀', '戊': '正印', '己': '偏印', '庚': '劫财', '辛': '比肩', '壬': '伤官', '癸': '食神' },
  '壬': { '甲': '食神', '乙': '伤官', '丙': '偏财', '丁': '正财', '戊': '七杀', '己': '正官', '庚': '偏印', '辛': '正印', '壬': '比肩', '癸': '劫财' },
  '癸': { '甲': '伤官', '乙': '食神', '丙': '正财', '丁': '偏财', '戊': '正官', '己': '七杀', '庚': '正印', '辛': '偏印', '壬': '劫财', '癸': '比肩' }
} as const;

/**
 * 根据数字获取天干
 * @param num 数字（0-9 对应甲-癸，支持更大数字取模）
 * @returns 对应的天干
 */
export function getTiangan(num: number): Tiangan {
  return TIANGAN[num % 10];
}

/**
 * 根据数字获取地支
 * @param num 数字（0-11 对应子-亥，支持更大数字取模）
 * @returns 对应的地支
 */
export function getDizhi(num: number): Dizhi {
  return DIZHI[num % 12];
}

/**
 * 获取天干的序号
 * @param gan 天干
 * @returns 序号（0-9）
 */
export function getTianganIndex(gan: Tiangan): number {
  return TIANGAN.indexOf(gan);
}

/**
 * 获取地支的序号
 * @param zhi 地支
 * @returns 序号（0-11）
 */
export function getDizhiIndex(zhi: Dizhi): number {
  return DIZHI.indexOf(zhi);
}

/**
 * 根据年份获取干支
 * @param year 公历年份
 * @returns 对应的干支
 */
export function getYearGanZhi(year: number): GanZhi {
  // 采用标准算法：以公元4年甲子年为起点
  // 天干循环：(year - 4) % 10
  // 地支循环：(year - 4) % 12
  const ganIndex = (year - 4) % 10;
  const zhiIndex = (year - 4) % 12;
  
  return {
    gan: getTiangan(ganIndex),
    zhi: getDizhi(zhiIndex)
  };
}

/**
 * 根据日期获取日干支（使用Date对象计算）
 * @param year 年
 * @param month 月
 * @param day 日
 * @returns 对应的干支
 */
export function getDayGanZhi(year: number, month: number, day: number): GanZhi {
  // 计算从1900年1月1日到目标日期的天数差
  const baseDate = new Date(1900, 0, 1); // 1900年1月1日
  const targetDate = new Date(year, month - 1, day); // 目标日期
  
  const daysDiff = Math.floor((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // 1900年1月1日是己丑日（天干索引5，地支索引1）
  const ganIndex = (daysDiff + 5) % 10;
  const zhiIndex = (daysDiff + 1) % 12;
  
  return {
    gan: getTiangan(ganIndex >= 0 ? ganIndex : ganIndex + 10),
    zhi: getDizhi(zhiIndex >= 0 ? zhiIndex : zhiIndex + 12)
  };
}

/**
 * 根据时辰获取时干支
 * @param dayGan 日干
 * @param hour 时辰（0-23）
 * @returns 对应的干支
 */
export function getHourGanZhi(dayGan: Tiangan, hour: number): GanZhi {
  // 确定时支
  const zhiIndex = Math.floor((hour + 1) / 2) % 12;
  const zhi = getDizhi(zhiIndex);
  
  // 根据日干推算时干（五鼠遁法）
  const dayGanIndex = getTianganIndex(dayGan);
  const hourGanBaseMap = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8]; // 甲己起甲子，乙庚起丙子...
  const hourGanBase = hourGanBaseMap[dayGanIndex];
  const ganIndex = (hourGanBase + zhiIndex) % 10;
  
  return {
    gan: getTiangan(ganIndex),
    zhi: zhi
  };
}

/**
 * 获取十神关系
 * @param dayGan 日干
 * @param targetGan 目标天干
 * @returns 十神关系
 */
export function getShiShen(dayGan: Tiangan, targetGan: Tiangan) {
  return SHISHEN_MAP[dayGan][targetGan];
}
