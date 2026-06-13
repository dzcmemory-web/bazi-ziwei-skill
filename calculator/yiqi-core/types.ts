// 核心数据类型定义

// 生辰信息
export interface BirthInfo {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  isLunar: boolean; // 是否为农历
  gender: 'male' | 'female';
  timeZone: number; // 时区偏移，默认为8（北京时间）
}

// 保存的案例
export interface SavedCase {
  id: string;
  name: string;
  birthForm: BirthInfo & { name: string };
  chartResult: ChartResult;
  savedAt: string;
}

// 天干地支
export type Tiangan = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';
export type Dizhi = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';

// 干支组合
export interface GanZhi {
  gan: Tiangan;
  zhi: Dizhi;
}

// 四柱信息
export interface SiZhu {
  year: GanZhi;
  month: GanZhi;
  day: GanZhi;
  hour: GanZhi;
}

// 十神
export type ShiShen = '比肩' | '劫财' | '食神' | '伤官' | '偏财' | '正财' | '七杀' | '正官' | '偏印' | '正印';

// 流年信息
export interface LiuNian {
  year: number; // 公历年份
  age: number; // 虚岁
  ganZhi: GanZhi; // 流年干支
}

// 大运详情
export interface DayunDetail {
  ganZhi: GanZhi; // 大运干支
  startAge: number; // 起始岁数
  startYear: number; // 起始年份
  endYear: number; // 结束年份
  ganShiShen: ShiShen; // 天干十神
  zhiShiShen: ShiShen; // 地支十神（地支藏干主气的十神）
  liuNian: LiuNian[]; // 该大运内的流年列表
}

// 八字排盘结果
export interface BaziChart {
  birthInfo: BirthInfo;
  siZhu: SiZhu;
  dayMaster: Tiangan; // 日主
  shiShen: {
    year: ShiShen;
    month: ShiShen;
    day: ShiShen;
    hour: ShiShen;
  };
  // 添加长生（星运）- zhangSheng 不是 changSheng
  zhangSheng?: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  // 添加纳音
  naYin?: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  dayunStart: number; // 大运起运岁数
  dayun: DayunDetail[]; // 大运详情列表，通常显示前10步
}

// 紫微斗数十二宫
export type ZiweiGong = '命宫' | '兄弟宫' | '夫妻宫' | '子女宫' | '财帛宫' | '疾厄宫' | 
                        '迁移宫' | '交友宫' | '官禄宫' | '田宅宫' | '福德宫' | '父母宫';

// 紫微斗数主星
export type ZiweiMainStar = '紫微' | '天机' | '太阳' | '武曲' | '天同' | '廉贞' | '天府' | 
                           '太阴' | '贪狼' | '巨门' | '天相' | '天梁' | '七杀' | '破军';

// 紫微斗数辅星
export type ZiweiAuxStar = '左辅' | '右弼' | '天魁' | '天钺' | '文昌' | '文曲' | '禄存' | 
                          '天马' | '擎羊' | '陀罗' | '火星' | '铃星' | '地空' | '地劫' |
                          '红鸾' | '天喜' | '天刑' | '天姚';

// 四化
export type SiHua = '化禄' | '化权' | '化科' | '化忌';

// 紫微斗数宫位信息
export interface ZiweiGongInfo {
  gong: ZiweiGong;
  dizhi: Dizhi;
  tiangan: Tiangan; // 宫位天干
  mainStars: ZiweiMainStar[];
  auxStars: ZiweiAuxStar[];
  sihua: { star: string; hua: SiHua }[];
  daXian?: { // 大运信息
    startAge: number;
    endAge: number;
    isCurrent?: boolean; // 是否为当前大运
    daXianGongName?: string; // 大限宫位名（如"大命""大兄"等），基于当前大限起始宫位计算
  };
  liuNian?: number[]; // 流年年龄列表
  liuNianYear?: number; // 流年年份（如2025），按地支固定位置
  liuNianGongName?: string; // 流年宫位名（如"年命""年兄"等），基于选中流年计算
}

// 紫微斗数排盘结果
export interface ZiweiChart {
  birthInfo: BirthInfo;
  gongs: ZiweiGongInfo[]; // 十二宫信息
  mingGongIndex: number; // 命宫在地支中的位置(0-11)
  shenGongIndex: number; // 身宫在地支中的位置(0-11)
  yinYang?: '阳男' | '阴男' | '阳女' | '阴女'; // 阴阳男女
  wuXingJu?: { // 五行局
    name: string; // 如"水二局"
    number: number; // 如2
  };
  siZhu?: SiZhu; // 四柱信息（年月日时天干地支）
  lunarDate?: { // 农历日期
    year: number;
    month: number;
    day: number;
    monthCn?: string; // 中文月份
    dayCn?: string; // 中文日期
  };
}

// 完整的排盘结果
export interface ChartResult {
  bazi: BaziChart;
  ziwei: ZiweiChart;
}
