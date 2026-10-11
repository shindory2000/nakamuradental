# -*- coding: utf-8 -*-
"""
ロリポップの旧アドレス（nakamura-dental.main.jp）に載せる版を作る。

  $ python3 build-mainjp.py [出力フォルダ]

- ページ本体（HTML 10枚）と .htaccess / robots.txt だけを出力する。
  画像・CSS・JS・お知らせデータは nakamuradental.jp（GitHub Pages）のものを絶対URLで読む。
  → ロリポップには小さなファイルを数個置くだけ。お知らせ更新も従来の管理画面だけで済む。
- canonical・サイトマップ・構造化データのURLは旧アドレスにそろえる。
"""
import os, re, shutil, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.abspath(__file__))
OLD = "https://nakamura-dental.main.jp"
NEW = "https://nakamuradental.jp"
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "dist-mainjp")

tmp = tempfile.mkdtemp()
work = os.path.join(tmp, "site")
shutil.copytree(ROOT, work, ignore=shutil.ignore_patterns(".git", "dist-mainjp", "cloudflare", "*.JPG", "*.md"))
src = open(os.path.join(work, "build.py"), encoding="utf-8").read()
src = src.replace('SITE = "https://nakamuradental.jp"', f'SITE = "{OLD}"', 1)
open(os.path.join(work, "build.py"), "w", encoding="utf-8").write(src)
subprocess.run([sys.executable, "build.py"], cwd=work, check=True, stdout=subprocess.DEVNULL)

PAGES = ["index.html", "access.html", "price.html", "service.html", "service-aesthetic.html",
         "service-denture.html", "service-implant.html", "service-ortho.html", "staff.html", "review.html"]

def conv(h):
    # 画像・CSS・JS は GitHub Pages 側のものを使う
    h = re.sub(r'((?:href|src|data-tram|content)=")assets/', r"\1" + NEW + "/assets/", h)
    h = re.sub(r"url\((['\"]?)assets/", r"url(\1" + NEW + "/assets/", h)
    h = re.sub(r'(<link rel="manifest" href=")site\.webmanifest', r"\1" + NEW + "/site.webmanifest", h)
    # お知らせ・休診日データも GitHub Pages 側を読む（管理画面の更新がそのまま反映される）
    h = h.replace('data-src="data/news.json', 'data-src="' + NEW + '/data/news.json')
    h = h.replace('<script src="' + NEW + '/assets/js/clinic-days.js',
                  '<script>window.NK_DATA_BASE="' + NEW + '/";</script>\n<script src="' + NEW + '/assets/js/clinic-days.js', 1)
    # 画像のURLは旧アドレスに置かれていないので、元の場所に戻す
    h = h.replace(OLD + "/assets/", NEW + "/assets/")
    return h

os.makedirs(OUT, exist_ok=True)
for name in PAGES:
    h = open(os.path.join(work, name), encoding="utf-8").read()
    open(os.path.join(OUT, name), "w", encoding="utf-8").write(conv(h))
shutil.copy(os.path.join(work, "sitemap.xml"), os.path.join(OUT, "sitemap.xml"))

open(os.path.join(OUT, "robots.txt"), "w", encoding="utf-8").write(
    f"User-agent: *\nAllow: /\n\nSitemap: {OLD}/sitemap.xml\n")

open(os.path.join(OUT, "htaccess.txt"), "w", encoding="utf-8").write(
    """# ロリポップ用（アップロード後に名前を「.htaccess」に変える）
RewriteEngine On

# https に統一
RewriteCond %{HTTPS} !=on
RewriteRule ^(.*)$ https://nakamura-dental.main.jp/$1 [R=301,L]

# 旧ページ名 → 新ページ名（同じドメイン内の恒久転送）
RewriteRule ^shinryo\\.html?$    /service.html            [R=301,L]
RewriteRule ^aesthetic\\.html?$  /service-aesthetic.html  [R=301,L]
RewriteRule ^denture\\.html?$    /service-denture.html    [R=301,L]
RewriteRule ^implant\\.html?$    /service-implant.html    [R=301,L]
RewriteRule ^kyousei\\.html?$    /service-ortho.html      [R=301,L]
""")
shutil.rmtree(tmp)
print("出力:", OUT)
for f in sorted(os.listdir(OUT)):
    print(f"  {f:28s}{os.path.getsize(os.path.join(OUT, f)):>8,} bytes")
