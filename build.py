# -*- coding: utf-8 -*-
"""
中村歯科医院 サイトビルダー
共通ヘッダー/フッターを一元管理し、全ページを生成する。
  $ python3 build.py
"""
import os, time

VER = str(int(time.time()))  # cache buster

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = "https://nakamura-dental.com"
TEL, TELR = "06-6615-6180", "0666156180"
ADDR1 = "大阪市住之江区南港北1丁目14-16"
ADDR2 = "大阪府咲洲庁舎（コスモタワー）3F"

# 実サイトの診療時間表（●＝診療 / ▲＝土曜午後 15:00〜17:00 / −＝休診）
HOURS_TABLE = """<div class="hours-wrap"><table class="hours">
<thead><tr><th></th><th>月</th><th>火</th><th>水</th><th>木</th><th>金</th><th>土</th><th>日</th></tr></thead>
<tbody>
<tr><th>9:30 - 13:00</th><td>●</td><td>●</td><td>●</td><td>●</td><td>●</td><td>●</td><td>−</td></tr>
<tr><th>15:00 - 19:00</th><td>●</td><td>●</td><td>●</td><td>●</td><td>●</td><td class="tri">▲</td><td>−</td></tr>
</tbody></table></div>
<p class="hours-note"><span class="tri">▲</span> 土曜午後 15:00〜17:00</p>
<p class="hours-note">※ 休診日：日曜日・祝日</p>"""

HOURS_LINE = "診療時間 9:30〜13:00 ／ 15:00〜19:00　※土曜午後は15:00〜17:00・日曜・祝日休診"

NAV = [
    ("index.html", "ホーム", "HOME"),
    ("service.html", "診療のご案内", "SERVICE"),
    ("staff.html", "スタッフ紹介", "STAFF"),
    ("price.html", "自費診療 料金表", "PRICE"),
    ("access.html", "アクセス", "ACCESS"),
]

# 実サイト（magenta841500.studio.site）の診療メニュー8種・文言そのまま
# (ファイル名, 和名, 英名, アイコンID, 実サイトの説明文, 下層ページのヒーロー写真)
SERVICES = [
    ("service.html#general",    "一般歯科",       "General",    "ic-general",
     "お口の健康を守り、痛みを軽減する治療をご提供いたします。", "treatment-01.jpg"),
    ("service.html#pediatric",  "小児歯科",       "Pediatric",  "ic-kids",
     "お子様に優しい治療で、歯の健康をしっかりとサポートいたします。", "kids-chair.jpg"),
    ("service.html#general",    "3Mix-MP法",      "3Mix-MP",    "ic-3mix",
     "最新の虫歯治療法で、痛みを最小限に抑える治療を行っております。", "treatment-02.jpg"),
    ("service.html#checkup",    "定期検診",       "Check-up",   "ic-checkup",
     "早期発見・予防を重視し、健康な歯を長く守るための定期検診を実施しています。", "svc-prevention.png"),
    ("service-ortho.html",      "矯正歯科",       "Orthodontic","ic-ortho",
     "美しい歯並びと、噛み合わせの改善をサポートいたします。", "counseling.jpg"),
    ("service-implant.html",    "インプラント",   "Implant",    "ic-implant",
     "自然な見た目で、失った歯をしっかりと再生するインプラント治療を提供しています。", "svc-implant.png"),
    ("service-denture.html",    "義歯（入れ歯）", "Denture",    "ic-denture",
     "ぴったりと合う快適な入れ歯をご提供し、自然な笑顔を取り戻していただけます。", "svc-denture.png"),
    ("service-aesthetic.html",  "審美歯科",       "Aesthetic",  "ic-aesthetic",
     "美しい笑顔と自信を取り戻すため、審美治療を丁寧に行っております。", "whitening.jpg"),
]

# 実サイト同様のシンプルな線アイコン
ICONS = {
"ic-general":'<path d="M20 13c5 0 8 3 8 8 0 4-1 7-2 11-1 3-2 5-3.6 5-1.4 0-1.6-5-2.4-5s-1 5-2.4 5C16 37 15 35 14 32c-1-4-2-7-2-11 0-5 3-8 8-8z"/><path d="M26 12l5-5M29 9l2.6 2.6"/>',
"ic-kids":'<circle cx="17" cy="15" r="7"/><path d="M14 13.5h.01M20 13.5h.01M15.5 18c1.2 1.2 2.8 1.2 4 0"/><path d="M28 22c3 0 5 2.4 5 5.6 0 2.6-.6 4.6-1.2 6.6-.5 1.6-1 2.8-2 2.8s-1-3-1.8-3-.6 3-1.8 3-1.6-1.2-2-2.8c-.6-2-1.2-4-1.2-6.6C23 24.4 25 22 28 22z"/>',
"ic-3mix":'<rect x="9" y="14" width="12" height="20" rx="2"/><path d="M12 14v-3h6v3M12 24h6M15 21v6"/><rect x="25" y="12" width="8" height="22" rx="3"/><path d="M25 18h8"/>',
"ic-checkup":'<rect x="7" y="10" width="26" height="24" rx="3"/><path d="M7 17h26M14 7v6M26 7v6"/><path d="M20 21c2.4 0 3.8 1.5 3.8 3.8 0 1.8-.4 3.2-.9 4.6-.4 1.1-.7 2-1.4 2-.6 0-.7-2.1-1.5-2.1s-.4 2.1-1.2 2.1c-.8 0-1.1-.9-1.5-2-.5-1.4-.9-2.8-.9-4.6 0-2.3 1.4-3.8 3.6-3.8z"/>',
"ic-ortho":'<path d="M20 10c5 0 8 3 8 8 0 4-1 7-2 11-1 3-2 5-3.6 5-1.4 0-1.6-5-2.4-5s-1 5-2.4 5C16 34 15 32 14 29c-1-4-2-7-2-11 0-5 3-8 8-8z"/><path d="M8 21h24"/><rect x="15" y="18.4" width="4.4" height="5.2" rx="1"/><rect x="22" y="18.4" width="4.4" height="5.2" rx="1"/>',
"ic-implant":'<path d="M12 14c0-3 3.6-5 8-5s8 2 8 5c0 2.6-2 3.6-4.4 4H16.4C14 17.6 12 16.6 12 14z"/><path d="M20 18v18M16.4 22h7.2M16.4 26h7.2M16.4 30h7.2"/>',
"ic-denture":'<path d="M8 20c0-3 2.6-5 6-5h12c3.4 0 6 2 6 5v5c0 4-3 7-7 7H15c-4 0-7-3-7-7z"/><path d="M13 15v9M20 15v9M27 15v9M8 24h24"/>',
"ic-aesthetic":'<path d="M18 11c5 0 8 3 8 8 0 4-1 7-2 11-1 3-2 5-3.6 5-1.4 0-1.6-5-2.4-5s-1 5-2.4 5C14 35 13 33 12 30c-1-4-2-7-2-11 0-5 3-8 8-8z"/><path d="M30 9l1.6 3.6L35 14l-3.4 1.4L30 19l-1.6-3.6L25 14l3.4-1.4z"/><path d="M33 22l1 2.2 2.2 1-2.2 1L33 28.4l-1-2.2-2.2-1 2.2-1z"/>',
"ic-inlay":'<path d="M22 8c5 0 9 3 9 9 0 4-1 8-2 12-1 3-2 5-4 5s-2-6-3-6-1 6-3 6-3-2-4-5c-1-4-2-8-2-12 0-6 4-9 9-9z"/><path d="M17 13l4 4 6-5" fill="none"/>',
"ic-crown":'<path d="M22 9c5 0 9 3 9 9 0 4-1 8-2 12-1 3-2 5-4 5s-2-6-3-6-1 6-3 6-3-2-4-5c-1-4-2-8-2-12 0-6 4-9 9-9z"/><path d="M13 25c3 2 5 3 9 3s6-1 9-3"/>',
"ic-veneer":'<path d="M13 12h18l-2 9c-.5 2.4-2 4-4 4h-6c-2 0-3.5-1.6-4-4z"/><path d="M13 12l1.5 16h1M31 12l-1.5 16h-1M22 12v16"/>',
"ic-white":'<path d="M22 10c5 0 8 3 8 8 0 4-1 7-2 11-1 3-2 5-3.6 5-1.4 0-1.6-5-2.4-5s-1 5-2.4 5C16 34 15 32 14 29c-1-4-2-7-2-11 0-5 3-8 8-8z"/><path d="M31 12l1 2.4 2.4 1-2.4 1L31 19l-1-2.6-2.4-1 2.4-1z"/>',
}


def icon(key):
    return ('<svg viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.6" '
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%s</svg>' % ICONS[key])

LOGO_SVG = '<img class="logo-mark" src="assets/img/logo-mark.png" alt="" aria-hidden="true">'
TEL_ICON = ('<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.6 10.8a15.6 '
            '15.6 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11.4 11.4 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 '
            '0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .58 3.6 1 1 0 0 '
            '1-.24 1z"/></svg>')


def head(title, desc, path, og_img="assets/img/hero-reception.jpg", extra=""):
    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{SITE}/{path}">
<meta name="theme-color" content="#1f3f74">
<meta name="format-detection" content="telephone=no">
<meta property="og:type" content="website">
<meta property="og:site_name" content="中村歯科医院">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:locale" content="ja_JP">
<meta property="og:url" content="{SITE}/{path}">
<meta property="og:image" content="{SITE}/{og_img}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600&family=Shippori+Mincho:wght@500;600;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css?v={VER}">
{extra}</head>
<body>
"""


def header(current=""):
    nav = "".join(
        '<a href="%s"%s>%s</a>' % (h, ' class="current"' if h == current else "", ja)
        for h, ja, en in NAV
    )
    drawer = "".join(f'<a href="{h}">{ja}<span class="en">{en}</span></a>' for h, ja, en in NAV)
    return f"""<header class="site-header" id="header">
  <div class="wrap">
    <a href="index.html" class="brand" aria-label="中村歯科医院 ホーム">{LOGO_SVG}
      <span class="name"><b>Nakamura Dental</b><span>OFFICE ｜ COSMOSQUARE</span></span></a>
    <nav class="nav" aria-label="グローバルナビ">{nav}</nav>
    <a class="header-tel" href="tel:{TELR}">{TEL_ICON}{TEL}</a>
    <button class="burger" id="burger" aria-label="メニューを開く" aria-expanded="false"><span></span><span></span><span></span></button>
  </div>
</header>
<nav class="drawer" id="drawer" aria-label="モバイルメニュー">{drawer}
  <a class="d-tel" href="tel:{TELR}">{TEL}</a>
</nav>
"""


def tramband(title=None, lead=None):
    """コスモスクエアの街並みイラスト帯（テキストなし・イラストのみ）"""
    return f"""<section class="tramband">
  <div class="tram-scene" data-tram="assets/img/tram-scene.svg?v={VER}" aria-hidden="true"></div>
</section>
"""


def checks(items):
    """実サイト同様の青いチェックマーク付きカード"""
    mark = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
            'stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/>'
            '<path d="M7.5 12.4l3 3 6-6.4"/></svg>')
    norm = [(i, "") if isinstance(i, str) else i for i in items]
    rows = "".join(
        '<li class="chk-card"><span class="chk-ic">%s</span>'
        '<span class="chk-txt"><b>%s</b>%s</span></li>'
        % (mark, t, ("<span>%s</span>" % d if d else ""))
        for t, d in norm)
    return '<ul class="chk-cards">%s</ul>' % rows


def cta():
    return f"""<section class="cta">
  <div class="wrap">
    <p class="en">RESERVATION &amp; CONTACT</p>
    <h3>お電話でのお問い合わせ・ご予約</h3>
    <a class="tel" href="tel:{TELR}">{TEL_ICON}{TEL}</a>
    <p class="hours">{HOURS_LINE}</p>
  </div>
</section>
"""


def footer():
    menu = "".join(f'<a href="{h}">{ja}</a>' for h, ja, en in NAV)
    svc = "".join(f'<a href="{h}">{ja}</a>' for h, ja, en, ic, d, hero in SERVICES)
    return f"""<footer class="site-footer">
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-brand">
        <a href="index.html" class="brand">{LOGO_SVG}
          <span class="name"><b>Nakamura Dental</b><span>OFFICE ｜ COSMOSQUARE</span></span></a>
        <p>{ADDR1}<br>{ADDR2}<br>TEL {TEL}</p>
      </div>
      <div class="foot-col"><h5>MENU</h5>{menu}</div>
      <div class="foot-col"><h5>SERVICE</h5>{svc}</div>
    </div>
    <div class="foot-bottom">
      <span>© <span id="yr"></span> Nakamura Dental Office. All rights reserved.</span>
      <span>大阪 南港 コスモスクエア・咲洲庁舎の歯科医院</span>
    </div>
  </div>
</footer>
<script src="assets/js/main.js?v={VER}"></script>
</body>
</html>
"""


def page_hero(eyebrow, h1, sub, img):
    return f"""<section class="page-hero">
  <img src="assets/img/{img}" alt="">
  <div class="wrap">
    <span class="eyebrow">{eyebrow}</span>
    <h1>{h1}</h1>
    <p class="sub">{sub}</p>
  </div>
</section>
<nav class="crumb"><div class="wrap"><a href="index.html">ホーム</a><span>›</span><span>{h1}</span></div></nav>
"""


def features(items):
    """実サイト準拠：見出し＋本文＋チェックカード。写真は指定がある場合のみ挿入。"""
    out = []
    for t, body, img, chk in items:
        fig = (f'<div class="blk-fig wipe"><img src="assets/img/{img}" alt="{t}" loading="lazy"></div>'
               if img else "")
        paras = "".join(f"<p>{p}</p>" for p in body.split("\n") if p.strip())
        out.append(f"""<section class="svc-block reveal">
  <h3 class="svc-block-ttl">{t}</h3>
  <div class="svc-block-body">{paras}</div>
  {fig}
  {checks(chk) if chk else ""}
</section>""")
    return "\n".join(out)


def faq(items):
    rows = "".join(f"""<div class="faq-item">
  <button class="faq-q" aria-expanded="false"><span class="qm">Q</span><span>{q}</span><span class="tg">⌄</span></button>
  <div class="faq-a"><div class="inner">{a}</div></div>
</div>""" for q, a in items)
    return f"""<section class="section faq">
  <div class="wrap">
    <div class="sec-head center reveal"><span class="eyebrow">FAQ</span><h2 class="ja">よくあるご質問<span class="en">/ FAQ</span></h2></div>
    {rows}
  </div>
</section>
"""


PAGES = {}

# =========================================================
#  診療のご案内（実サイト magenta841500.studio.site 準拠）
#  構成：診療のご案内（一般歯科/小児歯科/定期検診/予防歯科PMTC）
#        ＋ インプラント / 義歯 / 審美歯科 / 矯正歯科 の4ページ
# =========================================================

def tinfo(name, period, cost, risk):
    """治療名・治療期間・費用目安・リスク（医療広告ガイドライン対応）"""
    return f"""<div class="tinfo">
  <dl>
    <div><dt>治療名</dt><dd>{name}</dd></div>
    <div><dt>治療期間</dt><dd>{period}</dd></div>
    <div><dt>費用目安</dt><dd>{cost}</dd></div>
  </dl>
  <p class="risk">※{risk}</p>
</div>"""


NOTES_CASE = """<p class="case-note">※すべて同一患者の写真を使用しており、掲載にはご本人の同意をいただいております。<br>
※効果には個人差があります。<br>※難症例は紹介させていただく場合がございます。</p>"""


def ba(img, alt="症例（before / after）", label=None):
    """before/after の合成写真をそのまま全幅表示（実写素材はビフォー→アフターが1枚に収録）"""
    cap = f'<figcaption>{label}</figcaption>' if label else ''
    return f'<figure class="ba-real wipe"><img src="assets/img/{img}" alt="{alt}" loading="lazy">{cap}</figure>'


def photo(img, alt=""):
    """本文中の差し込み写真（全幅）"""
    return f'<div class="blk-fig wipe"><img src="assets/img/{img}" alt="{alt}" loading="lazy"></div>'


def svc_block(anchor, icon_key, title, sub, paras, img=None, img_alt="", extra=""):
    """アイコン＋見出し＋本文＋写真（実サイトのカード構成）"""
    body = "".join(f"<p>{p}</p>" for p in paras)
    sub_html = f'<span class="svc-sub">（{sub}）</span>' if sub else ""
    fig = (f'<div class="blk-fig wipe"><img src="assets/img/{img}" alt="{img_alt or title}" loading="lazy"></div>'
           if img else "")
    return f"""<section class="svc-card-lg reveal" id="{anchor}">
  <div class="svc-card-head">
    <span class="svc-card-ic">{icon(icon_key)}</span>
    <div><h2>{title}</h2>{sub_html}</div>
  </div>
  <div class="svc-card-body">{body}</div>
  {fig}{extra}
</section>"""


def svc_page(fname, h1, sub, hero_img, blocks, faqs, crumb_mid=True):
    t = f"{h1}｜中村歯科医院（大阪 南港コスモスクエア・咲洲庁舎3F）"
    label = h1.replace("診療のご案内｜", "")
    d = f"中村歯科医院の{label}についてのご案内です。大阪 南港コスモスクエア・咲洲庁舎3F。"
    s = head(t, d, fname, "assets/img/hero-shelf.jpg")
    s += header()
    mid = '<a href="service.html">診療のご案内</a><span>›</span>' if crumb_mid else ""
    # 写真なしの上品なヒーロー（ネイビー地＋ドット模様）
    s += f"""<section class="page-hero page-hero--plain">
  <span class="ph-deco" aria-hidden="true"></span>
  <div class="wrap">
    <span class="eyebrow">Service</span>
    <h1>{h1}</h1>
    <p class="sub">中村歯科医院の{label}についてのご案内です。</p>
  </div>
</section>
<nav class="crumb"><div class="wrap"><a href="index.html">HOME</a><span>›</span>{mid}<span>{label}</span></div></nav>
<section class="section svc-page">
  <div class="wrap">{''.join(blocks)}</div>
</section>
"""
    if faqs:
        s += faq(faqs)
    s += tramband()
    s += cta()
    s += footer()
    return s


# ---------- 診療のご案内（4項目まとめ） ----------
PAGES["service.html"] = svc_page(
    "service.html", "診療のご案内", "", "treatment-01.jpg",
    [
        svc_block("general", "ic-general", "一般歯科", "虫歯・根管治療・3Mix-MP法・歯周病", [
            "虫歯や歯周病など、お口の基本的な疾患に幅広く対応して口腔の疾患を全て網羅して治療を行います。虫歯は初期（C0）から重度（C4）まで、段階に応じた治療を行い、神経まで進行した場合には根管治療により歯の保存を目指します。",
            "また、3Mix-MP法という3種類の抗菌薬を用いた新しい治療法を導入しており、歯を削る量を最小限に抑えながら虫歯や根尖病変の治療が可能です。",
            "歯周病治療では、歯科医師と歯科衛生士が連携し、スケーリングやルートプレーニング、ブラッシング指導を通じて進行を抑制。セルフケアとプロケアの両立を重視しています。",
        ], None, ""),

        svc_block("pediatric", "ic-kids", "小児歯科", "", [
            "お子さまの成長に合わせた診療を行います。虫歯予防、フッ素塗布、シーラント、ブラッシング指導などを通して、将来の健康な歯を育てます。",
            "幼稚園・学校の校医経験を持つ歯科医師が在籍し、痛くない・怖くない歯科体験を大切にしています。定期検診を習慣にすることで、生涯の歯の健康を守る基盤をつくります。",
        ], "kids-group.jpg", "小児歯科の診療風景"),

        svc_block("checkup", "ic-checkup", "定期検診", "", [
            "当院では「定期健診」により、小さいときから生涯にわたって、歯と口の衛生を守り、痛くならないようにしていくことが、生涯自分の歯で豊かな生活をおくるために一番効果であると思っております。",
            "少しの不注意で歯周炎、虫歯を進行さし歯を抜かなければならないことは、生涯取り返しのできないことではないでしょうか？",
            "「定期健診」では、歯科医師・歯科衛生士が普段ブラッシングでは取れない汚れをクリーニングしたり、口腔清掃指導、予防剤（フッ素）塗布、レントゲン写真による検査などを行います。",
            "「定期健診」の間隔は、通常３ヶ月〜６ヶ月で行いますが、その方の症状によって１ヶ月〜２ヶ月で行う場合もあります。",
        ], "checkup.jpg", "定期検診の様子"),

        svc_block("pmtc", "ic-3mix", "予防歯科", "PMTC", [
            "PMTC（専門家による機械的歯面清掃）を中心に、虫歯・歯周病を未然に防ぐための予防ケアを提供しています。",
            "歯科衛生士による丁寧なクリーニング、フッ素塗布、歯茎マッサージにより、清潔で健康な口腔環境を保ちます。定期検診を通じて、長期的なお口の健康維持をサポートします。",
        ], None, "", checks([
            ("歯周病の予防", "歯の付け根のプラークを除去し、歯肉炎の症状が改善される。"),
            ("虫歯の予防", "バイオフィルムが破壊され、プラークの再付着を防ぐ。"),
            ("歯がきれいに", "歯についたステイン(着色物)を除去し、光沢のある歯になる。"),
            ("歯の強化", "フッ素ジェルを用いることで再石灰化を促進し、歯を強くする。"),
        ])),
    ],
    [("虫歯はどのように進行しますか？", "初期（C0）から重度（C4）まで段階があります。早期であれば削る量も少なく、通院回数も抑えられます。気になる段階でご相談ください。"),
     ("3Mix-MP法とはどんな治療ですか？", "3種類の抗菌薬を用いた治療法で、歯を削る量を最小限に抑えながら虫歯や根尖病変の治療が可能です。"),
     ("何歳から受診できますか？", "歯が生え始めた頃（1歳前後）からご相談いただけます。まずは慣れることから始めます。"),
     ("定期検診はどれくらいの間隔ですか？", "通常３ヶ月〜６ヶ月で行いますが、その方の症状によって１ヶ月〜２ヶ月で行う場合もあります。")],
    crumb_mid=False
)

# ---------- インプラント ----------
PAGES["service-implant.html"] = svc_page(
    "service-implant.html", "診療のご案内｜インプラント", "", "svc-implant.png",
    [
        svc_block("implant", "ic-implant", "インプラント", "", [
            "歯を失った部分に人工の歯根（インプラント）を埋め込み、人工歯を装着することで、天然歯のような咬み心地と見た目を回復します。",
            "大口式インプラントなど最新の技術により、骨が少ない場所や抜歯と同時の埋入にも対応可能です。ブリッジのように健康な歯を削る必要がなく、長期的な安定性が期待できます。",
        ], None, "", ba("ba-implant.jpg", "インプラント症例（治療前→治療後）")
           + tinfo("大口式インプラント等", "3ヶ月〜1年", "330,000円（税込）〜",
                   "炎症や再治療が必要となる可能性があります。") + NOTES_CASE),
    ],
    [("インプラントとは？", "歯を失った部分の顎の骨にチタン製の人工歯根を埋め込み、その上に人工歯を装着する治療です。"),
     ("歯がなくなるとどうなる？", "噛む力が低下するだけでなく、隣の歯が倒れたり噛み合う歯が伸びたりして、お口全体のバランスが崩れていきます。"),
     ("インプラント治療とは？", "診査・診断のうえ人工歯根を埋入し、骨と結合させてから人工歯を装着します。段階を踏んで進めていきます。"),
     ("治療の流れは？", "診査・診断 → 治療計画のご説明 → 埋入手術 → 治癒期間（骨との結合）→ 人工歯の装着 → 定期メンテナンスという流れです。")]
)

# ---------- 義歯（入れ歯） ----------
PAGES["service-denture.html"] = svc_page(
    "service-denture.html", "診療のご案内｜義歯（入れ歯）", "", "svc-denture.png",
    [
        svc_block("denture", "ic-denture", "義歯（入れ歯）", "", [
            "歯を失った部分を補うために、歯科医師の長年の経験と技術、義歯専門の技工所により保険診療においても精度の高い義歯を提供させていただいております。又、保険の入れ歯から高機能な自費義歯まで、幅広く対応していますので気楽にご相談ください。",
            "総入れ歯・部分入れ歯に加え、金属床義歯、アタッチメント義歯、マグネット義歯（マグフィット）、コーヌスクローネ義歯、スマイルデンチャー、コンフォート（生体シリコン）など、目立ちにくく、しっかり噛める快適な義歯をご用意しています。",
        ], "denture-photo.jpg", "義歯の症例"),
    ],
    [("入れ歯とは？", "失った歯を補う取り外し式の装置です。総入れ歯と部分入れ歯があり、噛む機能と見た目を回復します。"),
     ("部分入れ歯とは？", "残っている歯にバネなどをかけて固定する入れ歯です。失った歯の本数や位置に応じてお作りします。"),
     ("入れ歯を入れないでいるとどうなる？", "噛み合う歯が伸びたり、隣の歯が倒れたりして歯並びが崩れます。噛む力が落ち、発音や顎の負担にも影響します。"),
     ("金属床義歯とは？", "床（歯ぐきに当たる部分）を金属で作った入れ歯です。薄く丈夫で装着感がよく、食べ物の温度も伝わりやすくなります。"),
     ("アタッチメント義歯とは？", "残った歯と入れ歯を特殊な装置で連結し、安定性を高めた入れ歯です。バネが見えず審美性にも優れます。"),
     ("コーヌスクローネとは？", "残った歯に内冠をかぶせ、入れ歯側の外冠と茶筒のように適合させて固定する入れ歯です。"),
     ("マグフィット（磁性アタッチメント）とは？", "歯につける内冠と入れ歯の外冠によって入れ歯をしっかり固定します。"),
     ("コンフォート（生体シリコーン裏装）とは？", "入れ歯の内側の歯肉にあたる部分がシリコーンでできています。シリコーンはやわらかいので痛みがでにくいです。")]
)

# ---------- 審美歯科 ----------
PAGES["service-aesthetic.html"] = svc_page(
    "service-aesthetic.html", "診療のご案内｜審美歯科", "", "whitening.jpg",
    [
        svc_block("aesthetic", "ic-aesthetic", "審美歯科", "ホワイトニング・ラミネートベニア・セラミッククラウン", [
            "見た目の美しさと機能性を両立する審美歯科。中村歯科では、患者様のご希望を丁寧に伺いながら、最適な治療をご提案します。",
            "オフィスホワイトニングとホームホワイトニングを併用する「デュアルホワイトニング」、歯を最小限に削って貼り付ける「ラミネートベニア」、自然な白さと耐久性を備えた「セラミッククラウン」などを提供しています。",
        ], "svc-aesthetic.png", "審美歯科の材料"),

        svc_block("whitening", "ic-aesthetic", "ホワイトニング", "", [
            "デュアルホワイトニングとは歯科医院で行うオフィスホワイトニングと、自宅で行うホームホワイトニングを併用するホワイトニング方法です。オフィスホワイトニングの即効性と、ホームホワイトニングの持続性を組み合わせることで、より効果的に歯を白くし、その白さを長く保つことができます。当院では4〜5回のオフィスホワイトニングと1ヶ月のホームホワイトニングを推奨しております。<b>55,000円（消費税込み）</b>",
        ], None, "", ba("ba-whitening.jpg", "ホワイトニング症例（治療前→治療後）")
           + tinfo("デュアルホワイトニング", "数週間〜1ヶ月", "55,000円（税込）",
                   "知覚過敏や色戻りが生じる可能性があります。") + NOTES_CASE),

        svc_block("ceramic", "ic-aesthetic", "オールセラミッククラウン＋ラミネートベニア", "", [
            "オールセラミッククラウンは歯の全周をセラミックで覆うもの <b>110,000円（消費税込み）</b>",
            "ラミネートベニアは歯の表面にセラミックを貼りつけるもの <b>99,000円（消費税込み）</b>",
        ], None, "", ba("ba-ceramic.jpg", "セラミック症例（治療前→治療後）")
           + tinfo("オールセラミッククラウン／ラミネートベニア", "数週間〜2ヶ月",
                   "110,000円／99,000円（税込）", "歯質の削合が必要で、破損や脱離が生じる可能性があります。") + NOTES_CASE),
    ],
    [("審美歯科とは？", "歯の色・形・歯ぐきの見た目を整え、機能性と美しさを両立させる治療です。"),
     ("ポーセレンラミネートベニアとは？", "歯の表面をわずかに削り、薄いセラミックを貼り付ける方法です。すきっ歯や変色の改善に用います。"),
     ("ホワイトニング（デュアルホワイトニング）とは？", "医院で行うオフィスホワイトニングと自宅で行うホームホワイトニングを併用する方法です。即効性と持続性を両立できます。"),
     ("歯肉着色の除去（ガムブリーチング）とは？", "喫煙などで黒ずんだ歯ぐきの色素を除去し、本来の健康的なピンク色に近づける処置です。")]
)

# ---------- 矯正歯科 ----------
PAGES["service-ortho.html"] = svc_page(
    "service-ortho.html", "診療のご案内｜矯正歯科", "", "counseling.jpg",
    [
        svc_block("ortho", "ic-ortho", "矯正歯科", "", [
            "歯並びや噛み合わせを整えることで、見た目だけでなく咀嚼・発音など機能面の改善も行います。",
            "お子さまの咬合誘導（予防矯正）から大人の本格矯正まで幅広く対応。ブラケット矯正や床矯正、リンガルアーチ（裏側矯正）など、症状に合わせた方法を提案します。月1回の通院で調整可能です。",
        ], None, "", ba("ba-ortho-1.png", "矯正症例1（治療前→治療後）") + ba("ba-ortho-2.png", "矯正症例2（治療前→治療後）")
           + tinfo("リンガルバー咬合誘導・ワイヤー矯正", "1〜3年", "症例により異なります",
                   "多少の後戻りや歯ぐきの変化、むし歯リスクが生じる可能性があります。") + NOTES_CASE),
    ],
    [("矯正治療とは？", "歯に装置を装着し、少しずつ力をかけて歯を動かすことで、歯並びと噛み合わせを整える治療です。"),
     ("歯並びが悪いとどうなる？", "歯ブラシが届きにくくむし歯や歯周病になりやすくなるほか、噛み合わせのズレから顎の痛みや発音のしにくさが出ることがあります。"),
     ("治療の開始時期は？", "お子さまの場合は顎の成長を利用できる時期が適しています。成人の方は年齢を問わず開始できますので、まずはご相談ください。"),
     ("通院は？", "月に1回程度の通院で、装置の調整と経過の確認を行います。"),
     ("矯正装置の種類は？", "ブラケット矯正、床矯正、リンガルアーチ（裏側矯正）など、症状に合わせてご提案します。")]
)


# ---------------------- STAFF（実サイト準拠：氏名・役職・コメント） ----------------------
# (写真, 氏名, 役職ja, 役職en, コメント)
STAFF = [
    ("staff-nakamura.jpg",   "中村 聡", "院長",       "Clinic Owner",
     "地域医療に貢献し、親子3第4代と信頼していただける医院づくりに励んでおります。"),
    ("staff-ushijima.jpg",   "牛嶋",    "歯科医師",   "Principal Dentist",
     "「誠実、正確、丁寧」で患者様の立場に立った治療を行うよう常に心がけております。"),
    ("staff-yoneda.jpg",     "米田",    "歯科衛生士", "Dental Hygienist",
     "素敵な笑顔と何でもおいしく噛める歯になるようお手伝いしたいと思います。"),
    ("staff-haranosono.jpg", "原之園",  "歯科衛生士", "Dental Hygienist",
     "どんな些細な疑問でも聞いてもらえるように話しやすい雰囲気を心がけています。"),
    ("staff-kaneda.jpg",     "金田",    "歯科衛生士", "Dental Hygienist",
     "“元気な挨拶” “優しい笑顔” を毎日こころがけています。"),
    ("staff-koyashiki.jpg",  "小屋敷",  "歯科衛生士", "Dental Hygienist",
     "毎日元気いっぱい頑張っています。"),
    ("staff-arata.jpg",      "荒田",    "受付・助手", "Dental Receptionist・Assistant",
     "患者様とたくさんお話して私たちに不安や疑問を話していただけるよう努力をしていきたいと思います。"),
    ("staff-tabata.jpg",     "田端",    "受付・助手", "Dental Receptionist・Assistant",
     "患者様の心配と不安が少しでも軽くなるようなお話ができればうれしいです。"),
]
s = head("スタッフ紹介｜中村歯科医院（大阪 南港コスモスクエア）",
         "中村歯科医院のスタッフ紹介。院長・歯科医師・歯科衛生士・受付が連携し、患者さま一人ひとりに寄り添った診療を行っています。",
         "staff.html", "assets/img/staff-group-wide.jpg")
s += header("staff.html")
s += """<section class="page-hero page-hero--plain">
  <span class="ph-deco" aria-hidden="true"></span>
  <div class="wrap">
    <span class="eyebrow">Staff</span>
    <h1>スタッフ紹介</h1>
    <p class="sub">医師、歯科衛生士、助手のご紹介です。</p>
  </div>
</section>
<nav class="crumb"><div class="wrap"><a href="index.html">HOME</a><span>›</span><span>スタッフ紹介</span></div></nav>
"""
cards = "".join(f"""<article class="member reveal" data-d="{i%3}">
  <div class="member-photo"><img src="assets/img/{img}" alt="{name}" loading="lazy"></div>
  <p class="member-name">{name}</p>
  <p class="member-role">{ja} <span>/ {en}</span></p>
  <p class="member-cm">{cm}</p>
</article>""" for i, (img, name, ja, en, cm) in enumerate(STAFF))
s += f"""<section class="section staff">
  <div class="wrap">
    <div class="member-grid">{cards}</div>
  </div>
</section>
"""
s += tramband()
s += cta()
s += footer()
PAGES["staff.html"] = s

# ---------------------- PRICE（参考画像準拠：アイコン付きカード） ----------------------
# (アイコンkey, カテゴリ名, 補足, [(項目, 価格), ...], 幅広カードか)
PRICE = [
    ("ic-inlay", "インレー／アンレー", "部分的な被せ物", [
        ("ジルコニアインレー（小さな被せ物）", "¥44,000"),
        ("セラミックインレー（小さな被せ物）", "¥44,000"),
        ("ジルコニアアンレー（大きな被せ物）", "¥49,500"),
        ("セラミックアンレー（大きな被せ物）", "¥49,500"),
    ], False),
    ("ic-crown", "クラウン", "歯全体を覆う被せ物", [
        ("ジルコニアクラウン", "¥99,000"),
        ("オールセラミッククラウン", "¥110,000"),
        ("メタルボンドセラミック", "¥110,000〜"),
    ], False),
    ("ic-veneer", "ラミネートベニア", "歯の表面にかぶせる物", [
        ("ラミネートベニア", "¥99,000"),
    ], False),
    ("ic-implant", "インプラント", "失った歯を補う人工歯根", [
        ("インプラント", "¥330,000〜"),
    ], False),
    ("ic-denture", "義歯（入れ歯）", "取り外し式の人工歯", [
        ("金属床（コバルトクロム）", "¥275,000〜"),
        ("金属床（チタン）", "¥350,000〜"),
        ("ノンクラスプデンチャー", "¥110,000〜"),
        ("アタッチメント", "各自お見積"),
        ("コーヌスクローネ", "各自お見積"),
        ("コンフォート", "各自お見積"),
    ], True),
    ("ic-ortho", "矯正", "歯並び・噛み合わせの改善", [
        ("小児矯正", "¥275,000〜"),
        ("成人矯正", "¥660,000〜"),
    ], False),
    ("ic-white", "ホワイトニング", "歯を白くする施術", [
        ("ホームホワイトニング", "¥33,000"),
        ("デュアルホワイトニング", "¥55,000"),
    ], False),
]
cards = ""
for ic, cat, sub, rows, wide in PRICE:
    items = "".join(f'<li><span class="pi-name">{n}</span><span class="pi-yen">{p}</span></li>' for n, p in rows)
    cards += f"""<article class="price-card{' price-card--wide' if wide else ''} reveal">
  <div class="price-card-head"><span class="price-ic">{icon(ic)}</span>
    <div><h3>{cat}</h3><span class="pc-sub">{sub}</span></div></div>
  <ul class="price-items">{items}</ul>
</article>"""
s = head("自費診療 料金表｜中村歯科医院（大阪 南港コスモスクエア）",
         "中村歯科医院の自費診療料金表。セラミック・ジルコニア・インプラント・入れ歯・矯正・ホワイトニングの料金を掲載しています。表示価格はすべて税込です。",
         "price.html", "assets/img/hero-shelf.jpg")
s += header("price.html")
s += """<section class="page-hero page-hero--plain">
  <span class="ph-deco" aria-hidden="true"></span>
  <div class="wrap">
    <span class="eyebrow">Price</span>
    <h1>自費診療 料金表</h1>
    <p class="sub">PRICE LIST ｜ 表示価格はすべて税込です。</p>
  </div>
</section>
<nav class="crumb"><div class="wrap"><a href="index.html">HOME</a><span>›</span><span>自費診療 料金表</span></div></nav>
"""
s += f"""<section class="section price-sec">
  <div class="wrap">
    <div class="lead-block reveal" style="margin-bottom:clamp(2.4rem,5vw,4rem)">
      <h2>納得いただいたうえで、治療を始めます。</h2>
      <p>自費診療をご検討の際は、治療内容と費用を事前に必ずご説明します。ご不明な点はどうぞお気軽におたずねください。</p>
    </div>
    <div class="price-grid">{cards}</div>
    <p class="price-note">※表示価格はすべて税込です。<br>※治療内容やお口の状態により、別途費用がかかる場合がございます。詳しくは診療時にご説明いたします。</p>
  </div>
</section>
"""
s += tramband()
s += cta()
s += footer()
PAGES["price.html"] = s

# ---------------------- ACCESS ----------------------
s = head("アクセス｜中村歯科医院（大阪 南港コスモスクエア・咲洲庁舎3F）",
         "中村歯科医院へのアクセス。Osaka Metro中央線コスモスクエア駅 徒歩8分、ニュートラム トレードセンター前駅 徒歩5分。大阪府咲洲庁舎（コスモタワー）3F。",
         "access.html", "assets/img/cosmo-tower-real.jpg")
s += header("access.html")
s += page_hero("Access", "アクセス", "咲洲庁舎（コスモタワー）3F ｜ トレードセンター前駅 徒歩5分", "cosmo-tower-real.jpg")
s += f"""<section class="section access">
  <div class="wrap">
    <div class="access-grid">
      <div class="access-map reveal">
        <iframe title="中村歯科医院 地図" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
          src="https://maps.google.com/maps?q=%E5%A4%A7%E9%98%AA%E5%BA%9C%E5%92%B2%E6%B4%B2%E5%BA%81%E8%88%8E&t=&z=16&ie=UTF8&iwloc=&output=embed"></iframe>
      </div>
      <div class="reveal" data-d="1">
        <dl>
          <div class="info-row"><dt>ADDRESS</dt><dd>{ADDR1}<br>{ADDR2}</dd></div>
          <div class="info-row"><dt>ACCESS</dt><dd>Osaka Metro中央線「コスモスクエア駅」徒歩8分<span class="sub">ニュートラム（南港ポートタウン線）「トレードセンター前駅」徒歩5分</span></dd></div>
          <div class="info-row"><dt>TEL</dt><dd><span class="big">{TEL}</span></dd></div>
          <div class="info-row"><dt>HOURS</dt><dd>9:30〜13:00 ／ 15:00〜19:00<span class="sub">土曜午後は15:00〜17:00　休診日：日曜日・祝日</span></dd></div>
        </dl>
        <a class="btn btn-ghost" style="margin-top:1.6rem;border-color:rgba(255,255,255,.3);color:#fff" href="https://maps.google.com/?q=大阪府咲洲庁舎" target="_blank" rel="noopener">Googleマップで見る<span class="arw">›</span></a>
      </div>
    </div>
  </div>
</section>
"""
s += tramband("ニュートラムに乗って、海辺の歯科医院へ。", "コスモスクエア駅・トレードセンター前駅から、どちらでもお越しいただけます。")
s += cta()
s += footer()
PAGES["access.html"] = s

# ---------------------- INDEX ----------------------
JSONLD = """<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Dentist","name":"中村歯科医院","alternateName":"Nakamura Dental Office",
"url":"%s/","image":"%s/assets/img/hero-reception.jpg","telephone":"+81-6-6615-6180",
"priceRange":"¥¥","medicalSpecialty":["Dentistry"],
"address":{"@type":"PostalAddress","streetAddress":"南港北1丁目14-16 大阪府咲洲庁舎3F","addressLocality":"大阪市住之江区","addressRegion":"大阪府","postalCode":"559-0034","addressCountry":"JP"},
"geo":{"@type":"GeoCoordinates","latitude":34.6376,"longitude":135.4106},
"openingHoursSpecification":[
{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday"],"opens":"09:30","closes":"13:00"},
{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday"],"opens":"15:00","closes":"19:00"},
{"@type":"OpeningHoursSpecification","dayOfWeek":"Saturday","opens":"09:30","closes":"13:00"},
{"@type":"OpeningHoursSpecification","dayOfWeek":"Saturday","opens":"15:00","closes":"17:00"}],
"areaServed":["南港","コスモスクエア","住之江区","大阪市"]}
</script>
""" % (SITE, SITE)

# 実サイト同様、院内カットに咲洲庁舎の外観・診療風景を織り交ぜてフェード
HERO_SLIDES = [
    ("hero-shelf.jpg", "中村歯科医院の院内（待合スペース）"),
    ("hero-front.jpg", "中村歯科医院の入口"),
    ("cosmo-tower-real.jpg", "医院が入る大阪府咲洲庁舎（コスモタワー）"),
    ("hero-waiting.jpg", "中村歯科医院の待合室"),
]
slides = "".join(
    '<div class="slide%s"><img src="assets/img/%s" alt="%s"%s></div>'
    % (" on" if i == 0 else "", img, alt, "" if i == 0 else ' loading="lazy"')
    for i, (img, alt) in enumerate(HERO_SLIDES))
dots = "".join('<button aria-label="スライド%d"%s></button>' % (i + 1, " class=\"on\"" if i == 0 else "")
               for i in range(len(HERO_SLIDES)))

svc_cards = "".join("""<a class="svc-card reveal" data-d="%d" href="%s">
  <span class="svc-ic">%s</span>
  <h4>%s</h4><span class="en">%s</span><p>%s</p>
  <span class="more">詳しくはこちら<span class="arw">›</span></span>
</a>""" % (i % 4, href, icon(ic), ja, en, desc)
    for i, (href, ja, en, ic, desc, hero) in enumerate(SERVICES))

staff_cards = "".join("""<article class="member reveal" data-d="%d">
  <div class="member-photo"><img src="assets/img/%s" alt="%s" loading="lazy"></div>
  <p class="member-name">%s</p><p class="member-role">%s</p></article>""" % (i % 4, img, name, name, ja)
    for i, (img, name, ja, en, cm) in enumerate(STAFF[:4]))

s = head("中村歯科医院｜大阪 南港コスモスクエア・咲洲庁舎3Fの歯科",
         "大阪市住之江区南港・コスモスクエア（大阪府咲洲庁舎3F）の中村歯科医院。30年の信頼と実績で、一般歯科・小児歯科・インプラント・審美歯科・入れ歯まで対応。コスモスクエア駅・トレードセンター前駅すぐ。",
         "", "assets/img/hero-reception.jpg", JSONLD)
s += header("index.html")
s += """<section class="hero" id="top">
  <div class="hero-slides">%s</div>
  <!-- 街並みシルエット：空を抜いて写真と重ねる -->
  <div class="hero-skyline" data-tram="assets/img/skyline-silhouette.svg?v=%s" aria-hidden="true"></div>
  <div class="hero-dots">%s</div>
  <div class="hero-copy">
    <h1 class="hero-vert">歯を守る治療に誠実であり続ける。</h1>
    <p class="hero-vert">３０年の信頼と実績を</p>
    <p class="hero-vert">あなたの笑顔のために。</p>
  </div>
  <a href="#news" class="scroll-cue">SCROLL</a>
</section>
""" % (slides, VER, dots)
s += """<section class="section news" id="news">
  <div class="wrap">
    <div class="sec-head reveal"><span class="eyebrow">News</span><h2 class="ja">お知らせ<span class="en">/ News</span></h2></div>
    <div class="news-grid reveal" id="newsList" data-src="data/news.json" data-d="1"></div>
  </div>
</section>

<section class="section about" id="about">
  <div class="wrap about-grid">
    <div class="about-figure reveal">
      <div class="wipe"><img src="assets/img/clinic-interior.jpg" alt="中村歯科医院の院内" loading="lazy"></div>
      <span class="frame"></span>
      <div class="badge"><b>20</b><span>YEARS OF TRUST</span></div>
    </div>
    <div class="about-body reveal" data-d="1">
      <span class="eyebrow">About us</span>
      <h3 class="lines"><span class="ln"><span>信頼と実績に基づく幅広い治療で応えます</span></span><span class="ln"><span><em style="font-style:normal" class="soft">綺麗な笑顔　健康なお口</em></span></span></h3>
      <p>当院では２０年以上にわたり、院長　副院長のドクター2名体制で多くの患者様に来院していただいております。私たちはこの経験と技術の向上により、出来る限り歯の保存に努め、患者さまのさまざまなお口の悩みに対応しています。</p>
      <p>保険診療内で満足して頂くよう常日頃より努力しておりますが、カバーしきれない治療、審美歯科(ホワイトニング　ガムピーリング　セラミックetc）.インプラント.特殊義歯.矯正なども多数実績がございます。</p>
      <p>最新の技術と専門的な知識を活かし、患者さまのご要望を大切にした提案をいたします。美しい笑顔と健康なお口を守るお手伝いができれば幸いです。</p>
      <p class="barrier">当院は車椅子をご利用の患者様にも安心して歯科治療を受けていただけるよう、バリアフリーに対応をしております。</p>
    </div>
  </div>
</section>

<section class="section service" id="service">
  <div class="wrap">
    <div class="sec-head center reveal"><span class="eyebrow">Service</span><h2 class="ja">診療のご案内<span class="en">/ Service</span></h2></div>
    <div class="svc-grid">%s</div>
  </div>
</section>

<section class="section staff" id="staff">
  <div class="wrap">
    <div class="sec-head reveal"><span class="eyebrow">Staff</span><h2 class="ja">スタッフ紹介<span class="en">/ Staff</span></h2></div>
    <div class="staff-feature">
      <div class="staff-feature-fig wipe"><img src="assets/img/staff-two.jpg" alt="中村歯科医院のスタッフ" loading="lazy"></div>
      <div class="staff-feature-body reveal" data-d="1">
        <h3>患者さま一人ひとりに寄り添った、やさしい診療を心がけています</h3>
        <p>当院のスタッフは、患者さま一人ひとりに寄り添い、丁寧でやさしい診療を心がけています。お口の健康を守るだけでなく、患者さまが安心して治療を受けられるよう、笑顔でサポートいたします。どんなお悩みでもお気軽にご相談ください。</p>
        <a class="more-link" href="staff.html">詳しくはこちら<span class="arw">›</span></a>
      </div>
    </div>
  </div>
</section>

<section class="section access" id="access">
  <div class="wrap">
    <div class="sec-head reveal"><span class="eyebrow">Clinic</span><h2 class="ja">中村歯科医院について<span class="en">/ Clinic</span></h2></div>
    <div class="access-grid">
      <div class="access-map reveal">
        <iframe title="中村歯科医院 地図" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
          src="https://maps.google.com/maps?q=%%E5%%A4%%A7%%E9%%98%%AA%%E5%%BA%%9C%%E5%%92%%B2%%E6%%B4%%B2%%E5%%BA%%81%%E8%%88%%8E&t=&z=16&ie=UTF8&iwloc=&output=embed"></iframe>
      </div>
      <div class="reveal" data-d="1">
        <h3 class="blk-ttl">診療時間</h3>
        <p class="blk-note">予約制　新患随時</p>
        %s
        <h3 class="blk-ttl" style="margin-top:2.4rem">所在地</h3>
        <p class="blk-body">大阪市住之江区南港北１丁目１４－１６ 大阪府咲洲庁舎 ３Ｆ<br>
          <span class="sub">地下鉄中央線コスモスクエア駅 徒歩8分／ニュートラム トレードセンター前駅 徒歩5分</span></p>
        <h3 class="blk-ttl" style="margin-top:2.4rem">連絡先</h3>
        <p class="blk-body">TEL <a href="tel:0666156180" class="ul">06-6615-6180</a></p>
        <a class="btn btn-ghost" style="margin-top:1.8rem;border-color:rgba(255,255,255,.3);color:#fff" href="access.html">アクセス詳細を見る<span class="arw">›</span></a>
      </div>
    </div>
  </div>
</section>
""" % (svc_cards, HOURS_TABLE)
s += cta()
s += footer()
PAGES["index.html"] = s

# ============================ WRITE ============================
for name, content in PAGES.items():
    with open(os.path.join(ROOT, name), "w", encoding="utf-8") as f:
        f.write(content)
    print("built", name)

# ---- sitemap.xml も生成物から自動生成（構成ズレ防止） ----
import datetime
_today = datetime.date.today().isoformat()
_urls = []
for name in sorted(PAGES):
    if name == "index.html":
        loc, pr, cf = SITE + "/", "1.0", "weekly"
    elif name.startswith("service"):
        loc, pr, cf = f"{SITE}/{name}", "0.9", "monthly"
    else:
        loc, pr, cf = f"{SITE}/{name}", "0.8", "monthly"
    _urls.append(f"  <url>\n    <loc>{loc}</loc>\n    <lastmod>{_today}</lastmod>\n"
                 f"    <changefreq>{cf}</changefreq>\n    <priority>{pr}</priority>\n  </url>\n")
with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + "".join(_urls) + "</urlset>\n")
print("built sitemap.xml (%d urls)" % len(_urls))
print("done:", len(PAGES), "pages")
