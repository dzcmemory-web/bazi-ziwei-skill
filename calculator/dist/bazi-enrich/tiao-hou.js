"use strict";
// 调候用神 — 穷通宝鉴查表 wrapper
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTiaoHou = getTiaoHou;
const tables_1 = require("./tables");
function getTiaoHou(dayMaster, monthZhi) {
    return tables_1.TIAO_HOU[dayMaster][monthZhi];
}
