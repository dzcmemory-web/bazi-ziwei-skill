// 渲染脚本: 算法 JSON + 分析 JSON + 模板 → 单文件 HTML
//
// 用法:
//   npx tsx render.ts \
//     --chart=path/to/chart.json \
//     --analysis=path/to/analysis.json \
//     --template=../templates/report-zonghe-poster.html \
//     --output=path/to/output.html
//
// chart.json: run-chart.ts 的输出 (算法层)
// analysis.json: LLM 按 zonghe-poster.md schema 输出的 JSON

import * as fs from 'fs';
import * as path from 'path';

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) args[m[1]] = m[2];
  }
  return args;
}

const DIZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

function calcVirtualAge(birthYear: number, currentYear: number): number {
  return currentYear - birthYear + 1;
}

function chartToFlat(chart: any, currentYear?: number): Record<string, any> {
  const out: Record<string, any> = {};
  const bi = chart.bazi.birthInfo;
  const bz = chart.bazi;
  const zw = chart.ziwei;
  currentYear = currentYear || new Date().getFullYear();
  const virtualAge = calcVirtualAge(bi.year, currentYear);

  // ============ META ============
  out['meta.solar_date'] = `${bi.year}-${String(bi.month).padStart(2,'0')}-${String(bi.day).padStart(2,'0')} ${String(bi.hour).padStart(2,'0')}:${String(bi.minute).padStart(2,'0')}`;
  if (zw.lunarDate) {
    out['meta.lunar_date'] = `${zw.lunarDate.year}年 ${zw.lunarDate.monthCn}月${zw.lunarDate.dayCn} ${zw.lunarDate.hourCn || ''}`.trim();
  } else {
    out['meta.lunar_date'] = '-';
  }
  out['meta.gender_full'] = bi.gender === 'male' ? '男（' + (zw.yinYang || '') + '）' : '女（' + (zw.yinYang || '') + '）';
  out['meta.age_virtual'] = virtualAge.toString();
  out['meta.current_year'] = currentYear.toString();
  const now = new Date();
  out['meta.gen_time'] = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  out['meta.yinyang'] = zw.yinYang || '-';

  // ============ ZIWEI META ============
  // Yiqi 没明确输出 命主/身主/子年斗君 — 从十二宫推导 / 留空
  // 简化: 默认根据命宫地支查命主, 身宫地支查身主
  const MING_ZHU = { '子':'贪狼','丑':'巨门','寅':'禄存','卯':'文曲','辰':'廉贞','巳':'武曲','午':'破军','未':'武曲','申':'廉贞','酉':'文曲','戌':'禄存','亥':'巨门' };
  const SHEN_ZHU = { '子':'火星','丑':'天相','寅':'天梁','卯':'天同','辰':'文昌','巳':'天机','午':'火星','未':'天相','申':'天梁','酉':'天同','戌':'文昌','亥':'天机' };
  const mingDizhi = zw.gongs[0].dizhi;
  const shenDizhi = DIZHI[zw.shenGongIndex];
  out['ziwei.ming_zhu'] = (MING_ZHU as any)[mingDizhi] || '-';
  out['ziwei.shen_zhu'] = (SHEN_ZHU as any)[shenDizhi] || '-';
  // 子年斗君: 简化处理, 按生月+生时推算复杂, 暂用身宫前后位作占位
  out['ziwei.zi_dou_jun'] = zw.ziDouJun || '-';
  out['ziwei.wuxing_ju'] = zw.wuXingJu?.name || '-';

  // ============ CORE DATA ============
  const en = bz.enrichment;
  out['core.geju'] = en?.格局?.primary || '-';
  out['core.geju_confidence'] = en?.格局?.confidence || '-';
  out['core.wangshuai_verdict'] = en?.旺衰?.verdict || '-';
  out['core.wangshuai_score'] = en?.旺衰?.score?.toString() || '-';
  // 把 score 映射到 0-100% (假设 score -10 ~ +10)
  const ws = en?.旺衰?.score ?? 0;
  out['core.wangshuai_pos_pct'] = Math.max(0, Math.min(100, Math.round((ws + 10) * 5))).toString();
  const tc = en?.调候用神 || [];
  out['core.tiaohou.0'] = tc[0] || '-';
  out['core.tiaohou.1'] = tc[1] || '-';
  out['core.tiaohou_confidence'] = '高';

  const yl = en?.五行旺相 || {};
  for (const k of ['木','火','土','金','水']) {
    out[`core.yueling.${k}`] = yl[k] || '-';
  }

  const wx = en?.五行统计?.withCangGan || en?.五行统计 || { 木:0,火:0,土:0,金:0,水:0 };
  for (const k of ['木','火','土','金','水']) out[`core.wuxing.${k}`] = wx[k] ?? '-';
  const wxMax = Math.max(...['木','火','土','金','水'].map(k => +wx[k] || 0)) || 1;
  for (const k of ['木','火','土','金','水']) out[`core.wuxing_pct.${k}`] = Math.round(((+wx[k] || 0) / wxMax) * 100);

  // ============ ZIWEI 12 GONGS ============
  const sihuaCharMap: any = { 化禄:'禄', 化权:'权', 化科:'科', 化忌:'忌' };
  for (const g of zw.gongs) {
    const mainStarsHtml = (g.mainStars && g.mainStars.length > 0)
      ? g.mainStars.map((s: string) => {
          const sh = (g.sihua || []).find((x: any) => x.star === s);
          if (sh) {
            const huaChar = sihuaCharMap[sh.hua] || sh.hua.slice(-1);
            return `<span class="sihua-${huaChar}">${s}<span class="sihua-tag">${huaChar}</span></span>`;
          }
          return s;
        }).join('·')
      : '<span style="color:var(--ink-faint)">无主星</span>';
    // 辅星同样要处理四化（右弼化科 / 文昌化忌 / 文曲化科 等常落辅星）
    const auxStarsHtml = (g.auxStars && g.auxStars.length > 0)
      ? g.auxStars.map((s: string) => {
          const sh = (g.sihua || []).find((x: any) => x.star === s);
          if (sh) {
            const huaChar = sihuaCharMap[sh.hua] || sh.hua.slice(-1);
            return `<span class="sihua-${huaChar}">${s}<span class="sihua-tag">${huaChar}</span></span>`;
          }
          return s;
        }).join('·')
      : '—';
    out[`gongs.${g.dizhi}.name`] = g.gong.endsWith('宫') ? g.gong : g.gong + '宫';
    out[`gongs.${g.dizhi}.ganzhi`] = g.tiangan + g.dizhi;
    out[`gongs.${g.dizhi}.mainStarsHtml`] = mainStarsHtml;
    out[`gongs.${g.dizhi}.auxStars`] = auxStarsHtml;
    out[`gongs.${g.dizhi}.smallStars`] = '';
    out[`gongs.${g.dizhi}.daxian_range`] = g.daXian ? `${g.daXian.startAge}-${g.daXian.endAge}` : '-';
    // 命宫红框 / 身宫徽标 / 当前大限高亮 — 数据驱动, 不硬编码到模板
    const flags: string[] = [];
    if (g.dizhi === mingDizhi) flags.push('ming');
    if (g.dizhi === shenDizhi) flags.push('shen');
    if (g.daXian && g.daXian.startAge <= virtualAge && virtualAge <= g.daXian.endAge) flags.push('current-daxian');
    out[`gongs.${g.dizhi}.flag`] = flags.join(' ');
    out[`gongs.${g.dizhi}.shenBadge`] = (g.dizhi === shenDizhi) ? '<span class="shen-badge">身</span>' : '';
  }

  // ============ BAZI 4 PILLARS ============
  const cangGanFmt = (arr: any[]) => (arr || []).map((x: any) => `${x.gan}(${x.shiShen})`).join(' ');
  const pillarKeyToCn: any = { year: '年', month: '月', day: '日', hour: '时' };
  for (const k of ['year','month','day','hour']) {
    out[`bazi.${k}.shiShen`] = bz.shiShen?.[k] || '-';
    out[`bazi.${k}.gan`] = bz.siZhu[k].gan;
    out[`bazi.${k}.zhi`] = bz.siZhu[k].zhi;
    out[`bazi.${k}.cangGanHtml`] = cangGanFmt(bz.cangGan?.[k] || []);
    out[`bazi.${k}.zhangSheng`] = bz.zhangSheng?.[k] || '-';
    out[`bazi.${k}.ziZuo`] = en?.自坐?.[pillarKeyToCn[k]] || en?.自坐?.[k] || '-';
    out[`bazi.${k}.naYin`] = bz.naYin?.[k] || '-';
  }
  out['bazi.dayunStart'] = bz.dayunStart?.toString() || '-';

  // ============ DAYUN 10 ============
  const dayunArr = (bz.dayun || []).slice(0, 10);
  let currentDayun: any = null;
  for (let i = 0; i < 10; i++) {
    const d = dayunArr[i];
    if (d && d.startAge <= virtualAge && virtualAge <= d.endAge) currentDayun = d;
  }
  for (let i = 0; i < 10; i++) {
    const d = dayunArr[i];
    if (!d) {
      ['gz','age_range','shishen','current_class'].forEach(f => out[`dayun.${i}.${f}`] = '-');
      continue;
    }
    out[`dayun.${i}.gz`] = d.ganZhi.gan + d.ganZhi.zhi;
    out[`dayun.${i}.age_range`] = `${d.startAge}-${d.endAge}`;
    const sg = (d.ganShiShen || '').slice(0,1);
    const sz = (d.zhiShiShen || '').slice(0,1);
    out[`dayun.${i}.shishen`] = sg + sz;
    out[`dayun.${i}.current_class`] = (currentDayun && d === currentDayun) ? 'current dayun' : '';
  }

  // ============ SECTION 02 阶段印证时间轴 (从 chart 算, 不靠 LLM) ============
  // 八字大运: 前 7 段
  const dayunForStage = dayunArr.slice(0, 7);
  for (let i = 0; i < 7; i++) {
    const d = dayunForStage[i];
    if (!d) {
      ['range','gz','shishen','current_class'].forEach(f => out[`section_02.bazi.${i}.${f}`] = '-');
      continue;
    }
    out[`section_02.bazi.${i}.range`] = `${d.startAge}-${d.endAge}`;
    out[`section_02.bazi.${i}.gz`] = d.ganZhi.gan + d.ganZhi.zhi;
    const sg = (d.ganShiShen || '').slice(0,1);
    const sz = (d.zhiShiShen || '').slice(0,1);
    out[`section_02.bazi.${i}.shishen`] = sg + sz;
    out[`section_02.bazi.${i}.current_class`] = (d.startAge <= virtualAge && virtualAge <= d.endAge) ? 'current' : '';
  }

  // 紫微大限: 按 startAge 排序取前 7 段
  const ziweiDaxian = zw.gongs
    .filter((g: any) => g.daXian)
    .map((g: any) => ({ startAge: g.daXian.startAge, endAge: g.daXian.endAge, gong: g.gong }))
    .sort((a: any, b: any) => a.startAge - b.startAge)
    .slice(0, 7);
  for (let i = 0; i < 7; i++) {
    const d = ziweiDaxian[i];
    if (!d) {
      ['range','current_class'].forEach(f => out[`section_02.ziwei.${i}.${f}`] = '-');
      continue;
    }
    out[`section_02.ziwei.${i}.range`] = `${d.startAge}-${d.endAge}`;
    out[`section_02.ziwei.${i}.current_class`] = (d.startAge <= virtualAge && virtualAge <= d.endAge) ? 'current' : '';
  }

  // ============ LIUNIAN 10 (current dayun) ============
  if (currentDayun) {
    out['liunian_dayun_label'] = `${currentDayun.ganZhi.gan}${currentDayun.ganZhi.zhi} ${currentDayun.startAge}-${currentDayun.endAge}`;
  } else {
    out['liunian_dayun_label'] = '-';
  }
  const liunianArr = ((currentDayun?.liuNian) || []).slice(0, 10);
  for (let i = 0; i < 10; i++) {
    const ln = liunianArr[i];
    if (!ln) {
      ['year','age','gz','shishen','current_class'].forEach(f => out[`liunian.${i}.${f}`] = '-');
      continue;
    }
    out[`liunian.${i}.year`] = ln.year;
    out[`liunian.${i}.age`] = ln.age;
    out[`liunian.${i}.gz`] = ln.ganZhi.gan + ln.ganZhi.zhi;
    out[`liunian.${i}.shishen`] = ln.ganShiShen ? (ln.ganShiShen.slice(0,1) + (ln.zhiShiShen?.slice(0,1) || '')) : '';
    out[`liunian.${i}.current_class`] = (ln.age === virtualAge) ? 'current' : '';
  }

  return out;
}

function analysisToFlat(analysis: any): Record<string, any> {
  const out: Record<string, any> = {};

  // meta
  if (analysis.meta) {
    out['meta.archetype_name'] = analysis.meta.archetype_name;
    out['meta.axis_oneliner'] = analysis.meta.axis_oneliner;
  }

  // axes + consistency
  if (analysis.axes) {
    out['axes.bazi_main'] = analysis.axes.bazi_main;
    out['axes.ziwei_main'] = analysis.axes.ziwei_main;
  }
  if (analysis.consistency) out['ziwei.consistency'] = analysis.consistency;

  // strengths / weaknesses
  for (let i = 0; i < 3; i++) {
    const s = analysis.strengths?.[i] || {};
    out[`strengths.${i}.title`] = s.title || '-';
    out[`strengths.${i}.desc`] = s.desc || '-';
    const w = analysis.weaknesses?.[i] || {};
    out[`weaknesses.${i}.title`] = w.title || '-';
    out[`weaknesses.${i}.desc`] = w.desc || '-';
  }

  // section 01
  if (analysis.section_01) {
    out['section_01.text'] = analysis.section_01.text || '-';
    out['section_01.word_count'] = analysis.section_01.word_count || '-';
  }

  // section 02 - bazi/ziwei dayun ranges already from chart, only conclusion
  if (analysis.section_02) {
    out['section_02.conclusion'] = analysis.section_02.conclusion || '-';
  }

  // dim
  const dims = ['career','wealth','marriage','children','family','health'];
  for (const k of dims) {
    const d = analysis.dim?.[k] || {};
    out[`dim.${k}.bazi`] = d.bazi || '-';
    out[`dim.${k}.ziwei`] = d.ziwei || '-';
    out[`dim.${k}.verdict`] = d.verdict || '-';
    out[`dim.${k}.verdict_class`] = d.verdict_class || 'verdict-yes';
    out[`dim.${k}.fused`] = d.fused || '-';
  }

  // conflicts
  for (let i = 0; i < 3; i++) {
    const c = analysis.conflicts?.[i] || {};
    out[`conflicts.${i}.point`] = c.point || '-';
    out[`conflicts.${i}.bazi`] = c.bazi || '-';
    out[`conflicts.${i}.ziwei`] = c.ziwei || '-';
    out[`conflicts.${i}.impact`] = c.impact || '-';
    out[`conflicts.${i}.impact_class`] = c.impact_class || 'low';
    out[`conflicts.${i}.advice`] = c.advice || '-';
  }

  // final
  if (analysis.final) {
    out['final.life_axis'] = analysis.final.life_axis || '-';
    for (let i = 0; i < 5; i++) {
      const n = analysis.final.nodes?.[i] || {};
      out[`final.nodes.${i}.age`] = n.age || '-';
      out[`final.nodes.${i}.year`] = n.year || '-';
      out[`final.nodes.${i}.event`] = n.event || '-';
    }
    for (let i = 0; i < 3; i++) {
      const r = analysis.final.risks?.[i] || {};
      out[`final.risks.${i}.range`] = r.range || '-';
      out[`final.risks.${i}.desc`] = r.desc || '-';
    }
    for (let i = 0; i < 2; i++) {
      const l = analysis.final.leverage?.[i] || {};
      out[`final.leverage.${i}.title`] = l.title || '-';
      out[`final.leverage.${i}.desc`] = l.desc || '-';
    }
    for (let i = 0; i < 4; i++) out[`final.advice.${i}`] = analysis.final.advice?.[i] || '-';
  }

  // confidence
  if (analysis.confidence) {
    for (const k of ['bazi','ziwei','consistency','stability']) {
      out[`confidence.${k}_level`] = analysis.confidence[`${k}_level`] || '-';
      out[`confidence.${k}_score`] = analysis.confidence[`${k}_score`] || '-';
    }
    out['confidence.note'] = analysis.confidence.note || '-';
  }

  return out;
}

function renderTemplate(template: string, data: Record<string, any>): string {
  let html = template;
  // 第一轮: 精确替换
  for (const k of Object.keys(data)) {
    const re = new RegExp(`\\{\\{${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\}`, 'g');
    html = html.replace(re, String(data[k]));
  }
  // 兜底: 剩余未匹配占位符替换为 '-'
  html = html.replace(/\{\{[a-zA-Z0-9_.]+\}\}/g, '-');
  return html;
}

function main() {
  const args = parseArgs();
  if (!args.chart || !args.template) {
    console.error('Usage: npx tsx render.ts --chart=chart.json [--analysis=analysis.json] --template=path/to/template.html [--output=out.html]');
    process.exit(1);
  }
  const chart = JSON.parse(fs.readFileSync(args.chart, 'utf-8'));
  const analysis = args.analysis ? JSON.parse(fs.readFileSync(args.analysis, 'utf-8')) : {};
  const template = fs.readFileSync(args.template, 'utf-8');

  const chartFlat = chartToFlat(chart, args.currentYear ? +args.currentYear : undefined);
  const analysisFlat = analysisToFlat(analysis);
  const data = { ...chartFlat, ...analysisFlat };

  const html = renderTemplate(template, data);

  if (args.output) {
    fs.writeFileSync(args.output, html, 'utf-8');
    console.error(`Rendered HTML written to ${args.output}`);
  } else {
    process.stdout.write(html);
  }
}

main();
