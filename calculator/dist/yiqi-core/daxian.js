"use strict";
// 大运计算模块
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDaXian = calculateDaXian;
exports.getCurrentDaXian = getCurrentDaXian;
exports.getDaXianForGong = getDaXianForGong;
exports.calculateXuSui = calculateXuSui;
exports.getLiuNianGanZhi = getLiuNianGanZhi;
exports.getGongIndexByZhi = getGongIndexByZhi;
/**
 * 天干数组
 */
const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
/**
 * 地支数组
 */
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
/**
 * 计算大运信息
 * @param mingGongIndex 命宫索引（0-11，子=0）
 * @param yinYang 阴阳男女
 * @param wuXingJuNumber 五行局数（2,3,4,5,6）
 * @param currentAge 当前年龄（虚岁），用于标记当前大运
 * @returns 大运信息数组（10个大运）
 */
function calculateDaXian(mingGongIndex, yinYang, wuXingJuNumber, currentAge = 0) {
    const daXianList = [];
    // 判断大运方向
    // 阳男、阴女：大限顺时针走（地支索引递增：丑→寅→卯...）
    // 阴男、阳女：大限逆时针走（地支索引递减：丑→子→亥...）
    const isShunShiZhen = yinYang === '阳男' || yinYang === '阴女';
    const direction = isShunShiZhen ? 'shun' : 'ni';
    // 起运年龄由五行局决定
    const startAge = wuXingJuNumber;
    // 生成12个大运（每个大运管10年）
    for (let i = 0; i < 12; i++) {
        const age = startAge + i * 10;
        const endAge = age + 9;
        // 计算大运宫位（从命宫开始）
        // gongIndex 是地支索引（0-11：子丑寅卯辰巳午未申酉戌亥）
        let gongIndex;
        if (isShunShiZhen) {
            // 阳男、阴女：顺时针走，地支索引递增
            // 例如命宫在丑(1)，第1大限在丑(1)，第2大限在寅(2)，第3大限在卯(3)
            gongIndex = (mingGongIndex + i) % 12;
        }
        else {
            // 阴男、阳女：逆时针走，地支索引递减
            // 例如命宫在丑(1)，第1大限在丑(1)，第2大限在子(0)，第3大限在亥(11)
            gongIndex = (mingGongIndex - i + 12) % 12;
        }
        daXianList.push({
            gongIndex,
            startAge: age,
            endAge,
            ganZhi: '', // 这里可以添加大运干支，暂时留空
            direction
        });
    }
    return daXianList;
}
/**
 * 计算当前年龄的大运
 */
function getCurrentDaXian(daXianList, age) {
    return daXianList.find(dx => age >= dx.startAge && age <= dx.endAge) || null;
}
/**
 * 获取宫位的大运信息
 */
function getDaXianForGong(gongIndex, daXianList) {
    return daXianList.find(dx => dx.gongIndex === gongIndex) || null;
}
/**
 * 计算虚岁
 */
function calculateXuSui(birthYear, currentYear = new Date().getFullYear()) {
    return currentYear - birthYear + 1;
}
/**
 * 计算流年干支
 * @param year 公历年份
 */
function getLiuNianGanZhi(year) {
    const ganIndex = (year - 4) % 10; // 甲子年是1984年，1984-4=1980，1980%10=0
    const zhiIndex = (year - 4) % 12;
    return {
        gan: TIANGAN[ganIndex],
        zhi: DIZHI[zhiIndex]
    };
}
/**
 * 根据流年地支获取宫位索引
 * @param zhi 地支
 * @returns 宫位索引（0=子，1=丑，...，11=亥）
 */
function getGongIndexByZhi(zhi) {
    return DIZHI.indexOf(zhi);
}
