// 统一排盘接口

import { BirthInfo, ChartResult } from './types';
import { createBaziChart, runBaziTests } from './bazi';
import { createZiweiChart, runZiweiTests } from './ziwei-standard';

/**
 * 创建完整的排盘（八字 + 紫微斗数）
 * @param birthInfo 生辰信息
 * @returns 完整排盘结果
 */
export function createChart(birthInfo: BirthInfo): ChartResult {
  try {
    const bazi = createBaziChart(birthInfo);
    const ziwei = createZiweiChart(birthInfo);
    
    return {
      bazi,
      ziwei
    };
  } catch (error) {
    throw new Error(`排盘计算失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 验证生辰信息的有效性
 * @param birthInfo 生辰信息
 * @returns 验证结果
 */
export function validateBirthInfo(birthInfo: BirthInfo): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 验证年份
  if (birthInfo.year < 1900 || birthInfo.year > 2100) {
    errors.push('年份应在1900-2100之间');
  }
  
  // 验证月份
  if (birthInfo.month < 1 || birthInfo.month > 12) {
    errors.push('月份应在1-12之间');
  }
  
  // 验证日期
  if (birthInfo.day < 1 || birthInfo.day > 31) {
    errors.push('日期应在1-31之间');
  }
  
  // 验证时辰
  if (birthInfo.hour < 0 || birthInfo.hour > 23) {
    errors.push('小时应在0-23之间');
  }
  
  // 验证分钟
  if (birthInfo.minute < 0 || birthInfo.minute > 59) {
    errors.push('分钟应在0-59之间');
  }
  
  // 验证性别
  if (birthInfo.gender !== 'male' && birthInfo.gender !== 'female') {
    errors.push('性别必须为男性或女性');
  }
  
  // 简单的闰年和月份天数验证
  if (birthInfo.month === 2) {
    const isLeapYear = (birthInfo.year % 4 === 0 && birthInfo.year % 100 !== 0) || (birthInfo.year % 400 === 0);
    if (birthInfo.day > (isLeapYear ? 29 : 28)) {
      errors.push('2月份日期超出范围');
    }
  } else if ([4, 6, 9, 11].includes(birthInfo.month)) {
    if (birthInfo.day > 30) {
      errors.push('该月份只有30天');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 运行所有算法测试
 * @returns 综合测试结果
 */
export function runAllTests(): { 
  bazi: ReturnType<typeof runBaziTests>; 
  ziwei: ReturnType<typeof runZiweiTests>;
  summary: { totalPassed: number; totalFailed: number; success: boolean }
} {
  const baziResults = runBaziTests();
  const ziweiResults = runZiweiTests();
  
  const totalPassed = baziResults.passed + ziweiResults.passed;
  const totalFailed = baziResults.failed + ziweiResults.failed;
  
  return {
    bazi: baziResults,
    ziwei: ziweiResults,
    summary: {
      totalPassed,
      totalFailed,
      success: totalFailed === 0
    }
  };
}

/**
 * 格式化排盘结果为可读字符串（用于调试）
 * @param chart 排盘结果
 * @returns 格式化的字符串
 */
export function formatChartResult(chart: ChartResult): string {
  let result = '=== 排盘结果 ===\n\n';
  
  // 八字部分
  result += '【八字排盘】\n';
  result += `年柱: ${chart.bazi.siZhu.year.gan}${chart.bazi.siZhu.year.zhi}\n`;
  result += `月柱: ${chart.bazi.siZhu.month.gan}${chart.bazi.siZhu.month.zhi}\n`;
  result += `日柱: ${chart.bazi.siZhu.day.gan}${chart.bazi.siZhu.day.zhi}\n`;
  result += `时柱: ${chart.bazi.siZhu.hour.gan}${chart.bazi.siZhu.hour.zhi}\n`;
  result += `日主: ${chart.bazi.dayMaster}\n`;
  result += `大运起运: ${chart.bazi.dayunStart}岁\n`;
  result += `前三步大运: ${chart.bazi.dayun.slice(0, 3).map(dy => `${dy.ganZhi.gan}${dy.ganZhi.zhi}`).join(' ')}\n\n`;
  
  // 紫微斗数部分
  result += '【紫微斗数】\n';
  result += `命宫: ${chart.ziwei.gongs[0].dizhi}宫\n`;
  const shenGongDizhi = chart.ziwei.gongs[chart.ziwei.shenGongIndex]?.dizhi || '未知';
  result += `身宫: ${shenGongDizhi}宫\n`;
  
  // 显示有主星的宫位
  chart.ziwei.gongs.forEach(gong => {
    if (gong.mainStars.length > 0) {
      result += `${gong.gong}(${gong.dizhi}): ${gong.mainStars.join('、')}`;
      if (gong.auxStars.length > 0) {
        result += ` [${gong.auxStars.join('、')}]`;
      }
      if (gong.sihua.length > 0) {
        result += ` {${gong.sihua.map(s => `${s.star}${s.hua}`).join('、')}}`;
      }
      result += '\n';
    }
  });
  
  return result;
}

// 导出示例用法
export const EXAMPLE_BIRTH_INFO: BirthInfo = {
  year: 1990,
  month: 5,
  day: 15,
  hour: 14,
  minute: 30,
  isLunar: false,
  gender: 'male',
  timeZone: 8
};
