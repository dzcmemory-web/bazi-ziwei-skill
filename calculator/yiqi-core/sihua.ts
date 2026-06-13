// 紫微斗数四化系统

import { Tiangan, SiHua } from './types';

/**
 * 四化星曜（按年干）
 * 格式：{ 年干: { 化禄, 化权, 化科, 化忌 } }
 */
const SIHUA_BY_YEAR_GAN: { [key in Tiangan]: { lu: string; quan: string; ke: string; ji: string } } = {
  '甲': { lu: '廉贞', quan: '破军', ke: '武曲', ji: '太阳' },
  '乙': { lu: '天机', quan: '天梁', ke: '紫微', ji: '太阴' },
  '丙': { lu: '天同', quan: '天机', ke: '文昌', ji: '廉贞' },
  '丁': { lu: '太阴', quan: '天同', ke: '天机', ji: '巨门' },
  '戊': { lu: '贪狼', quan: '太阴', ke: '右弼', ji: '天机' },
  '己': { lu: '武曲', quan: '贪狼', ke: '天梁', ji: '文曲' },
  '庚': { lu: '太阳', quan: '武曲', ke: '太阴', ji: '天同' },
  '辛': { lu: '巨门', quan: '太阳', ke: '文曲', ji: '文昌' },
  '壬': { lu: '天梁', quan: '紫微', ke: '左辅', ji: '武曲' },
  '癸': { lu: '破军', quan: '巨门', ke: '太阴', ji: '贪狼' }
};

/**
 * 获取指定天干的四化
 */
export function getSiHuaByGan(gan: Tiangan): { lu: string; quan: string; ke: string; ji: string } {
  return SIHUA_BY_YEAR_GAN[gan];
}

/**
 * 计算某个宫位的四化（用于飞化）
 * @param gan 宫位天干
 * @param gongStars 宫位内的星曜列表
 * @returns 该宫位飞化出的四化星及其位置
 */
export function calculateFeiHua(gan: Tiangan, allGongs: any[]): {
  lu: { star: string; targetGong: string } | null;
  quan: { star: string; targetGong: string } | null;
  ke: { star: string; targetGong: string } | null;
  ji: { star: string; targetGong: string } | null;
} {
  const sihua = getSiHuaByGan(gan);
  
  const result = {
    lu: null as { star: string; targetGong: string } | null,
    quan: null as { star: string; targetGong: string } | null,
    ke: null as { star: string; targetGong: string } | null,
    ji: null as { star: string; targetGong: string } | null
  };
  
  // 找到化禄、化权、化科、化忌的星曜所在宫位（包括主星和辅星）
  for (const gong of allGongs) {
    const allStars = [...gong.mainStars, ...(gong.auxStars || [])];
    
    if (allStars.includes(sihua.lu)) {
      result.lu = { star: sihua.lu, targetGong: gong.gong };
    }
    if (allStars.includes(sihua.quan)) {
      result.quan = { star: sihua.quan, targetGong: gong.gong };
    }
    if (allStars.includes(sihua.ke)) {
      result.ke = { star: sihua.ke, targetGong: gong.gong };
    }
    if (allStars.includes(sihua.ji)) {
      result.ji = { star: sihua.ji, targetGong: gong.gong };
    }
  }
  
  return result;
}

/**
 * 为命盘添加本命四化（出生年干的四化）
 */
export function addBenMingSiHua(gongs: any[], yearGan: Tiangan): any[] {
  const sihua = getSiHuaByGan(yearGan);
  
  return gongs.map(gong => {
    const sihuaList: { star: string; hua: SiHua }[] = [];
    
    // 检查宫位内的主星和辅星是否有四化
    const allStars = [...gong.mainStars, ...(gong.auxStars || [])];
    
    allStars.forEach((star: string) => {
      if (star === sihua.lu) {
        sihuaList.push({ star, hua: '化禄' });
      }
      if (star === sihua.quan) {
        sihuaList.push({ star, hua: '化权' });
      }
      if (star === sihua.ke) {
        sihuaList.push({ star, hua: '化科' });
      }
      if (star === sihua.ji) {
        sihuaList.push({ star, hua: '化忌' });
      }
    });
    
    return {
      ...gong,
      sihua: sihuaList
    };
  });
}

/**
 * 获取四化的颜色样式
 */
export function getSiHuaColor(hua: SiHua): string {
  switch (hua) {
    case '化禄': return '#22c55e'; // 绿色
    case '化权': return '#a855f7'; // 紫色
    case '化科': return '#3b82f6'; // 蓝色
    case '化忌': return '#ef4444'; // 红色
    default: return '#666';
  }
}

/**
 * 获取四化的简称
 */
export function getSiHuaShort(hua: SiHua): string {
  switch (hua) {
    case '化禄': return '禄';
    case '化权': return '权';
    case '化科': return '科';
    case '化忌': return '忌';
    default: return '';
  }
}
