/**
 * 中村歯科医院 LINE 経過観察（Code.gs と同じ Apps Script プロジェクトに入れる 2 つ目のファイル）
 *
 * 流れ
 *   当日（会計待ち）  受付の QR → LIFF（ホームページ /line/）→ 友だち追加 → フリガナ・同意 →［受け取る］
 *                     → LIFF の中にお礼と「Google 口コミ（任意）」のボタン。LINE にもお礼が届く（FU_THANKS_PUSH）
 *   1週間後（10時）   「その後お口の具合はいかがですか？」［問題ない］［少し気になる］［もう一度診てほしい］
 *     問題ない         → お礼＋定期検診の案内＋口コミ（任意）
 *     少し気になる     → トークに症状を書いてもらう（スタッフは LINE 公式アカウントのチャットで返す）
 *     もう一度診てほしい → LIFF の希望日画面（第1希望 必須・第2/第3 任意、日付＋時間帯、休診日は選べない）
 *                     → 希望はトークに患者さんの発言として残る（スタッフに通知が行く）→ 「まだ確定ではありません」＋口コミ（任意）
 *   口コミのお願いは、どの答えの人にも同じ文面・同じ扱い（良い答えの人だけに頼むのは Google の規約違反）。
 *
 *   駆け込み相談（いつでも）  トークで「具合が悪くなった」「相談」「痛い」などと送る、またはリッチメニューのボタン
 *                     →「いまのご様子に近いもの」［強い痛み・腫れ・出血がある］［早めに診てほしい］［文字で相談したい］
 *     強い痛み・腫れ・出血 → 診療時間内：すぐ電話（ボタン）／時間外：次の診療日と #7119。一覧に「急ぎのご相談」で残し、メールでも知らせる
 *     早めに診てほしい     → 希望日の画面（上と同じ）
 *     文字で相談したい     → 症状の受付（上の「少し気になる」と同じ）
 *   1週間後の連絡の後でも、登録していない友だちでも使える。
 *
 * スクリプト プロパティ（Code.gs と共通のものに加えて）
 *   LIFF_CHANNEL_ID   … LIFF を置いた LINE ログインチャネルのチャネル ID（ID トークンの確認に使う）
 *   LIFF_ID           … LIFF ID（例 2000000000-abcdefgh）。トークの中のボタンから LIFF を開くのに使う
 *   FU_LIVE           … "true" で患者さんへの送信を始める。それまでは FU_TEST_USER_IDS の人にだけ送る
 *   FU_TEST_USER_IDS  … 試験で受け取る人の LINE ユーザー ID（カンマ区切り）
 *   FU_DAYS           … 何日後に送るか（既定 7）
 *   FU_THANKS_PUSH    … "false" で当日の LINE のお礼を送らない（1 通ぶん節約。既定は送る）
 *   CLINIC_EMAILS     … 相談・受診希望が届いたら件数だけ知らせるメール（症状は書かない。任意）
 */

var FU = {
  SHEET_PT: '経過観察の登録',
  SHEET_REQ: '相談・受診希望',
  REVIEW_URL: 'https://g.page/r/CdsKDBQD0uDPEAE/review',
  TEL: '06-6615-6180',
  STATE_HOURS: 72,  // 「少し気になる」を押してから、症状の文章を待つ時間
  // 駆け込み相談を始める言葉（リッチメニューのボタンは「具合が悪くなった」を送る設定にする）
  SOS_WORDS: /^(具合が悪くなった|具合が悪い|ぐあいがわるい|相談|相談したい|急ぎ|痛い|いたい|腫れた|はれた|血が止まらない)$/
};
var FU_PT = { uid: 1, lineName: 2, kana: 3, firstAt: 4, visit: 5, consent: 6, sendOn: 7, sentAt: 8, answer: 9, answeredAt: 10, status: 11, memo: 12 };
var FU_REQ_HEAD = ['受付日時', '種類', 'フリガナ', 'LINEの名前', '来院日', '内容', '第1希望', '第2希望', '第3希望', '対応', '対応メモ', 'LINEユーザーID', '口コミの案内'];
var FU_REQ = { kind: 2, done: 10, uid: 12, review: 13 };

var FU_BAND = { am: '午前（9:30〜13:00）', pm1: '15:00〜17:00', pm2: '17:00〜19:00', any: '時間はいつでも' };

/* ---------------- 文面（院長の確認後に直す場所はここだけ） ---------------- */

var FU_MSG = {
  thanks: function (p) {
    return p.kana + ' 様\n本日はご来院ありがとうございました。中村歯科医院です。\n\n'
      + fuJp(p.sendOn) + 'ごろに、治療後のご様子をこの LINE でおうかがいします。ボタンを押すだけでご回答いただけます。\n\n'
      + 'どうぞお大事になさってください。';
  },
  followupText: function (p) {
    return p.kana + ' 様\n中村歯科医院です。' + fuJp(p.visit) + 'のご診療から1週間がたちました。\nその後、お口の具合はいかがですか？';
  },
  ok: '安心いたしました。ご回答ありがとうございます。\n\n歯の健康を保つには、3か月〜半年ごとの定期検診がおすすめです。ご予約はお電話（' + FU.TEL + '）か、このトークでお気軽にどうぞ。\n\nこの先、痛みや腫れが出たときは、このトークで「具合が悪くなった」と送ってください。すぐにご案内します。',
  sosAsk: '中村歯科医院です。いまのご様子に近いものを選んでください。',
  sosUrgentOpen: 'すぐにお電話ください（' + FU.TEL + '）。\n今の状態をうかがって、受診の時間をご案内します。\n\nお電話がつながらないときは、このトークに症状をお送りください。',
  sosUrgentClosed: function (next) {
    return 'ただいま診療時間外です。次の診療は ' + next + ' からです。\n\n'
      + '痛みが強くて我慢できない・腫れが広がる・血が止まらない・熱がある場合は、#7119（救急安心センター）へご相談ください。\n\n'
      + 'このトークに症状をお送りいただければ、次の診療の始めに医院から確認してご連絡します。';
  },
  askSymptom: 'ご回答ありがとうございます。\n気になるご様子を、このトークに文字でお送りください（写真も送れます）。\n\n'
    + 'LINE のご相談は診療時間内に順に確認するため、当日中にお返事できないことがあります。\n'
    + '腫れが広がる・血が止まらない・熱がある場合は、お電話（' + FU.TEL + '）へ。診療時間外は #7119 へご相談ください。',
  gotSymptom: '受け付けました。診療時間内に、医院からこのトークでお返事します。\n\n'
    + '痛みや腫れが強くなった場合は、お返事を待たずにお電話（' + FU.TEL + '）ください。',
  askWish: 'ご回答ありがとうございます。\nご都合のよい日を、下のボタンからお選びください（第1希望のみでも大丈夫です）。',
  gotWish: 'ご希望を受け付けました。\n\n【まだご予約は確定していません】\n医院で空きを確認して、このトークでご連絡します。ご希望の日が埋まっている場合も、こちらから別の日をご相談します。',
  reviewCard: 'よろしければ、Google の口コミで率直なご感想をお聞かせください。星だけでも、ひと言でも構いません（任意です）。',
  offHours: '中村歯科医院です。メッセージありがとうございます。\n診療時間内に順に確認してお返事します（平日 9:30〜19:00／土曜 9:30〜17:00、日曜・祝日休診）。\n急ぎの場合はお電話（' + FU.TEL + '）、時間外は #7119 へご相談ください。'
};

/* ---------------- 小物 ---------------- */

function fuTodayIso() { return Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd'); }
function fuAddDays(iso, n) { var d = new Date(iso + 'T00:00:00+09:00'); d.setDate(d.getDate() + n); return Utilities.formatDate(d, 'Asia/Tokyo', 'yyyy-MM-dd'); }
function fuDow(iso) { return new Date(iso + 'T12:00:00+09:00').getDay(); }
function fuJp(iso) { var d = String(iso).split('-'); return Number(d[1]) + '月' + Number(d[2]) + '日（' + '日月火水木金土'.charAt(fuDow(iso)) + '）'; }
function fuIsoOf(v) { return v instanceof Date ? Utilities.formatDate(v, 'Asia/Tokyo', 'yyyy-MM-dd') : String(v || ''); }

/** ホームページの休診データ（祝日・臨時休診）。6 時間キャッシュ */
function fuCalendar() {
  var c = CacheService.getScriptCache(), hit = c.get('fu_cal');
  if (hit) return JSON.parse(hit);
  var cal = {
    holidays: JSON.parse(UrlFetchApp.fetch(SITE + '/data/jp-holidays.json?t=' + Date.now()).getContentText()),
    closures: JSON.parse(UrlFetchApp.fetch(SITE + '/data/closures.json?t=' + Date.now()).getContentText())
  };
  c.put('fu_cal', JSON.stringify(cal), 21600);
  return cal;
}
/** その日に開いている時間帯（[] なら休診） */
function fuOpenBands(iso, cal) {
  cal = cal || fuCalendar();
  var dow = fuDow(iso);
  if (dow === 0 || cal.holidays[iso]) return [];
  var bands = dow === 6 ? ['am', 'pm1'] : ['am', 'pm1', 'pm2'];
  cal.closures.filter(function (x) { return x.date === iso; }).forEach(function (x) {
    if (x.part === 'all') bands = [];
    if (x.part === 'am') bands = bands.filter(function (b) { return b !== 'am'; });
    if (x.part === 'pm') bands = bands.filter(function (b) { return b === 'am'; });
  });
  return bands;
}
function fuNextOpenDay(iso, cal) { for (var i = 0; i < 14; i++) { var d = fuAddDays(iso, i); if (fuOpenBands(d, cal).length) return d; } return iso; }

function fuSheet(name, head) {
  var ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(head); sh.setFrozenRows(1); }
  return sh;
}
function fuPtSheet() {
  return fuSheet(FU.SHEET_PT, ['LINEユーザーID', 'LINEの名前', 'フリガナ', '初回登録', '来院日', '経過連絡', '送る日', '送った日時', '回答', '回答日時', '状態', 'メモ']);
}
function fuFind(uid) {
  var sh = fuPtSheet(), v = sh.getDataRange().getValues();
  for (var i = 1; i < v.length; i++) if (v[i][0] === uid) return { sh: sh, r: i + 1, row: v[i] };
  return null;
}
function fuP(hit) {
  var g = function (k) { return hit.row[FU_PT[k] - 1]; };
  return { uid: g('uid'), lineName: g('lineName'), kana: g('kana') || g('lineName'), visit: fuIsoOf(g('visit')), sendOn: fuIsoOf(g('sendOn')) };
}
function fuSet(hit, k, v) { hit.sh.getRange(hit.r, FU_PT[k]).setValue(v); hit.row[FU_PT[k] - 1] = v; }

function fuLive() { return prop('FU_LIVE') === 'true'; }
function fuAllowed(uid) { return fuLive() || prop('FU_TEST_USER_IDS').split(',').indexOf(uid) >= 0; }
/** 患者さんへの push（通数に数える）。試験中は試験の人にだけ */
function fuPush(uid, messages) {
  if (!fuAllowed(uid)) { log('fu-push(試験中のため送らず)', uid + ' ' + JSON.stringify(messages).slice(0, 300)); return false; }
  line('push', { to: uid, messages: messages });
  return true;
}
function fuReply(token, messages) { line('reply', { replyToken: token, messages: messages }); }
function fuText(t, quick) { var m = { type: 'text', text: t }; if (quick) m.quickReply = { items: quick }; return m; }

function fuLiffUrl(path) { return 'https://liff.line.me/' + prop('LIFF_ID') + (path || ''); }
/** 外のブラウザで開く（LINE の中だと Google にログインしていない人が多い） */
function fuExternal(url) { return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'openExternalBrowser=1'; }

function fuReviewCard() {
  return {
    type: 'flex', altText: 'Google の口コミ（任意）',
    contents: { type: 'bubble', size: 'kilo',
      body: { type: 'box', layout: 'vertical', contents: [{ type: 'text', text: FU_MSG.reviewCard, wrap: true, size: 'sm', color: '#3b4a5a' }] },
      footer: { type: 'box', layout: 'vertical', contents: [
        { type: 'button', style: 'link', height: 'sm', action: { type: 'uri', label: 'Google で口コミを書く', uri: fuExternal(FU.REVIEW_URL) } }] } }
  };
}
function fuFollowupCard(p) {
  var btn = function (label, data, style) {
    return { type: 'button', style: style || 'secondary', height: 'sm', margin: 'sm', action: { type: 'postback', label: label, data: data, displayText: label } };
  };
  return {
    type: 'flex', altText: 'その後、お口の具合はいかがですか？（中村歯科医院）',
    contents: { type: 'bubble',
      body: { type: 'box', layout: 'vertical', contents: [
        { type: 'text', text: '中村歯科医院', size: 'xs', color: '#1f3f74', weight: 'bold' },
        { type: 'text', text: FU_MSG.followupText(p), wrap: true, margin: 'md', size: 'md', color: '#16212e' }] },
      footer: { type: 'box', layout: 'vertical', contents: [
        btn('問題ない', 'fu:ans:ok', 'primary'), btn('少し気になる', 'fu:ans:minor'), btn('もう一度診てほしい', 'fu:ans:visit')] },
      styles: { footer: { separator: true } } }
  };
}
function fuWishCard() {
  return {
    type: 'flex', altText: 'ご都合のよい日をお選びください',
    contents: { type: 'bubble', size: 'kilo',
      body: { type: 'box', layout: 'vertical', contents: [{ type: 'text', text: FU_MSG.askWish, wrap: true, size: 'sm' }] },
      footer: { type: 'box', layout: 'vertical', contents: [
        { type: 'button', style: 'primary', height: 'sm', action: { type: 'uri', label: '希望日を選ぶ', uri: fuLiffUrl('?p=wish') } }] } }
  };
}

/* ---------------- 当日：LIFF から登録 ---------------- */

/** LIFF の ID トークンを LINE に確かめて、ユーザー ID と名前を得る */
function fuVerify(idToken) {
  var res = UrlFetchApp.fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'post', muteHttpExceptions: true, payload: { id_token: idToken, client_id: prop('LIFF_CHANNEL_ID') }
  });
  if (res.getResponseCode() !== 200) throw new Error('id_token ' + res.getResponseCode());
  var j = JSON.parse(res.getContentText());
  return { uid: j.sub, name: j.name || '' };
}

/** doPost(?a=liff) から呼ばれる。body: { idToken, kind: 'register'|'decline'|'wish', kana, wishes:[{date,band}], viaChat } */
function fuLiff(body) {
  var me = fuVerify(body.idToken);
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var hit = fuFind(me.uid), now = new Date();
    if (!hit) {
      fuPtSheet().appendRow([me.uid, me.name, '', now, '', '', '', '', '', '', '', '']);
      hit = fuFind(me.uid);
    }
    fuSet(hit, 'lineName', me.name);
    if (body.kind === 'register' || body.kind === 'decline') {
      var today = fuTodayIso();
      if (body.kana) fuSet(hit, 'kana', String(body.kana).slice(0, 40));
      fuSet(hit, 'visit', today);
      fuSet(hit, 'consent', body.kind === 'register' ? '受け取る' : '受け取らない');
      fuSet(hit, 'sentAt', ''); fuSet(hit, 'answer', ''); fuSet(hit, 'answeredAt', '');
      if (body.kind === 'register') {
        var sendOn = fuNextOpenDay(fuAddDays(today, Number(prop('FU_DAYS', '7'))));
        fuSet(hit, 'sendOn', sendOn); fuSet(hit, 'status', '送信待ち');
        if (prop('FU_THANKS_PUSH', 'true') !== 'false') fuPush(me.uid, [fuText(FU_MSG.thanks(fuP(hit)))]);
        return { ok: true, sendOn: sendOn, sendOnJp: fuJp(sendOn) };
      }
      fuSet(hit, 'sendOn', ''); fuSet(hit, 'status', '経過連絡なし');
      return { ok: true };
    }
    if (body.kind === 'wish') {
      var cal = fuCalendar(), w = (body.wishes || []).filter(function (x) {
        return x && x.date && fuOpenBands(x.date, cal).length && (x.band === 'any' || fuOpenBands(x.date, cal).indexOf(x.band) >= 0);
      }).slice(0, 3);
      if (!w.length) return { ok: false, error: 'no-valid-date' };
      var label = w.map(function (x) { return fuJp(x.date) + ' ' + FU_BAND[x.band]; });
      fuAddRequest(hit, '受診の希望', '', label);
      fuSet(hit, 'status', '受診希望（医院から連絡）');
      // トークから開いた場合は LIFF が患者さんの発言として希望を送り、その返事（無料）で確認を返す。
      // それ以外（外のブラウザ等）はここで push する。
      if (!body.viaChat) fuPush(me.uid, [fuText(FU_MSG.gotWish), fuReviewCard()]);
      return { ok: true, labels: label };
    }
    return { ok: false, error: 'unknown-kind' };
  } finally { lock.releaseLock(); }
}

function fuAddRequest(hit, kind, content, wishes) {
  var p = fuP(hit); wishes = wishes || [];
  fuSheet(FU.SHEET_REQ, FU_REQ_HEAD).appendRow([new Date(), kind, p.kana, p.lineName, p.visit, content, wishes[0] || '', wishes[1] || '', wishes[2] || '', '未対応', '', p.uid]);
  // 医院への知らせは LINE 公式アカウントのアプリ（トークに患者さんの発言が残るので通知が行く）。
  // メールは件数だけ（症状は書かない）
  var to = prop('CLINIC_EMAILS');
  if (to) MailApp.sendEmail(to, (kind === '急ぎのご相談' ? '【至急・中村歯科 LINE】' : '【中村歯科 LINE】') + kind + 'が1件届きました', 'LINE 公式アカウントのアプリ（チャット）で「' + p.lineName + '」さん（' + p.kana + '）をご確認ください。\n一覧：' + SpreadsheetApp.getActive().getUrl());
}

/* ---------------- 1週間後：毎朝10時に送る ---------------- */

function sendFollowups() {
  var today = fuTodayIso(), cal = fuCalendar();
  if (!fuOpenBands(today, cal).length) { log('fu', today + ' は休診日のため送らず（次の診療日に送ります）'); return; }
  var sh = fuPtSheet(), v = sh.getDataRange().getValues(), n = 0;
  for (var i = 1; i < v.length; i++) {
    var hit = { sh: sh, r: i + 1, row: v[i] }, p = fuP(hit);
    if (v[i][FU_PT.consent - 1] !== '受け取る' || v[i][FU_PT.sentAt - 1] || !p.sendOn) continue;
    if (p.sendOn > today) continue;
    if (fuAddDays(p.sendOn, 5) < today) { fuSet(hit, 'status', '送り忘れ（期限切れ）'); continue; }
    if (fuPush(p.uid, [fuFollowupCard(p)])) { fuSet(hit, 'sentAt', new Date()); fuSet(hit, 'status', '回答待ち'); n++; }
  }
  log('fu', today + ' 経過のご連絡を ' + n + ' 件送りました');
  fuAfterCare();
}

/** 症状のご相談で、医院が「対応済み」にしたものに、ほかの答えの人と同じ口コミの案内を1回だけ送る */
function fuAfterCare() {
  var sh = fuSheet(FU.SHEET_REQ, FU_REQ_HEAD), v = sh.getDataRange().getValues(), n = 0;
  for (var i = 1; i < v.length; i++) {
    if (v[i][FU_REQ.kind - 1] !== '症状のご相談' || v[i][FU_REQ.done - 1] !== '対応済み' || v[i][FU_REQ.review - 1]) continue;
    var ok = fuPush(v[i][FU_REQ.uid - 1], [fuText('その後のご様子はいかがでしょうか。お大事になさってください。\n\nまた具合が悪くなったときは、このトークで「具合が悪くなった」と送ってください。'), fuReviewCard()]);
    sh.getRange(i + 1, FU_REQ.review).setValue(ok ? new Date() : '試験中のため送らず');
    n++;
  }
  if (n) log('fu', '対応済みの方に口コミの案内 ' + n + ' 件');
}

/* ---------------- Webhook の出来事（Code.gs の doPost から回ってくる） ---------------- */

function fuState(uid, v) {
  var k = 'FU_STATE_' + uid;
  if (v === undefined) { var s = props().getProperty(k); if (!s) return null; s = JSON.parse(s); if (s.until < Date.now()) { props().deleteProperty(k); return null; } return s; }
  if (v === null) props().deleteProperty(k); else props().setProperty(k, JSON.stringify(v));
}

/** 患者さん側の出来事を処理したら true */
function fuEvent(ev) {
  var uid = ev.source && ev.source.userId;
  if (!uid) return false;
  if (ev.type === 'unfollow') { var u = fuFind(uid); if (u) { fuSet(u, 'status', 'ブロック'); fuSet(u, 'consent', '受け取らない'); } fuState(uid, null); return true; }
  if (ev.type === 'follow') {
    fuReply(ev.replyToken, [fuText('友だち追加ありがとうございます。中村歯科医院です。\nご予約・ご相談はお電話（' + FU.TEL + '）か、このトークでお気軽にどうぞ。')]);
    return true;
  }
  if (ev.type === 'postback' && /^fu:sos/.test(ev.postback.data)) { fuSos(ev, uid, ev.postback.data.split(':')[2] || ''); return true; }
  if (ev.type === 'postback' && /^fu:/.test(ev.postback.data)) {
    var hit = fuFind(uid), ans = ev.postback.data.split(':')[2];
    if (!hit) { fuReply(ev.replyToken, [fuText(FU_MSG.offHours)]); return true; }
    var label = { ok: '問題ない', minor: '少し気になる', visit: 'もう一度診てほしい' }[ans];
    fuSet(hit, 'answer', label); fuSet(hit, 'answeredAt', new Date());
    if (ans === 'ok') { fuSet(hit, 'status', '完了'); fuReply(ev.replyToken, [fuText(FU_MSG.ok), fuReviewCard()]); }
    if (ans === 'minor') {
      fuSet(hit, 'status', '症状の連絡待ち');
      fuState(uid, { s: 'symptom', until: Date.now() + FU.STATE_HOURS * 3600e3 });
      fuReply(ev.replyToken, [fuText(FU_MSG.askSymptom)]);
    }
    if (ans === 'visit') { fuSet(hit, 'status', '希望日の入力待ち'); fuReply(ev.replyToken, [fuWishCard()]); }
    return true;
  }
  if (ev.type === 'message') {
    var m = ev.message, h = fuFind(uid);
    if (m.type === 'text' && /^(停止|ていし)$/.test(m.text.trim()) && h) {
      fuSet(h, 'consent', '受け取らない'); fuSet(h, 'status', '停止（本人から）'); fuState(uid, null);
      fuReply(ev.replyToken, [fuText('経過のご連絡を停止しました。またのご来院の際に、あらためてご登録いただけます。')]);
      return true;
    }
    if (m.type === 'text' && FU.SOS_WORDS.test(m.text.trim().replace(/[。、！!？?\s]/g, ''))) { fuSos(ev, uid, ''); return true; }
    // LIFF の希望日画面がトークに送る文（患者さんの発言として残る）
    if (m.type === 'text' && /^【受診のご希望】/.test(m.text)) { fuReply(ev.replyToken, [fuText(FU_MSG.gotWish), fuReviewCard()]); return true; }
    var st = fuState(uid);
    if (st && st.s === 'symptom' && h) {
      fuState(uid, null);
      fuAddRequest(h, '症状のご相談', m.type === 'text' ? m.text : '（' + m.type + ' が届きました。チャットでご確認ください）');
      fuSet(h, 'status', '症状のご相談（医院から返信）');
      // 口コミの案内は、スタッフが対応を終えて「対応」を「対応済み」にした後に送る（fuAfterCare）。症状への対応が先
      fuReply(ev.replyToken, [fuText(FU_MSG.gotSymptom), fuWishOffer()]);
      return true;
    }
    // それ以外のトークはスタッフがチャットで返すので、ボットは黙る（診療時間外だけ一言返す）
    var c = CacheService.getScriptCache();
    if (!fuIsOpenNow() && !c.get('fu_off_' + uid)) { c.put('fu_off_' + uid, '1', 21600); fuReply(ev.replyToken, [fuText(FU_MSG.offHours)]); }
    return true;
  }
  return false;
}
/* ---------------- 駆け込み相談（具合が悪くなったとき・いつでも） ---------------- */

/** 台帳に無い友だち（登録していない人）も、相談の記録が残せるよう行を作る */
function fuEnsure(uid) {
  var hit = fuFind(uid);
  if (hit) return hit;
  var name = '';
  try {
    var r = UrlFetchApp.fetch('https://api.line.me/v2/bot/profile/' + uid, { muteHttpExceptions: true, headers: { Authorization: 'Bearer ' + prop('LINE_TOKEN') } });
    if (r.getResponseCode() === 200) name = JSON.parse(r.getContentText()).displayName || '';
  } catch (e) { }
  fuPtSheet().appendRow([uid, name, '', new Date(), '', '受け取らない', '', '', '', '', '駆け込み相談', '']);
  return fuFind(uid);
}
function fuSosCard() {
  var btn = function (label, data, style) {
    return { type: 'button', style: style || 'secondary', height: 'sm', margin: 'sm', action: { type: 'postback', label: label, data: data, displayText: label } };
  };
  return { type: 'flex', altText: 'いまのご様子に近いものを選んでください（中村歯科医院）',
    contents: { type: 'bubble',
      body: { type: 'box', layout: 'vertical', contents: [{ type: 'text', text: FU_MSG.sosAsk, wrap: true, size: 'md', color: '#16212e' }] },
      footer: { type: 'box', layout: 'vertical', contents: [
        btn('強い痛み・腫れ・出血がある', 'fu:sos:urgent', 'primary'), btn('早めに診てほしい', 'fu:sos:visit'), btn('文字で相談したい', 'fu:sos:text')] },
      styles: { footer: { separator: true } } } };
}
function fuTelCard() {
  return { type: 'flex', altText: 'お電話 ' + FU.TEL,
    contents: { type: 'bubble', size: 'kilo',
      body: { type: 'box', layout: 'vertical', contents: [{ type: 'text', text: '中村歯科医院　' + FU.TEL, size: 'sm', weight: 'bold', color: '#16212e' }] },
      footer: { type: 'box', layout: 'vertical', contents: [{ type: 'button', style: 'primary', height: 'sm', action: { type: 'uri', label: '電話をかける', uri: 'tel:' + FU.TEL.replace(/-/g, '') } }] } } };
}
/** 次に開く診療の始まり（例：11月17日（火） 9:30） */
function fuNextOpenLabel() {
  var cal = fuCalendar(), today = fuTodayIso(), hm = Number(Utilities.formatDate(new Date(), 'Asia/Tokyo', 'HHmm'));
  var start = { am: '9:30', pm1: '15:00', pm2: '17:00' }, startHm = { am: 930, pm1: 1500, pm2: 1700 };
  var b = fuOpenBands(today, cal).filter(function (x) { return startHm[x] > hm; })[0];
  if (b) return '本日 ' + start[b];
  var d = fuNextOpenDay(fuAddDays(today, 1), cal);
  return fuJp(d) + ' ' + start[fuOpenBands(d, cal)[0] || 'am'];
}
/** step：''（選んでもらう）／urgent／visit／text */
function fuSos(ev, uid, step) {
  if (!step) { fuReply(ev.replyToken, [fuSosCard()]); return; }
  var hit = fuEnsure(uid);
  if (step === 'urgent') {
    var open = fuIsOpenNow();
    fuAddRequest(hit, '急ぎのご相談', open ? '診療時間内（電話をご案内）' : '診療時間外（次の診療と #7119 をご案内）');
    fuSet(hit, 'status', '急ぎのご相談（医院から連絡）');
    fuState(uid, { s: 'symptom', until: Date.now() + FU.STATE_HOURS * 3600e3 });
    fuReply(ev.replyToken, [fuText(open ? FU_MSG.sosUrgentOpen : FU_MSG.sosUrgentClosed(fuNextOpenLabel())), fuTelCard()]);
    return;
  }
  if (step === 'visit') { fuSet(hit, 'status', '希望日の入力待ち'); fuReply(ev.replyToken, [fuWishCard()]); return; }
  if (step === 'text') {
    fuSet(hit, 'status', '症状の連絡待ち');
    fuState(uid, { s: 'symptom', until: Date.now() + FU.STATE_HOURS * 3600e3 });
    fuReply(ev.replyToken, [fuText(FU_MSG.askSymptom.replace(/^ご回答ありがとうございます。\n/, ''))]);
  }
}

function fuWishOffer() {
  return { type: 'flex', altText: '受診をご希望の場合',
    contents: { type: 'bubble', size: 'kilo',
      body: { type: 'box', layout: 'vertical', contents: [{ type: 'text', text: '受診をご希望の場合は、ご都合のよい日をお送りください。', wrap: true, size: 'sm' }] },
      footer: { type: 'box', layout: 'vertical', contents: [{ type: 'button', style: 'secondary', height: 'sm', action: { type: 'uri', label: '希望日を選ぶ', uri: fuLiffUrl('?p=wish') } }] } } };
}
/** いま診療時間内か（時間外の自動返信に使う。同じ人に何度も返さないよう 6 時間に1回） */
function fuIsOpenNow() {
  var now = new Date(), iso = fuTodayIso(), bands = fuOpenBands(iso);
  var hm = Number(Utilities.formatDate(now, 'Asia/Tokyo', 'HHmm'));
  var inBand = { am: hm >= 930 && hm < 1300, pm1: hm >= 1500 && hm < 1700, pm2: hm >= 1700 && hm < 1900 };
  return bands.some(function (b) { return inBand[b]; }) || (hm >= 1300 && hm < 1500 && bands.length > 0);
}

/** 最初に1回：シートと毎朝10時の送信を用意（Code.gs の setup() の後に実行） */
function setupFollowup() {
  fuPtSheet();
  fuSheet(FU.SHEET_REQ, FU_REQ_HEAD).getRange('J2:J').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(['未対応', '対応中', '対応済み'], true).build());
  ScriptApp.getProjectTriggers().filter(function (t) { return t.getHandlerFunction() === 'sendFollowups'; }).forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('sendFollowups').timeBased().everyDays(1).atHour(10).create();
  if (!prop('FU_LIVE')) props().setProperty('FU_LIVE', 'false');
  log('setup', '経過観察：シート2枚と毎朝10時の送信を用意しました（FU_LIVE=false の間は試験の人にだけ送ります）');
}
