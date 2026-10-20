/**
 * 中村歯科医院 発信の運用（Google Apps Script）
 *
 * 1. 休診日の自動反映
 *    ホームページの data/closures.json（臨時休診）と data/jp-holidays.json（祝日）を毎朝読み、
 *    Google ビジネスプロフィールの「特別営業時間」を同じ内容にそろえる。
 * 2. お知らせ・コラムの確認
 *    シート「下書き」で「送信待ち」にした行を、医院の管理者の LINE に送る。
 *    「OK」が押されたらお知らせは Google に投稿し、コラムは運用担当にメールで知らせる。
 *    「修正」が押されたら、次に届いた文章を修正内容として記録し、運用担当にメールで知らせる。
 *
 * 設定はすべて「プロジェクトの設定 → スクリプト プロパティ」に入れる（コードに鍵を書かない）。
 *   LINE_TOKEN       … LINE 公式アカウントの Messaging API チャネルアクセストークン（長期）
 *   WEBHOOK_KEY      … Webhook URL の末尾に付ける合言葉（?k=...）。第三者からの呼び出しを防ぐ
 *   PAIR_CODE        … 管理者が LINE で「登録 xxxx」と送ると、その人を送り先として登録する
 *   ADMIN_USER_IDS   … （自動で入る）送り先の LINE ユーザー ID。カンマ区切り
 *   GBP_LOCATION     … （自動で入る）accounts/xxx/locations/yyy
 *   OPERATOR_EMAIL   … 運用担当のメール（空なら、このスクリプトの持ち主）
 *   DRY_RUN          … "true" の間は Google への書き込みをせず、ログに出すだけ
 */

var SITE = 'https://nakamuradental.jp';
var SHEET_DRAFTS = '下書き';
var SHEET_LOG = 'ログ';
var COL = { id: 1, type: 2, sendOn: 3, body: 4, link: 5, status: 6, sentAt: 7, reply: 8, memo: 9 };
var AM = [[9, 30], [13, 0]];
var PM_WEEKDAY = [[15, 0], [19, 0]];
var PM_SAT = [[15, 0], [17, 0]];

function props() { return PropertiesService.getScriptProperties(); }
function prop(k, d) { var v = props().getProperty(k); return v == null || v === '' ? (d || '') : v; }
function isDryRun() { return prop('DRY_RUN', 'true') === 'true'; }
function operatorEmail() { return prop('OPERATOR_EMAIL') || Session.getEffectiveUser().getEmail(); }

function log(kind, msg) {
  var sh = SpreadsheetApp.getActive().getSheetByName(SHEET_LOG);
  if (sh) sh.appendRow([new Date(), kind, String(msg).slice(0, 4000)]);
  console.log(kind + ': ' + msg);
}

/* ============ 初期設定 ============ */

/** 最初に1回だけ実行：シートと定期実行を用意する */
function setup() {
  var ss = SpreadsheetApp.getActive();
  var d = ss.getSheetByName(SHEET_DRAFTS) || ss.insertSheet(SHEET_DRAFTS);
  if (d.getLastRow() === 0) {
    d.appendRow(['ID', '種類（お知らせ／コラム）', '送る日', '本文', 'リンク', '状態', '送信日時', '医院からの返事', 'メモ']);
    d.setFrozenRows(1);
    d.getRange('F2:F').setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInList(['準備中', '送信待ち', '確認中', 'OK', '投稿済み', '修正依頼', '見送り'], true).build());
  }
  if (!ss.getSheetByName(SHEET_LOG)) ss.insertSheet(SHEET_LOG).appendRow(['日時', '種類', '内容']);
  if (!prop('WEBHOOK_KEY')) props().setProperty('WEBHOOK_KEY', Utilities.getUuid().replace(/-/g, ''));
  if (!prop('PAIR_CODE')) props().setProperty('PAIR_CODE', String(Math.floor(1000 + Math.random() * 9000)));
  if (!prop('DRY_RUN')) props().setProperty('DRY_RUN', 'true');
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('syncHolidays').timeBased().everyDays(1).atHour(6).create();
  ScriptApp.newTrigger('sendDrafts').timeBased().everyDays(1).atHour(10).create();
  log('setup', 'WEBHOOK_KEY と PAIR_CODE を作成し、毎朝6時（休診日）と10時（下書き送信）の定期実行を設定しました');
}

/* ============ 1. 休診日を Google の特別営業時間にそろえる ============ */

function gbpFetch(url, opt) {
  opt = opt || {};
  opt.headers = { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() };
  opt.muteHttpExceptions = true;
  if (opt.payload && typeof opt.payload !== 'string') { opt.payload = JSON.stringify(opt.payload); opt.contentType = 'application/json'; }
  var res = UrlFetchApp.fetch(url, opt);
  var code = res.getResponseCode();
  if (code >= 300) throw new Error(code + ' ' + res.getContentText().slice(0, 500));
  return res.getContentText() ? JSON.parse(res.getContentText()) : {};
}

/** 管理しているプロフィールから「中村歯科医院」を探して覚える */
function findLocation() {
  if (prop('GBP_LOCATION')) return prop('GBP_LOCATION');
  var accs = gbpFetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts').accounts || [];
  for (var i = 0; i < accs.length; i++) {
    var locs = gbpFetch('https://mybusinessbusinessinformation.googleapis.com/v1/' + accs[i].name +
      '/locations?readMask=name,title&pageSize=100').locations || [];
    for (var j = 0; j < locs.length; j++) {
      if (locs[j].title.indexOf('中村歯科') >= 0) {
        var full = accs[i].name + '/' + locs[j].name; // accounts/x/locations/y
        props().setProperty('GBP_LOCATION', full);
        log('location', full + ' ' + locs[j].title);
        return full;
      }
    }
  }
  throw new Error('中村歯科医院のプロフィールが見つかりません');
}

function ymd(d) { return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }; }
function isoOf(d) { return Utilities.formatDate(d, 'Asia/Tokyo', 'yyyy-MM-dd'); }
function t(hm) { return { hours: hm[0], minutes: hm[1] }; }

/** 今日から1年先までの「通常と違う日」を特別営業時間の形にする（ホームページの診療カレンダーと同じ考え方） */
function buildSpecialHours(closures, holidays) {
  var periods = [], today = new Date();
  for (var i = 0; i < 366; i++) {
    var d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    var iso = isoOf(d), dow = d.getDay();
    if (dow === 0) continue; // 日曜は通常の定休日
    var am = AM, pm = dow === 6 ? PM_SAT : PM_WEEKDAY, changed = false;
    if (holidays[iso]) { am = pm = null; changed = true; }
    closures.filter(function (c) { return c.date === iso; }).forEach(function (c) {
      if (c.part === 'all') am = pm = null;
      if (c.part === 'am') am = null;
      if (c.part === 'pm') pm = null;
      changed = true;
    });
    if (!changed) continue;
    if (!am && !pm) { periods.push({ startDate: ymd(d), endDate: ymd(d), closed: true }); continue; }
    [am, pm].filter(Boolean).forEach(function (r) {
      periods.push({ startDate: ymd(d), endDate: ymd(d), openTime: t(r[0]), closeTime: t(r[1]), closed: false });
    });
  }
  return periods;
}

function syncHolidays() {
  var closures = JSON.parse(UrlFetchApp.fetch(SITE + '/data/closures.json?t=' + Date.now()).getContentText());
  var holidays = JSON.parse(UrlFetchApp.fetch(SITE + '/data/jp-holidays.json?t=' + Date.now()).getContentText());
  var periods = buildSpecialHours(closures, holidays);
  var summary = periods.map(function (p) {
    return p.startDate.month + '/' + p.startDate.day + (p.closed ? ' 休業' : ' ' + p.openTime.hours + ':' + ('0' + (p.openTime.minutes || 0)).slice(-2) + '-' + p.closeTime.hours + ':' + ('0' + (p.closeTime.minutes || 0)).slice(-2));
  }).join(', ');
  if (isDryRun()) { log('holidays(dry-run)', summary); return; }
  var loc = findLocation().replace(/^accounts\/[^/]+\//, ''); // locations/yyy
  var cur = gbpFetch('https://mybusinessbusinessinformation.googleapis.com/v1/' + loc + '?readMask=specialHours');
  var before = JSON.stringify((cur.specialHours || {}).specialHourPeriods || []);
  if (before === JSON.stringify(periods)) { log('holidays', '変更なし'); return; }
  gbpFetch('https://mybusinessbusinessinformation.googleapis.com/v1/' + loc + '?updateMask=specialHours',
    { method: 'patch', payload: { specialHours: { specialHourPeriods: periods } } });
  log('holidays', '特別営業時間を更新: ' + summary);
}

/* ============ 2. 下書きを LINE で確認してもらう ============ */

function line(path, body) {
  var res = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/' + path, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + prop('LINE_TOKEN') }, payload: JSON.stringify(body)
  });
  if (res.getResponseCode() >= 300) log('line-error', res.getResponseCode() + ' ' + res.getContentText());
}
function admins() { return prop('ADMIN_USER_IDS').split(',').filter(Boolean); }

function draftMessages(row) {
  var kind = row[COL.type - 1] || 'お知らせ', id = row[COL.id - 1];
  var head = kind === 'コラム'
    ? '【ホームページのコラムの下書き】\n院長先生にご確認いただけますと幸いです。\n\n'
    : '【Googleマップのお知らせの下書き】\n\n';
  var text = head + row[COL.body - 1] + (row[COL.link - 1] ? '\n\n' + row[COL.link - 1] : '');
  return [
    { type: 'text', text: text.slice(0, 4900) },
    { type: 'template', altText: 'この内容でよいか、ご確認ください',
      template: { type: 'confirm', text: 'この内容で公開してよいですか？（No.' + id + '）',
        actions: [{ type: 'postback', label: 'OK', data: 'ok:' + id, displayText: 'OK' },
                  { type: 'postback', label: '修正する', data: 'fix:' + id, displayText: '修正する' }] } }
  ];
}

/** 毎朝10時：「送信待ち」で送る日が来た行を管理者に送る */
function sendDrafts() {
  if (!prop('LINE_TOKEN') || !admins().length) { log('drafts', 'LINE の設定または送り先がまだありません'); return; }
  var sh = SpreadsheetApp.getActive().getSheetByName(SHEET_DRAFTS);
  var rows = sh.getDataRange().getValues(), today = new Date();
  for (var r = 1; r < rows.length; r++) {
    var row = rows[r];
    if (row[COL.status - 1] !== '送信待ち') continue;
    var on = row[COL.sendOn - 1];
    if (on && new Date(on) > today) continue;
    admins().forEach(function (to) { line('push', { to: to, messages: draftMessages(row) }); });
    sh.getRange(r + 1, COL.status).setValue('確認中');
    sh.getRange(r + 1, COL.sentAt).setValue(new Date());
    log('drafts', 'No.' + row[COL.id - 1] + ' を送信');
  }
}

function findRow(id) {
  var sh = SpreadsheetApp.getActive().getSheetByName(SHEET_DRAFTS);
  var rows = sh.getDataRange().getValues();
  for (var r = 1; r < rows.length; r++) if (String(rows[r][COL.id - 1]) === String(id)) return { sh: sh, r: r + 1, row: rows[r] };
  return null;
}

function postToGoogle(row) {
  var body = { languageCode: 'ja', topicType: 'STANDARD', summary: String(row[COL.body - 1]).slice(0, 1500) };
  if (row[COL.link - 1]) body.callToAction = { actionType: 'LEARN_MORE', url: row[COL.link - 1] };
  if (isDryRun()) { log('post(dry-run)', body.summary.slice(0, 80)); return false; }
  gbpFetch('https://mybusiness.googleapis.com/v4/' + findLocation() + '/localPosts', { method: 'post', payload: body });
  return true;
}

function onApproved(hit, replyToken) {
  var kind = hit.row[COL.type - 1] || 'お知らせ';
  if (kind === 'コラム') {
    hit.sh.getRange(hit.r, COL.status).setValue('OK');
    MailApp.sendEmail(operatorEmail(), '【中村歯科】コラム No.' + hit.row[COL.id - 1] + ' にOKが出ました', '公開作業をお願いします。\n\n' + hit.row[COL.body - 1]);
    line('reply', { replyToken: replyToken, messages: [{ type: 'text', text: 'ありがとうございます。ホームページに掲載します。' }] });
    return;
  }
  var posted = false;
  try { posted = postToGoogle(hit.row); } catch (err) { log('post-error', err); }
  hit.sh.getRange(hit.r, COL.status).setValue(posted ? '投稿済み' : 'OK');
  if (!posted) MailApp.sendEmail(operatorEmail(), '【中村歯科】お知らせ No.' + hit.row[COL.id - 1] + ' にOKが出ました（手で投稿してください）', String(hit.row[COL.body - 1]));
  line('reply', { replyToken: replyToken, messages: [{ type: 'text', text: posted ? 'ありがとうございます。Googleマップに投稿しました。' : 'ありがとうございます。このあと投稿します。' }] });
}

/** LINE の Webhook（ウェブアプリとして公開し、URL の末尾に ?k=WEBHOOK_KEY を付けて登録する） */
function doPost(e) {
  if (!e || !e.parameter || e.parameter.k !== prop('WEBHOOK_KEY')) return ContentService.createTextOutput('ng');
  var events = (JSON.parse(e.postData.contents).events) || [];
  events.forEach(function (ev) {
    var uid = ev.source && ev.source.userId, isAdmin = admins().indexOf(uid) >= 0;
    if (ev.type === 'message' && ev.message.type === 'text') {
      var txt = ev.message.text.trim();
      if (txt === '登録 ' + prop('PAIR_CODE') || txt === '登録' + prop('PAIR_CODE')) {
        if (!isAdmin) props().setProperty('ADMIN_USER_IDS', admins().concat([uid]).join(','));
        log('pair', uid);
        line('reply', { replyToken: ev.replyToken, messages: [{ type: 'text', text: '登録しました。お知らせやコラムの下書きを、こちらにお送りします。' }] });
        return;
      }
      if (!isAdmin) return;
      var pending = props().getProperty('FIX_WAITING_' + uid);
      if (pending) {
        var hit = findRow(pending);
        if (hit) {
          hit.sh.getRange(hit.r, COL.reply).setValue(txt);
          hit.sh.getRange(hit.r, COL.status).setValue('修正依頼');
          MailApp.sendEmail(operatorEmail(), '【中村歯科】No.' + pending + ' に修正のご依頼', txt + '\n\n――元の文面――\n' + hit.row[COL.body - 1]);
        }
        props().deleteProperty('FIX_WAITING_' + uid);
        line('reply', { replyToken: ev.replyToken, messages: [{ type: 'text', text: '承りました。直した文面をあらためてお送りします。' }] });
      }
      return;
    }
    if (ev.type === 'postback' && isAdmin) {
      var parts = ev.postback.data.split(':'), hit2 = findRow(parts[1]);
      if (!hit2 || hit2.row[COL.status - 1] !== '確認中') {
        line('reply', { replyToken: ev.replyToken, messages: [{ type: 'text', text: 'この下書きはすでに対応済みです。' }] });
        return;
      }
      if (parts[0] === 'ok') onApproved(hit2, ev.replyToken);
      if (parts[0] === 'fix') {
        props().setProperty('FIX_WAITING_' + uid, parts[1]);
        line('reply', { replyToken: ev.replyToken, messages: [{ type: 'text', text: '直したいところを、このトークに文章で送ってください。' }] });
      }
    }
  });
  return ContentService.createTextOutput('ok');
}

function doGet() { return ContentService.createTextOutput('中村歯科医院 発信の運用: 稼働中'); }
