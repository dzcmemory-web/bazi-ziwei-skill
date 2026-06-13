// 紫微斗数排盘核心算法（按照标准安星法重写）

import { BirthInfo, ZiweiChart, ZiweiGongInfo, GanZhi } from './types';
import { Solar, Lunar } from 'lunar-typescript';
import { addBenMingSiHua } from './sihua';
import { calculateDaXian, calculateXuSui } from './daxian';

/**
 * 天干数组
 */
const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

/**
 * 地支数组（顺时针）
 */
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/**
 * 十二宫名称（从命宫开始，逆时针排列）
 */
const GONG_NAMES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '官禄', '田宅', '福德', '父母'];

/**
 * 时辰转换为地支索引
 */
function getHourZhiIndex(hour: number): number {
  // 23-01:子(0), 01-03:丑(1), ..., 21-23:亥(11)
  return Math.floor((hour + 1) / 2) % 12;
}

/**
 * 判断阴阳男女
 */
function getYinYang(year: number, gender: 'male' | 'female'): string {
  const ganIndex = (year - 4) % 10; // 修正公式：2014年 → (2014-4)%10 = 0 → 甲
  const isYangYear = ganIndex % 2 === 0; // 甲丙戊庚壬为阳（索引0,2,4,6,8）
  
  if (gender === 'male') {
    return isYangYear ? '阳男' : '阴男';
  } else {
    return isYangYear ? '阳女' : '阴女';
  }
}

/**
 * 五虎遁月诀 - 根据年干和月支确定月干
 */
function getMonthGan(yearGan: string, monthZhi: string): string {
  const yearGanIndex = TIANGAN.indexOf(yearGan);
  const monthZhiIndex = DIZHI.indexOf(monthZhi);
  
  // 五虎遁月诀：甲己丙作首，乙庚戊为头，丙辛庚上起，丁壬壬寅流，戊癸甲寅求
  const firstMonthGanMap: { [key: number]: number } = {
    0: 2, 5: 2,  // 甲己 → 丙
    1: 4, 6: 4,  // 乙庚 → 戊
    2: 6, 7: 6,  // 丙辛 → 庚
    3: 8, 8: 8,  // 丁壬 → 壬
    4: 0, 9: 0   // 戊癸 → 甲
  };
  
  const firstMonthGan = firstMonthGanMap[yearGanIndex];
  // 正月是寅月（索引2），从正月天干开始，按地支顺序推算
  // 月支索引 - 寅索引(2) = 偏移量
  const offset = (monthZhiIndex - 2 + 12) % 12;
  const monthGanIndex = (firstMonthGan + offset) % 10;
  
  return TIANGAN[monthGanIndex];
}

/**
 * 计算命宫位置
 * 标准算法：从寅宫起正月，顺数到生月；从生月宫当子时，逆时针数到生时
 * 例如：八月在酉宫，申时是第9个时辰（子丑寅卯辰巳午未申），从酉宫逆数8位到丑宫
 */
function calculateMingGong(lunarMonth: number, hour: number): number {
  // 1. 从寅宫（索引2）起正月，顺时针数到生月
  // 正月在寅(2)，二月在卯(3)，...，八月在酉(9)
  const shengYueGongIndex = (2 + lunarMonth - 1) % 12;
  
  // 2. 从生月宫当子时起，逆时针数到生时
  // 生时地支索引就是要逆数的宫位数
  const shengShiZhiIndex = getHourZhiIndex(hour);
  
  // 从生月宫逆时针数shengShiZhiIndex个宫位
  const mingGongIndex = (shengYueGongIndex - shengShiZhiIndex + 12) % 12;
  
  return mingGongIndex;
}

/**
 * 计算身宫位置
 * 标准算法：从寅宫起正月，顺数到生月；从生月宫当子时，顺时针数到生时
 * 例如：八月在酉宫，申时是第9个时辰，从酉宫顺数8位到巳宫
 */
function calculateShenGong(lunarMonth: number, hour: number): number {
  // 1. 从寅宫（索引2）起正月，顺时针数到生月
  // 正月在寅(2)，二月在卯(3)，...，八月在酉(9)
  const shengYueGongIndex = (2 + lunarMonth - 1) % 12;
  
  // 2. 从生月宫当子时起，顺时针数到生时
  // 生时地支索引就是要顺数的宫位数
  const shengShiZhiIndex = getHourZhiIndex(hour);
  
  // 从生月宫顺时针数shengShiZhiIndex个宫位
  const shenGongIndex = (shengYueGongIndex + shengShiZhiIndex) % 12;
  
  return shenGongIndex;
}

/**
 * 计算纳音五行局
 */
function calculateWuXingJu(tiangan: string, dizhi: string): { name: string; number: number } {
  const ganNum = Math.floor(TIANGAN.indexOf(tiangan) / 2) + 1; // 甲乙=1, 丙丁=2...
  
  const zhiMap: { [key: string]: number } = {
    '子': 1, '丑': 1, '午': 1, '未': 1,
    '寅': 2, '卯': 2, '申': 2, '酉': 2,
    '辰': 3, '巳': 3, '戌': 3, '亥': 3
  };
  const zhiNum = zhiMap[dizhi];
  
  let juNum = (ganNum + zhiNum) % 5;
  if (juNum === 0) juNum = 5;
  
  const juMap: { [key: number]: string } = {
    1: '木三局',
    2: '金四局',
    3: '水二局',
    4: '火六局',
    5: '土五局'
  };
  
  return {
    name: juMap[juNum],
    number: [0, 3, 4, 2, 6, 5][juNum] // 转换为局数：木3,金4,水2,火6,土5
  };
}

/**
 * 计算紫微星位置
 * 口诀：生日除局商为月，一自寅起紫微定。只加不减到整除，阳退阴进记心中。
 */
function calculateZiweiPosition(lunarDay: number, juShu: number): number {
  let shang = Math.floor(lunarDay / juShu);
  let yu = lunarDay % juShu;
  
  if (yu === 0) {
    // 整除
    // 商数对应地支：寅=1, 卯=2, ..., 丑=12
    if (shang > 12) shang = shang - 12;
    // 地支索引 = (寅索引2 + 商数-1) % 12
    return (2 + shang - 1) % 12;
  } else {
    // 不整除，需要添加数使其整除
    const tian = juShu - yu; // 添加的数
    shang = Math.floor((lunarDay + tian) / juShu);
    
    if (shang > 12) shang = shang - 12;
    let baseIndex = (2 + shang - 1) % 12;
    
    // 添加数为单数：逆时针退tian位（阳退，不包括本位）
    // 添加数为双数：顺时针进tian位（阴进，不包括本位）
    if (tian % 2 === 1) {
      // 单数：逆时针退tian位
      return (baseIndex - tian + 12) % 12;
    } else {
      // 双数：顺时针进tian位
      return (baseIndex + tian) % 12;
    }
  }
}

/**
 * 安紫微星系
 * 口诀：紫微天机逆行旁，隔一阳武天同当，又隔二位廉贞地，空三复见紫微郞
 */
function installZiweiSeries(ziweiPos: number): Map<string, number> {
  const stars = new Map<string, number>();
  
  stars.set('紫微', ziweiPos);
  stars.set('天机', (ziweiPos - 1 + 12) % 12);  // 逆时针下一宫
  // 隔一宫
  stars.set('太阳', (ziweiPos - 3 + 12) % 12);
  stars.set('武曲', (ziweiPos - 4 + 12) % 12);
  stars.set('天同', (ziweiPos - 5 + 12) % 12);
  // 隔两宫
  stars.set('廉贞', (ziweiPos - 8 + 12) % 12);
  
  return stars;
}

/**
 * 计算天府星位置
 * 口诀：天府南斗令，常对紫微君
 */
function calculateTianfuPosition(ziweiPos: number): number {
  // 紫微天府对应关系
  const duiYing: { [key: number]: number } = {
    2: 2, 8: 8,   // 寅申：紫府同宫
    1: 3, 3: 1,   // 丑卯相对
    7: 9, 9: 7,   // 未酉相对
    6: 10, 10: 6, // 午戌相对
    0: 4, 4: 0,   // 子辰相对
    5: 11, 11: 5  // 巳亥相对
  };
  
  return duiYing[ziweiPos];
}

/**
 * 安天府星系
 * 口诀：天府太阴与贪狼，巨门天相及天梁，七杀空三破军位
 */
function installTianfuSeries(tianfuPos: number): Map<string, number> {
  const stars = new Map<string, number>();
  
  stars.set('天府', tianfuPos);
  stars.set('太阴', (tianfuPos + 1) % 12);  // 顺时针下一宫
  stars.set('贪狼', (tianfuPos + 2) % 12);
  stars.set('巨门', (tianfuPos + 3) % 12);
  stars.set('天相', (tianfuPos + 4) % 12);
  stars.set('天梁', (tianfuPos + 5) % 12);
  stars.set('七杀', (tianfuPos + 6) % 12);
  // 空三宫
  stars.set('破军', (tianfuPos + 10) % 12);
  
  return stars;
}

/**
 * 安辅星：左辅、右弼
 * 口诀：左辅辰宫起正月，顺数至生月；右弼戌宫起正月，逆数至生月
 */
function installZuoYou(lunarMonth: number): Map<string, number> {
  const stars = new Map<string, number>();
  
  // 左辅：辰宫起正月，顺时针数到生月
  const zuoFuPos = (4 + lunarMonth - 1) % 12;
  stars.set('左辅', zuoFuPos);
  
  // 右弼：戌宫起正月，逆时针数到生月
  const youBiPos = (10 - lunarMonth + 1 + 12) % 12;
  stars.set('右弼', youBiPos);
  
  return stars;
}

/**
 * 安文昌、文曲
 * 口诀：文昌生时起戌位，逆数时辰至卯停；文曲生时起子位，逆数时辰至午停
 */
function installWenXing(hour: number): Map<string, number> {
  const stars = new Map<string, number>();
  const hourZhiIndex = getHourZhiIndex(hour);
  
  // 文昌：戌宫起子时，逆时针数到生时
  const wenChangPos = (10 - hourZhiIndex + 12) % 12;
  stars.set('文昌', wenChangPos);
  
  // 文曲：辰宫起子时，顺时针数到生时
  const wenQuPos = (4 + hourZhiIndex) % 12;
  stars.set('文曲', wenQuPos);
  
  return stars;
}

/**
 * 安禄存、天马
 * 口诀：禄存按年干安星，天马按年支对宫三合
 */
function installLuMa(yearGan: string, yearZhi: string): Map<string, number> {
  const stars = new Map<string, number>();
  
  // 禄存按年干：甲寅、乙卯、丙戊巳、丁己午、庚申、辛酉、壬亥、癸子
  const luCunMap: { [key: string]: number } = {
    '甲': 2,  // 寅
    '乙': 3,  // 卯
    '丙': 5,  // 巳
    '丁': 6,  // 午
    '戊': 5,  // 巳
    '己': 6,  // 午
    '庚': 8,  // 申
    '辛': 9,  // 酉
    '壬': 11, // 亥
    '癸': 0   // 子
  };
  
  stars.set('禄存', luCunMap[yearGan]);
  
  // 天马按年支三合：寅午戌→申，巳酉丑→亥，申子辰→寅，亥卯未→巳
  const tianMaMap: { [key: string]: number } = {
    '寅': 8, '午': 8, '戌': 8,     // 申
    '巳': 11, '酉': 11, '丑': 11,   // 亥
    '申': 2, '子': 2, '辰': 2,      // 寅
    '亥': 5, '卯': 5, '未': 5       // 巳
  };
  
  stars.set('天马', tianMaMap[yearZhi]);
  
  return stars;
}

/**
 * 安擎羊、陀罗
 * 口诀：擎羊禄前一位，陀罗禄后一位
 */
function installYangTuo(yearGan: string): Map<string, number> {
  const stars = new Map<string, number>();
  
  // 先找禄存位置
  const luCunMap: { [key: string]: number } = {
    '甲': 2, '乙': 3, '丙': 5, '丁': 6, '戊': 5,
    '己': 6, '庚': 8, '辛': 9, '壬': 11, '癸': 0
  };
  
  const luCunPos = luCunMap[yearGan];
  
  // 擎羊：禄存前一位（顺时针）
  stars.set('擎羊', (luCunPos + 1) % 12);
  
  // 陀罗：禄存后一位（逆时针）
  stars.set('陀罗', (luCunPos - 1 + 12) % 12);
  
  return stars;
}

/**
 * 安火星、铃星
 * 口诀：
 * 申子辰年生人火星在寅宫起子时，铃星在戌宫起子时，均顺时针数到生时
 * 寅午戌年生人火星在丑宫起子时，铃星在卯宫起子时，均顺时针数到生时
 * 巳酉丑年生人火星在卯宫起子时，铃星在戌宫起子时，均顺时针数到生时
 * 亥卯未年生人火星在酉宫起子时，铃星在戌宫起子时，均顺时针数到生时
 */
function installHuoLing(yearZhi: string, hour: number): Map<string, number> {
  const stars = new Map<string, number>();
  const hourZhiIndex = getHourZhiIndex(hour);
  const zhiIndex = DIZHI.indexOf(yearZhi);
  
  // 确定火星起始宫位
  let huoStartPos: number;
  if ([8, 0, 4].includes(zhiIndex)) {
    // 申子辰 → 寅(2)
    huoStartPos = 2;
  } else if ([2, 6, 10].includes(zhiIndex)) {
    // 寅午戌 → 丑(1)
    huoStartPos = 1;
  } else if ([5, 9, 1].includes(zhiIndex)) {
    // 巳酉丑 → 卯(3)
    huoStartPos = 3;
  } else {
    // 亥卯未 → 酉(9)
    huoStartPos = 9;
  }
  
  // 确定铃星起始宫位
  let lingStartPos: number;
  if ([2, 6, 10].includes(zhiIndex)) {
    // 寅午戌 → 卯(3)
    lingStartPos = 3;
  } else {
    // 申子辰、巳酉丑、亥卯未 → 戌(10)
    lingStartPos = 10;
  }
  
  // 从起始宫位顺数到生时
  const huoPos = (huoStartPos + hourZhiIndex) % 12;
  const lingPos = (lingStartPos + hourZhiIndex) % 12;
  
  stars.set('火星', huoPos);
  stars.set('铃星', lingPos);
  
  return stars;
}

/**
 * 安地空、地劫
 * 口诀：地空亥宫起子时，逆数至生时；地劫亥宫起子时，顺数至生时
 */
function installKongJie(hour: number): Map<string, number> {
  const stars = new Map<string, number>();
  const hourZhiIndex = getHourZhiIndex(hour);
  
  // 地空：亥宫起子时，逆数至生时
  const diKongPos = (11 - hourZhiIndex + 12) % 12;
  stars.set('地空', diKongPos);
  
  // 地劫：亥宫起子时，顺数至生时
  const diJiePos = (11 + hourZhiIndex) % 12;
  stars.set('地劫', diJiePos);
  
  return stars;
}

/**
 * 安天魁、天钺
 * 口诀：按年干安星
 */
function installKuiYue(yearGan: string): Map<string, number> {
  const stars = new Map<string, number>();
  
  // 天魁定位
  // 口诀：甲戊庚牛羊，乙己鼠猴乡，丙丁猪鸡位，壬癸兔蛇藏，六辛逢马虎
  const tianKuiMap: { [key: string]: number } = {
    '甲': 1,  // 丑（牛）
    '乙': 0,  // 子（鼠）
    '丙': 11, // 亥（猪）
    '丁': 11, // 亥（猪）
    '戊': 1,  // 丑（牛）
    '己': 0,  // 子（鼠）
    '庚': 1,  // 丑（牛）
    '辛': 6,  // 午（马）
    '壬': 3,  // 卯（兔）
    '癸': 5   // 巳（蛇）
  };
  
  // 天钺定位
  const tianYueMap: { [key: string]: number } = {
    '甲': 7,  // 未（羊）
    '乙': 8,  // 申（猴）
    '丙': 9,  // 酉（鸡）
    '丁': 9,  // 酉（鸡）
    '戊': 7,  // 未（羊）
    '己': 8,  // 申（猴）
    '庚': 7,  // 未（羊）
    '辛': 2,  // 寅（虎）
    '壬': 5,  // 巳（蛇）
    '癸': 3   // 卯（兔）
  };
  
  stars.set('天魁', tianKuiMap[yearGan]);
  stars.set('天钺', tianYueMap[yearGan]);
  
  return stars;
}

/**
 * 创建紫微斗数排盘
 */
export function createZiweiChart(birthInfo: BirthInfo): ZiweiChart {
  try {
    // 1. 转换为农历
    const solar = Solar.fromYmdHms(
      birthInfo.year,
      birthInfo.month,
      birthInfo.day,
      birthInfo.hour,
      birthInfo.minute,
      0
    );
    const lunar: Lunar = solar.getLunar();
    
    const lunarYear = lunar.getYear();
    const lunarMonth = lunar.getMonth();
    const lunarDay = lunar.getDay();
    
    // 2. 获取四柱
    const yearGan = lunar.getYearGan();
    const yearZhi = lunar.getYearZhi();
    const monthGan = lunar.getMonthGan();
    const monthZhi = lunar.getMonthZhi();
    const dayGan = lunar.getDayGan();
    const dayZhi = lunar.getDayZhi();
    const hourGan = lunar.getTimeGan();
    const hourZhi = lunar.getTimeZhi();
    
    const siZhu = {
      year: { gan: yearGan as any, zhi: yearZhi as any },
      month: { gan: monthGan as any, zhi: monthZhi as any },
      day: { gan: dayGan as any, zhi: dayZhi as any },
      hour: { gan: hourGan as any, zhi: hourZhi as any }
    };
    
    // 3. 判断阴阳男女
    const yinYang = getYinYang(birthInfo.year, birthInfo.gender) as any;
    
    // 4. 计算命宫、身宫
    const mingGongIndex = calculateMingGong(lunarMonth, birthInfo.hour);
    const shenGongIndex = calculateShenGong(lunarMonth, birthInfo.hour);
    
    // 5. 计算命宫天干（用月干推算）
    const mingGongZhi = DIZHI[mingGongIndex];
    const mingGongGan = getMonthGan(yearGan, mingGongZhi);
    
    // 6. 计算五行局
    const wuXingJu = calculateWuXingJu(mingGongGan, mingGongZhi);
    
    // 7. 计算紫微星位置
    const ziweiPos = calculateZiweiPosition(lunarDay, wuXingJu.number);
    
    // 8. 安14主星
    const ziweiSeries = installZiweiSeries(ziweiPos);
    const tianfuPos = calculateTianfuPosition(ziweiPos);
    const tianfuSeries = installTianfuSeries(tianfuPos);
    
    const allMainStars = new Map([...ziweiSeries, ...tianfuSeries]);
    
    // 9. 安辅星系统
    const zuoYouStars = installZuoYou(lunarMonth);
    const wenXingStars = installWenXing(birthInfo.hour);
    const luMaStars = installLuMa(yearGan, yearZhi);
    const yangTuoStars = installYangTuo(yearGan);
    const huoLingStars = installHuoLing(yearZhi, birthInfo.hour);
    const kongJieStars = installKongJie(birthInfo.hour);
    const kuiYueStars = installKuiYue(yearGan);
    const hongLuanTianXiStars = installHongLuanTianXi(yearZhi);
    const tianXingStars = installTianXing(lunarMonth);
    const tianYaoStars = installTianYao(lunarMonth);
    
    const allAuxStars = new Map([
      ...zuoYouStars,
      ...wenXingStars,
      ...luMaStars,
      ...yangTuoStars,
      ...huoLingStars,
      ...kongJieStars,
      ...kuiYueStars,
      ...hongLuanTianXiStars,
      ...tianXingStars,
      ...tianYaoStars
    ]);
    
    // 10. 生成十二宫数据
    const gongs: ZiweiGongInfo[] = [];
    
    for (let i = 0; i < 12; i++) {
      // 宫位地支索引（从命宫开始逆时针）
      const gongZhiIndex = (mingGongIndex - i + 12) % 12;
      const dizhi = DIZHI[gongZhiIndex] as any;
      
      // 计算天干（使用五虎遁月诀）
      const tiangan = getMonthGan(yearGan, dizhi) as any;
      
      // 找出这个宫位的主星
      const mainStars: any[] = [];
      allMainStars.forEach((pos, star) => {
        if (pos === gongZhiIndex) {
          mainStars.push(star);
        }
      });
      
      // 找出这个宫位的辅星
      const auxStars: any[] = [];
      allAuxStars.forEach((pos, star) => {
        if (pos === gongZhiIndex) {
          auxStars.push(star);
        }
      });
      
      gongs.push({
        gong: GONG_NAMES[i] as any,
        dizhi,
        tiangan,
        mainStars,
        auxStars,
        sihua: []
      });
    }
    
    // 11. 添加本命四化（出生年干的四化）
    const gongsWithSiHua = addBenMingSiHua(gongs, yearGan as any);
    
    // 12. 计算大运信息
    const currentAge = calculateXuSui(birthInfo.year);
    const daXianList = calculateDaXian(mingGongIndex, yinYang as any, wuXingJu.number);
    
    // 13. 为每个宫位添加大运信息和流年
    // 找到当前大限
    const currentDaXian = daXianList.find(dx => currentAge >= dx.startAge && currentAge <= dx.endAge);
    
    // 计算当前大限对应的完整年份范围（10年）
    // 例如：2014年出生火六局，当前12岁在6~15岁大限，对应2019~2028年（完整10年）
    // 例如：1990年出生土五局，当前36岁在35~44岁大限，对应2024~2033年（完整10年）
    let liunianYearStart: number | undefined;
    let liunianYearEnd: number | undefined;
    if (currentDaXian) {
      const birthYear = birthInfo.year;
      // 大限开始年份 = 出生年份 + 大限开始年龄 - 1
      liunianYearStart = birthYear + currentDaXian.startAge - 1;
      // 大限结束年份 = 出生年份 + 大限结束年龄 - 1
      liunianYearEnd = birthYear + currentDaXian.endAge - 1;
    }
    
    // 十二宫名称列表（命宫开始逆时针）
    const GONG_NAMES_ORDER = ['命宫', '兄弟宫', '夫妻宫', '子女宫', '财帛宫', '疾厄宫', 
                              '迁移宫', '交友宫', '官禄宫', '田宅宫', '福德宫', '父母宫'];
    
    const gongsWithDaXian = gongsWithSiHua.map((gong, index) => {
      const gongZhiIndex = (mingGongIndex - index + 12) % 12;
      const daXian = daXianList.find(dx => dx.gongIndex === gongZhiIndex);
      
      // 计算流年：根据地支固定位置分配年份
      // 例如：2025年乙巳年，固定在巳宫；2026年丙午年，固定在午宫
      
      // 计算该宫位地支对应的年份
      // 地支循环：子丑寅卯辰巳午未申酉戌亥（0-11）
      const dizhiIndex = DIZHI.indexOf(gong.dizhi);
      
      // 计算该地支对应的年份（在当前大限范围内）
      let displayYear: number | undefined;
      if (liunianYearStart && liunianYearEnd) {
        // 遍历当前大限的所有年份，找到地支匹配的年份
        for (let year = liunianYearStart; year <= liunianYearEnd; year++) {
          const yearZhiIndex = (year - 4) % 12;
          if (yearZhiIndex === dizhiIndex) {
            displayYear = year;
            break;
          }
        }
      }
      
      // 计算大限宫位名（基于当前大限的起始宫位）
      let daXianGongName: string | undefined;
      if (currentDaXian) {
        // 找到当前大限的起始宫位在十二宫中的位置
        const currentDaXianGongIndex = gongsWithSiHua.findIndex(g => {
          const gZhiIndex = DIZHI.indexOf(g.dizhi);
          return gZhiIndex === currentDaXian.gongIndex;
        });
        
        // 计算当前宫位相对于大限命宫的偏移
        const offsetFromDaXianMing = (index - currentDaXianGongIndex + 12) % 12;
        
        // 根据偏移获取大限宫位名
        const daXianGongNameMap: { [key: string]: string } = {
          '命宫': '大命',
          '兄弟宫': '大兄',
          '夫妻宫': '大夫',
          '子女宫': '大子',
          '财帛宫': '大财',
          '疾厄宫': '大疾',
          '迁移宫': '大迁',
          '交友宫': '大友',
          '官禄宫': '大官',
          '田宅宫': '大田',
          '福德宫': '大福',
          '父母宫': '大父'
        };
        
        const correspondingGongName = GONG_NAMES_ORDER[offsetFromDaXianMing];
        daXianGongName = daXianGongNameMap[correspondingGongName];
      }
      
      if (daXian) {
        const isCurrent = currentAge >= daXian.startAge && currentAge <= daXian.endAge;
        
        // 计算该大运内的流年年龄列表
        const liuNianAges: number[] = [];
        for (let age = daXian.startAge; age <= daXian.endAge; age++) {
          liuNianAges.push(age);
        }
        
        return {
          ...gong,
          daXian: {
            startAge: daXian.startAge,
            endAge: daXian.endAge,
            isCurrent,
            daXianGongName
          },
          liuNian: liuNianAges,
          liuNianYear: displayYear
        };
      }
      
      return {
        ...gong,
        liuNianYear: displayYear
      };
    });
    
    return {
      birthInfo,
      lunarDate: {
        year: lunarYear,
        month: lunarMonth,
        day: lunarDay,
        monthCn: lunar.getMonthInChinese(),
        dayCn: lunar.getDayInChinese()
      },
      siZhu,
      yinYang,
      mingGongIndex,
      shenGongIndex,
      wuXingJu,
      gongs: gongsWithDaXian
    };
    
  } catch (error) {
    console.error('紫微斗数排盘失败:', error);
    throw new Error('紫微斗数排盘计算失败: ' + (error as Error).message);
  }
}

export function runZiweiTests() {
  console.error('紫微斗数测试功能待实现');
  return { passed: 0, failed: 0, details: [] };
}

/**
 * 安红鸾、天喜
 * 口诀：卯宫起子年，逆数至生年支；天喜为红鸾对宫
 */
function installHongLuanTianXi(yearZhi: string): Map<string, number> {
  const stars = new Map<string, number>();
  const zhiIndex = DIZHI.indexOf(yearZhi);
  
  // 红鸾：卯宫起子年，逆数至生年支
  const hongLuanPos = (3 - zhiIndex + 12) % 12;
  
  // 天喜：红鸾对宫
  const tianXiPos = (hongLuanPos + 6) % 12;
  
  stars.set('红鸾', hongLuanPos);
  stars.set('天喜', tianXiPos);
  
  return stars;
}

/**
 * 安天刑
 * 口诀：天刑酉上正月轮，数至生月便住脚
 */
function installTianXing(lunarMonth: number): Map<string, number> {
  const stars = new Map<string, number>();
  
  // 天刑：酉宫起正月，顺数至生月
  const tianXingPos = (9 + lunarMonth - 1) % 12;
  
  stars.set('天刑', tianXingPos);
  
  return stars;
}

/**
 * 安天姚
 * 口诀：天姚丑上顺正月，数至生月便住脚
 */
function installTianYao(lunarMonth: number): Map<string, number> {
  const stars = new Map<string, number>();
  
  // 天姚：丑宫起正月，顺数至生月
  const tianYaoPos = (1 + lunarMonth - 1) % 12;
  
  stars.set('天姚', tianYaoPos);
  
  return stars;
}
