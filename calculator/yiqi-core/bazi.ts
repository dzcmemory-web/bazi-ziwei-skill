// 八字排盘核心算法（使用lunar-javascript库）

import { BirthInfo, BaziChart, SiZhu, Tiangan, DayunDetail, LiuNian, GanZhi } from './types';
import { Lunar, Solar } from 'lunar-typescript';
import { getSiZhuChangSheng } from './zhangsheng';
import { getSiZhuNaYin } from './nayin';
import { getAccurateMonthGanZhi } from './jieqi';

/**
 * 十神关系映射
 */
const SHISHEN_MAP = {
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
 * 地支藏干（主气）映射
 */
const DIZHI_CANGGAN = {
  '子': '癸', '丑': '己', '寅': '甲', '卯': '乙',
  '辰': '戊', '巳': '丙', '午': '丁', '未': '己',
  '申': '庚', '酉': '辛', '戌': '戊', '亥': '壬'
} as const;

/**
 * 地支藏干（完整）映射 - 每个地支包含本气、中气、余气
 */
const DIZHI_CANGGAN_FULL = {
  '子': ['癸'],
  '丑': ['己', '癸', '辛'],
  '寅': ['甲', '丙', '戊'],
  '卯': ['乙'],
  '辰': ['戊', '乙', '癸'],
  '巳': ['丙', '庚', '戊'],
  '午': ['丁', '己'],
  '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'],
  '酉': ['辛'],
  '戌': ['戊', '辛', '丁'],
  '亥': ['壬', '甲']
} as const;

/**
 * 获取十神关系
 */
function getShiShen(dayGan: string, targetGan: string): string {
  return (SHISHEN_MAP as any)[dayGan]?.[targetGan] || '未知';
}

/**
 * 获取地支藏干主气
 */
function getZhiCangGan(zhi: string): string {
  return (DIZHI_CANGGAN as any)[zhi] || '未知';
}

/**
 * 获取地支完整藏干（含所有藏干及其十神）
 * @param zhi 地支
 * @param dayMaster 日主天干
 * @returns 藏干数组，每项包含天干和对应十神
 */
export function getZhiCangGanFull(zhi: string, dayMaster: string): Array<{ gan: string, shiShen: string }> {
  const cangGanList = (DIZHI_CANGGAN_FULL as any)[zhi] || [];
  return cangGanList.map((gan: string) => ({
    gan,
    shiShen: getShiShen(dayMaster, gan)
  }));
}

/**
 * 处理晚子时（23:00-24:00）的日柱
 * 在传统命理中，晚子时应该使用第二天的日柱
 * @param solar Solar对象
 * @returns 调整后的Solar对象（如果是晚子时）
 */
function getAdjustedSolarForZiShi(solar: Solar): Solar {
  const hour = solar.getHour();
  
  // 如果是晚子时（23:00-24:00），使用第二天的日期计算日柱
  if (hour === 23) {
    console.error('[晚子时处理] 23点，使用第二天的日柱');
    // 获取第二天的日期
    const nextDay = solar.next(1); // 下一天
    return nextDay;
  }
  
  return solar;
}

/**
 * 创建八字排盘（使用lunar-javascript库）
 * @param birthInfo 生辰信息
 * @returns 八字排盘结果
 */
export function createBaziChart(birthInfo: BirthInfo): BaziChart {
  try {
    // 创建Solar对象（公历日期）
    const solar = Solar.fromYmdHms(
      birthInfo.year, 
      birthInfo.month, 
      birthInfo.day, 
      birthInfo.hour, 
      birthInfo.minute, 
      0
    );

    // 处理晚子时（23:00-24:00），使用第二天的日柱
    const solarForDay = getAdjustedSolarForZiShi(solar);
    const lunarForDay = solarForDay.getLunar();
    const baZiForDay = lunarForDay.getEightChar();

    // 转换为农历（用于年柱、月柱、时柱）
    const lunar = solar.getLunar();

    // 获取八字
    const baZi = lunar.getEightChar();

    // 使用精确节气时刻计算月柱
    const accurateMonthGZ = getAccurateMonthGanZhi(solar);

    // 获取四柱干支
    const siZhu: SiZhu = {
      year: {
        gan: baZi.getYear().substring(0, 1) as Tiangan,
        zhi: baZi.getYear().substring(1, 2) as any
      },
      month: {
        gan: accurateMonthGZ.gan,  // 使用精确节气计算的月柱
        zhi: accurateMonthGZ.zhi,  // 使用精确节气计算的月柱
      },
      day: {
        gan: baZiForDay.getDay().substring(0, 1) as Tiangan,  // 使用调整后的日柱（处理晚子时）
        zhi: baZiForDay.getDay().substring(1, 2) as any       // 使用调整后的日柱（处理晚子时）
      },
      hour: {
        gan: baZi.getTime().substring(0, 1) as Tiangan,
        zhi: baZi.getTime().substring(1, 2) as any
      }
    };

    const dayMaster = siZhu.day.gan;

    // 计算十神
    const shiShen = {
      year: getShiShen(dayMaster, siZhu.year.gan) as any,
      month: getShiShen(dayMaster, siZhu.month.gan) as any,
      day: getShiShen(dayMaster, siZhu.day.gan) as any,
      hour: getShiShen(dayMaster, siZhu.hour.gan) as any
    };

    // 获取大运（使用lunar-javascript库）
    const yun = baZi.getYun(birthInfo.gender === 'male' ? 1 : 0);
    const dayunStart = Math.floor(yun.getStartYear());
    
    // 获取大运列表（跳过第一个，因为它是起运前的状态）
    const dayunList = yun.getDaYun().slice(1, 11); // 取第2-11个，共10步大运
    
    const dayun: DayunDetail[] = dayunList.map((d: any) => {
      const ganZhiStr = d.getGanZhi();
      const ganZhi: GanZhi = {
        gan: ganZhiStr.substring(0, 1) as Tiangan,
        zhi: ganZhiStr.substring(1, 2) as any
      };
      
      // 计算天干十神
      const ganShiShen = getShiShen(dayMaster, ganZhi.gan) as any;
      
      // 计算地支藏干的十神
      const zhiCangGan = getZhiCangGan(ganZhi.zhi);
      const zhiShiShen = getShiShen(dayMaster, zhiCangGan) as any;
      
      // 获取该大运内的流年
      const liuNianList = d.getLiuNian();
      const liuNian: LiuNian[] = liuNianList.map((ln: any) => {
        const lnGanZhiStr = ln.getGanZhi();
        return {
          year: ln.getYear(),
          age: ln.getAge(),
          ganZhi: {
            gan: lnGanZhiStr.substring(0, 1) as Tiangan,
            zhi: lnGanZhiStr.substring(1, 2) as any
          }
        };
      });
      
      return {
        ganZhi,
        startAge: d.getStartAge(),
        startYear: d.getStartYear(),
        endYear: d.getEndYear(),
        ganShiShen,
        zhiShiShen,
        liuNian
      };
    });

    // 计算十二长生（星运）- zhangSheng 不是 changSheng
    const zhangSheng = getSiZhuChangSheng(dayMaster, {
      year: siZhu.year.zhi,
      month: siZhu.month.zhi,
      day: siZhu.day.zhi,
      hour: siZhu.hour.zhi
    });

    // 计算纳音
    const naYin = getSiZhuNaYin(siZhu);

    console.error('🔍 八字计算结果 - zhangSheng:', zhangSheng);
    console.error('🔍 八字计算结果 - naYin:', naYin);

    return {
      birthInfo,
      siZhu,
      dayMaster,
      shiShen,
      zhangSheng,
      naYin,
      dayunStart,
      dayun
    };
  } catch (error) {
    console.error('创建八字排盘失败:', error);
    throw new Error('八字排盘计算失败: ' + (error as Error).message);
  }
}

/**
 * 运行八字测试
 */
export function runBaziTests() {
  const testCases = [
    {
      name: '1979年5月4日6点男命（己年为阴年，男命逆排）',
      input: { year: 1979, month: 5, day: 4, hour: 6, minute: 0, gender: 'male' as const, isLunar: false, timeZone: 8 },
      expected: {
        year: '己未',
        month: '戊辰',
        day: '辛未', 
        hour: '辛卯',
        isYangYear: false, // 己为阴年
        shouldShunPai: false // 阴年男命逆排
      }
    },
    {
      name: '2000年1月1日12点女命（己年为阴年，女命顺排）',
      input: { year: 2000, month: 1, day: 1, hour: 12, minute: 0, gender: 'female' as const, isLunar: false, timeZone: 8 },
      expected: {
        year: '己卯',
        month: '丙子',
        day: '戊午',
        hour: '戊午',
        isYangYear: false, // 己为阴年
        shouldShunPai: true // 阴年女命顺排
      }
    },
    {
      name: '1988年8月15日10点男命（戊年为阳年，男命顺排）',
      input: { year: 1988, month: 8, day: 15, hour: 10, minute: 0, gender: 'male' as const, isLunar: false, timeZone: 8 },
      expected: {
        isYangYear: true, // 戊为阳年
        shouldShunPai: true // 阳年男命顺排
      }
    },
    {
      name: '1987年3月20日14点女命（丁年为阴年，女命顺排）',
      input: { year: 1987, month: 3, day: 20, hour: 14, minute: 0, gender: 'female' as const, isLunar: false, timeZone: 8 },
      expected: {
        isYangYear: false, // 丁为阴年
        shouldShunPai: true // 阴年女命顺排
      }
    },
    {
      name: '2000年3月1日12点女命（庚年为阳年，女命逆排）',
      input: { year: 2000, month: 3, day: 1, hour: 12, minute: 0, gender: 'female' as const, isLunar: false, timeZone: 8 },
      expected: {
        year: '庚辰',
        month: '戊寅',
        day: '乙卯',
        hour: '壬午',
        isYangYear: true, // 庚为阳年
        shouldShunPai: false // 阳年女命逆排
      }
    }
  ];

  const results = {
    passed: 0,
    failed: 0,
    details: [] as any[]
  };

  testCases.forEach((testCase) => {
    try {
      const result = createBaziChart(testCase.input);
      const actualYear = result.siZhu.year.gan + result.siZhu.year.zhi;
      const actualMonth = result.siZhu.month.gan + result.siZhu.month.zhi;
      const actualDay = result.siZhu.day.gan + result.siZhu.day.zhi;
      const actualHour = result.siZhu.hour.gan + result.siZhu.hour.zhi;

      // 检查年干阴阳和大运顺逆
      const yearGanIndex = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'].indexOf(result.siZhu.year.gan);
      const isYangYear = yearGanIndex % 2 === 0;
      const isMale = testCase.input.gender === 'male';
      const shouldShunPai = (isYangYear && isMale) || (!isYangYear && !isMale);

      const yearPass = testCase.expected.year ? actualYear === testCase.expected.year : true;
      const monthPass = testCase.expected.month ? actualMonth === testCase.expected.month : true;
      const dayPass = testCase.expected.day ? actualDay === testCase.expected.day : true;
      const hourPass = testCase.expected.hour ? actualHour === testCase.expected.hour : true;
      const yinYangPass = isYangYear === testCase.expected.isYangYear;
      const shunPaiPass = shouldShunPai === testCase.expected.shouldShunPai;
      const allPass = yearPass && monthPass && dayPass && hourPass && yinYangPass && shunPaiPass;

      if (allPass) {
        results.passed++;
      } else {
        results.failed++;
      }

      results.details.push({
        name: testCase.name,
        passed: allPass,
        expected: testCase.expected,
        actual: { 
          year: actualYear, 
          month: actualMonth, 
          day: actualDay, 
          hour: actualHour,
          isYangYear,
          shouldShunPai,
          dayun: result.dayun.slice(0, 3).map(d => d.ganZhi.gan + d.ganZhi.zhi) // 只显示前3步大运
        },
        details: { yearPass, monthPass, dayPass, hourPass, yinYangPass, shunPaiPass }
      });
    } catch (error) {
      results.failed++;
      results.details.push({
        name: testCase.name,
        passed: false,
        error: (error as Error).message
      });
    }
  });
  
  return results;
}
