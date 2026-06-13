// 八字基础查表 — 所有五行/十神/长生/调候底层数据

export type Tiangan = '甲'|'乙'|'丙'|'丁'|'戊'|'己'|'庚'|'辛'|'壬'|'癸';
export type Dizhi = '子'|'丑'|'寅'|'卯'|'辰'|'巳'|'午'|'未'|'申'|'酉'|'戌'|'亥';
export type WuXing = '木'|'火'|'土'|'金'|'水';
export type YinYang = '阳'|'阴';
export type ShiShen = '比肩'|'劫财'|'食神'|'伤官'|'偏财'|'正财'|'七杀'|'正官'|'偏印'|'正印';

export const TIANGAN: Tiangan[] = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
export const DIZHI: Dizhi[] = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

export const GAN_WUXING: Record<Tiangan, WuXing> = {
  甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'
};

export const GAN_YINYANG: Record<Tiangan, YinYang> = {
  甲:'阳',乙:'阴',丙:'阳',丁:'阴',戊:'阳',己:'阴',庚:'阳',辛:'阴',壬:'阳',癸:'阴'
};

export const ZHI_WUXING: Record<Dizhi, WuXing> = {
  子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'
};

// 地支藏干 — 本气、中气、余气
// [{gan, role}] 顺序：本气、中气、余气
export const ZHI_CANG_GAN: Record<Dizhi, Array<{gan: Tiangan, role: '本气'|'中气'|'余气'}>> = {
  子: [{gan:'癸',role:'本气'}],
  丑: [{gan:'己',role:'本气'},{gan:'癸',role:'中气'},{gan:'辛',role:'余气'}],
  寅: [{gan:'甲',role:'本气'},{gan:'丙',role:'中气'},{gan:'戊',role:'余气'}],
  卯: [{gan:'乙',role:'本气'}],
  辰: [{gan:'戊',role:'本气'},{gan:'乙',role:'中气'},{gan:'癸',role:'余气'}],
  巳: [{gan:'丙',role:'本气'},{gan:'庚',role:'中气'},{gan:'戊',role:'余气'}],
  午: [{gan:'丁',role:'本气'},{gan:'己',role:'中气'}],
  未: [{gan:'己',role:'本气'},{gan:'丁',role:'中气'},{gan:'乙',role:'余气'}],
  申: [{gan:'庚',role:'本气'},{gan:'壬',role:'中气'},{gan:'戊',role:'余气'}],
  酉: [{gan:'辛',role:'本气'}],
  戌: [{gan:'戊',role:'本气'},{gan:'辛',role:'中气'},{gan:'丁',role:'余气'}],
  亥: [{gan:'壬',role:'本气'},{gan:'甲',role:'中气'}]
};

// 五行生克
export function shengKe(a: WuXing, b: WuXing): '生'|'克'|'同'|'被生'|'被克' {
  if (a === b) return '同';
  const sheng: Record<WuXing, WuXing> = {木:'火',火:'土',土:'金',金:'水',水:'木'};
  const ke: Record<WuXing, WuXing> = {木:'土',火:'金',土:'水',金:'木',水:'火'};
  if (sheng[a] === b) return '生';
  if (ke[a] === b) return '克';
  if (sheng[b] === a) return '被生';
  if (ke[b] === a) return '被克';
  return '同'; // unreachable
}

// 十神 — 以日干为基准对其他天干
export function getShiShen(dayMaster: Tiangan, target: Tiangan): ShiShen {
  const dmWx = GAN_WUXING[dayMaster];
  const dmYy = GAN_YINYANG[dayMaster];
  const tWx = GAN_WUXING[target];
  const tYy = GAN_YINYANG[target];
  const sameYy = dmYy === tYy;
  const rel = shengKe(dmWx, tWx);
  switch (rel) {
    case '同': return sameYy ? '比肩' : '劫财';
    case '生': return sameYy ? '食神' : '伤官'; // 日主生他, 同性食神
    case '克': return sameYy ? '偏财' : '正财'; // 日主克他
    case '被克': return sameYy ? '七杀' : '正官'; // 他克日主
    case '被生': return sameYy ? '偏印' : '正印'; // 他生日主
  }
}

// 十二长生 — 阳干顺行、阴干逆行
// 长生位起点
const CHANG_SHENG_START: Record<Tiangan, Dizhi> = {
  甲:'亥',丙:'寅',戊:'寅',庚:'巳',壬:'申',
  乙:'午',丁:'酉',己:'酉',辛:'子',癸:'卯'
};
const CHANG_SHENG_ORDER = ['长生','沐浴','冠带','临官','帝旺','衰','病','死','墓','绝','胎','养'] as const;
export type ChangSheng = typeof CHANG_SHENG_ORDER[number];

export function getChangSheng(gan: Tiangan, zhi: Dizhi): ChangSheng {
  const start = CHANG_SHENG_START[gan];
  const startIdx = DIZHI.indexOf(start);
  const zhiIdx = DIZHI.indexOf(zhi);
  const forward = GAN_YINYANG[gan] === '阳';
  let step;
  if (forward) {
    step = (zhiIdx - startIdx + 12) % 12;
  } else {
    step = (startIdx - zhiIdx + 12) % 12;
  }
  return CHANG_SHENG_ORDER[step];
}

// 调候用神 — 穷通宝鉴 120 格 (日干 × 月支)
// 每格 1-3 字, 主用神在前
// 注: 这是子平派主流取用法, 不同流派有微调
export const TIAO_HOU: Record<Tiangan, Record<Dizhi, string[]>> = {
  // 甲木
  甲: {
    子:['丁','庚','丙'], 丑:['丁','庚','丙'], 寅:['丙','癸'],
    卯:['庚','丙','丁','戊','己'], 辰:['庚','丁','壬'], 巳:['癸','丁','庚'],
    午:['癸','丁','庚'], 未:['癸','丁','庚'], 申:['庚','丁','壬'],
    酉:['庚','丙','丁'], 戌:['庚','甲','壬','癸'], 亥:['庚','丁','戊','丙']
  },
  // 乙木
  乙: {
    子:['丙','戊'], 丑:['丙'], 寅:['丙','癸'],
    卯:['丙','癸'], 辰:['癸','丙','戊'], 巳:['癸'],
    午:['癸','丙'], 未:['癸','丙'], 申:['丙','癸','己'],
    酉:['癸','丁','丙'], 戌:['癸','辛'], 亥:['丙','戊']
  },
  // 丙火
  丙: {
    子:['壬','戊','己'], 丑:['壬','甲'], 寅:['壬','庚'],
    卯:['壬','己'], 辰:['壬','甲'], 巳:['壬','庚','癸'],
    午:['壬','庚'], 未:['壬','庚'], 申:['壬','戊'],
    酉:['壬','癸'], 戌:['甲','壬'], 亥:['甲','戊','庚','壬']
  },
  // 丁火
  丁: {
    子:['甲','庚'], 丑:['甲','庚'], 寅:['庚','壬'],
    卯:['庚','甲'], 辰:['甲','庚'], 巳:['甲','庚'],
    午:['壬','庚','癸'], 未:['甲','壬','庚'], 申:['甲','庚','丙','戊'],
    酉:['甲','庚','丙','戊'], 戌:['甲','庚','戊'], 亥:['甲','庚']
  },
  // 戊土
  戊: {
    子:['丙','甲'], 丑:['丙','甲'], 寅:['丙','甲','癸'],
    卯:['丙','甲','癸'], 辰:['甲','丙','癸'], 巳:['甲','丙','癸'],
    午:['壬','甲','丙'], 未:['癸','丙','甲'], 申:['丙','癸','甲'],
    酉:['丙','癸'], 戌:['甲','丙','癸'], 亥:['甲','丙']
  },
  // 己土
  己: {
    子:['丙','甲','戊'], 丑:['丙','甲','戊'], 寅:['丙','庚','甲'],
    卯:['甲','癸','丙'], 辰:['丙','癸','甲'], 巳:['癸','丙'],
    午:['癸','丙'], 未:['癸','丙'], 申:['丙','癸'],
    酉:['丙','癸'], 戌:['甲','丙','癸'], 亥:['丙','甲','戊']
  },
  // 庚金
  庚: {
    子:['丁','甲','丙'], 丑:['丙','丁','甲'], 寅:['丙','甲','壬'],
    卯:['丁','甲','庚','丙'], 辰:['甲','丁','壬','癸'], 巳:['壬','戊','丙','丁'],
    午:['壬','癸'], 未:['丁','甲'], 申:['丁','甲'],
    酉:['丁','甲','丙'], 戌:['甲','壬'], 亥:['丁','丙']
  },
  // 辛金
  辛: {
    子:['丙','戊','壬','甲'], 丑:['丙','壬','戊','己'], 寅:['己','壬','庚'],
    卯:['壬','甲'], 辰:['壬','甲'], 巳:['壬','甲','癸'],
    午:['壬','己','癸'], 未:['壬','庚','甲'], 申:['壬','甲','戊'],
    酉:['壬','甲'], 戌:['壬','甲'], 亥:['壬','丙']
  },
  // 壬水
  壬: {
    子:['戊','丙'], 丑:['丙','丁','甲'], 寅:['庚','丙','戊'],
    卯:['戊','辛','庚'], 辰:['甲','庚'], 巳:['壬','辛','庚','癸'],
    午:['癸','庚','辛'], 未:['辛','甲'], 申:['戊','丁'],
    酉:['甲','庚'], 戌:['甲','丙'], 亥:['戊','丙','庚']
  },
  // 癸水
  癸: {
    子:['丙','辛'], 丑:['丙','丁'], 寅:['辛','丙'],
    卯:['庚','辛'], 辰:['丙','辛','甲'], 巳:['辛'],
    午:['庚','辛','壬','癸'], 未:['庚','辛','壬','癸'], 申:['丁'],
    酉:['辛','丙'], 戌:['辛','甲','壬','癸'], 亥:['庚','辛','戊','丁']
  }
};

// 月令旺相休囚死 — 五行随月令的状态
export function getWuXingMonthStatus(monthZhi: Dizhi): Record<WuXing, '旺'|'相'|'休'|'囚'|'死'> {
  const monthWx = ZHI_WUXING[monthZhi];
  // 当令=旺; 当令所生=相; 生当令者=休; 克当令者=囚; 当令所克=死
  const result: Record<WuXing, '旺'|'相'|'休'|'囚'|'死'> = {} as any;
  const allWx: WuXing[] = ['木','火','土','金','水'];
  for (const wx of allWx) {
    const rel = shengKe(monthWx, wx);
    if (rel === '同') result[wx] = '旺';
    else if (rel === '生') result[wx] = '相';
    else if (rel === '被生') result[wx] = '休';
    else if (rel === '被克') result[wx] = '囚';
    else if (rel === '克') result[wx] = '死';
  }
  return result;
}
