/* 診療日の判定（公開ページ・管理画面・テストで共用）
 *
 * 通常の診療時間・祝日・臨時休診（data/closures.json）から、ある日の診療枠を決める。
 * 診療時間を変えるときは REGULAR と build.py の HOURS_TABLE / HOURS_LINE をそろえること。
 *
 * closures の形: [{ "date": "2026-10-08", "part": "pm" | "am" | "all", "note": "工事のため" }]
 */
(function (root) {
  "use strict";

  var AM = ["09:30", "13:00"];
  // 曜日(0=日)ごとの通常枠。null は休診。
  var REGULAR = {
    0: { am: null, pm: null },
    1: { am: AM, pm: ["15:00", "19:00"] },
    2: { am: AM, pm: ["15:00", "19:00"] },
    3: { am: AM, pm: ["15:00", "19:00"] },
    4: { am: AM, pm: ["15:00", "19:00"] },
    5: { am: AM, pm: ["15:00", "19:00"] },
    6: { am: AM, pm: ["15:00", "17:00"] }
  };
  var DOW = ["日", "月", "火", "水", "木", "金", "土"];
  var PART_LABEL = { all: "終日休診", am: "午前休診", pm: "午後休診" };

  function parse(iso) { var p = iso.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function iso(d) {
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
  function addDays(isoDate, n) { var d = parse(isoDate); d.setDate(d.getDate() + n); return iso(d); }
  function jpDate(isoDate) { var d = parse(isoDate); return (d.getMonth() + 1) + "月" + d.getDate() + "日（" + DOW[d.getDay()] + "）"; }
  function toMin(hhmm) { var p = hhmm.split(":"); return +p[0] * 60 + +p[1]; }
  function shortTime(hhmm) { return hhmm.replace(/^0/, ""); }

  // その日の診療枠 { am, pm, closed, reason, part }
  function dayInfo(isoDate, closures, holidays) {
    var dow = parse(isoDate).getDay();
    var base = REGULAR[dow];
    var info = { date: isoDate, am: base.am, pm: base.pm, reason: "", part: "" };
    if (holidays && holidays[isoDate]) { info.am = info.pm = null; info.reason = holidays[isoDate]; info.part = "holiday"; }
    else if (dow === 0) { info.reason = "日曜"; info.part = "sunday"; }
    for (var i = 0; closures && i < closures.length; i++) {
      var c = closures[i];
      if (c.date !== isoDate) continue;
      if (c.part === "all") { info.am = info.pm = null; }
      else if (c.part === "am") { info.am = null; }
      else if (c.part === "pm") { info.pm = null; }
      if (!info.part || info.part === "sunday") info.part = c.part;
      info.reason = c.note || PART_LABEL[c.part] || "";
    }
    info.closed = !info.am && !info.pm;
    return info;
  }

  function hoursText(info) {
    var s = [];
    if (info.am) s.push(shortTime(info.am[0]) + "〜" + shortTime(info.am[1]));
    if (info.pm) s.push(shortTime(info.pm[0]) + "〜" + shortTime(info.pm[1]));
    return s.join("／");
  }

  function nextOpen(isoDate, closures, holidays) {
    for (var i = 1; i <= 60; i++) {
      var d = addDays(isoDate, i), inf = dayInfo(d, closures, holidays);
      if (!inf.closed) return inf;
    }
    return null;
  }

  // 「いま」の案内文。now = { date: "YYYY-MM-DD", min: 0..1439 }（日本時間）
  function todayStatus(now, closures, holidays) {
    var t = dayInfo(now.date, closures, holidays);
    var nx = nextOpen(now.date, closures, holidays);
    var nextText = nx ? "次の診療日：" + jpDate(nx.date) + " " + hoursText(nx) : "";
    if (t.closed) {
      var why = t.part === "holiday" ? "祝日（" + t.reason + "）のため休診です。"
              : t.part === "sunday" ? "日曜日は休診です。"
              : t.reason && t.reason !== PART_LABEL.all ? t.reason + "休診です。" : "臨時休診です。";
      return { state: "closed", head: "本日は休診です", sub: why + nextText, today: t };
    }
    var sessions = [t.am, t.pm].filter(Boolean);
    var note = t.part === "pm" ? "本日午後は休診です" : t.part === "am" ? "本日午前は休診です" : "";
    for (var i = 0; i < sessions.length; i++) {
      var s = toMin(sessions[i][0]), e = toMin(sessions[i][1]);
      if (now.min >= s && now.min < e) {
        return { state: "open", head: "ただいま診療時間内です（" + shortTime(sessions[i][1]) + "まで）", sub: note || "本日の診療 " + hoursText(t), today: t };
      }
      if (now.min < s) {
        return { state: "later", head: i === 0 ? "本日は" + shortTime(sessions[i][0]) + "から診療します" : "午後は" + shortTime(sessions[i][0]) + "から診療します",
                 sub: note || "本日の診療 " + hoursText(t), today: t };
      }
    }
    return { state: "done", head: t.part === "pm" ? "本日午後は休診です" : "本日の診療は終了しました", sub: nextText, today: t };
  }

  // Google ビジネスプロフィール用：その日の特別営業時間（文字列）
  function specialHoursText(isoDate, closures, holidays) {
    var inf = dayInfo(isoDate, closures, holidays);
    return jpDate(isoDate) + "：" + (inf.closed ? "休業" : hoursText(inf) + " のみ営業");
  }

  var api = { REGULAR: REGULAR, DOW: DOW, PART_LABEL: PART_LABEL, dayInfo: dayInfo, hoursText: hoursText, nextOpen: nextOpen,
              todayStatus: todayStatus, specialHoursText: specialHoursText, jpDate: jpDate, addDays: addDays, iso: iso, parse: parse };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ClinicDays = api;
})(this);
