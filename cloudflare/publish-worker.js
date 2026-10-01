// 管理画面の「公開する」から呼ばれる、お知らせ公開用の窓口（Cloudflare Workers）。
//
// サイト本体は GitHub Pages で配信している。この Worker だけを Cloudflare に置き、
// GitHub の書き込み鍵をサーバー側に閉じ込めたまま data/news.json を更新する。
// 鍵とパスワードはブラウザに一切渡らない。
//
// Cloudflare のダッシュボードで Worker を作り、このファイルの中身をそのまま貼り付ける。
// Settings → Variables and Secrets に登録するもの:
//   ADMIN_PASSWORD  管理画面のパスワード（Secret）
//   GITHUB_TOKEN    Fine-grained token（このリポジトリの Contents: Read and write のみ、Secret）
//   GITHUB_REPO     省略時 shindory2000/nakamuradental
//   GITHUB_BRANCH   GitHub Pages の公開ブランチ。省略時 main
//   ALLOWED_ORIGIN  管理画面の配信元。省略時 https://nakamuradental.jp
//
// POST { action: "login", password }         → パスワード確認のみ
// POST { action: "publish", password, news } → data/news.json を置き換えて commit

const PATH = "data/news.json";
const CATEGORIES = ["お知らせ", "診療案内", "重要", "休診"];
const MAX_ITEMS = 50;
const MAX_TITLE = 200;

async function sameSecret(a, b) {
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(String(a))),
    crypto.subtle.digest("SHA-256", enc.encode(String(b))),
  ]);
  const p = new Uint8Array(x), q = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < p.length; i++) diff |= p[i] ^ q[i];
  return diff === 0;
}

// 受け取ったお知らせを検証し、公開用の形に揃える。不正なら理由の文字列を返す。
export function normalize(news) {
  if (!Array.isArray(news)) return "お知らせの形式が正しくありません";
  if (news.length > MAX_ITEMS) return "お知らせは" + MAX_ITEMS + "件までです";
  const out = [];
  for (const n of news) {
    if (!n || typeof n !== "object") return "お知らせの形式が正しくありません";
    const date = String(n.date || "");
    const title = String(n.title || "").trim();
    const category = String(n.category || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date + "T00:00:00"))) return "日付が正しくありません: " + date;
    if (!title) return "タイトルが空のお知らせがあります";
    if (title.length > MAX_TITLE) return "タイトルが長すぎます（" + MAX_TITLE + "文字まで）";
    if (!CATEGORIES.includes(category)) return "種類が正しくありません: " + category;
    out.push({ date, category, title });
  }
  out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return out;
}

function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

function fromBase64(b64) {
  const bin = atob(String(b64 || "").replace(/\n/g, ""));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

async function gh(method, url, token, body) {
  const r = await fetch("https://api.github.com" + url, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "nakamuradental-admin",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}

async function publish(items, env) {
  const token = env.GITHUB_TOKEN;
  const repo = env.GITHUB_REPO || "shindory2000/nakamuradental";
  const branch = env.GITHUB_BRANCH || "main";
  const url = "/repos/" + repo + "/contents/" + PATH;

  const content = JSON.stringify(items, null, 2) + "\n";
  // 同時に2人が公開しても片方が消えないよう、sha の食い違い(409)は取り直して1回だけやり直す。
  for (let attempt = 0; attempt < 2; attempt++) {
    const cur = await gh("GET", url + "?ref=" + encodeURIComponent(branch), token);
    if (cur.status !== 200 && cur.status !== 404) throw new Error("GitHub read failed: " + cur.status);
    const sha = cur.status === 200 ? cur.data.sha : undefined;
    if (sha && fromBase64(cur.data.content) === content) return "unchanged";

    const put = await gh("PUT", url, token, {
      message: "お知らせを更新（管理画面から公開）",
      content: toBase64(content),
      branch,
      ...(sha ? { sha } : {}),
    });
    if (put.status === 200 || put.status === 201) return "published";
    if (put.status !== 409) throw new Error("GitHub write failed: " + put.status);
  }
  throw new Error("GitHub write conflict");
}

export default {
  async fetch(request, env) {
    const headers = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "https://nakamuradental.jp",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      Vary: "Origin",
      "Cache-Control": "no-store",
    };
    const reply = (status, obj) =>
      new Response(obj === undefined ? null : JSON.stringify(obj), {
        status,
        headers: obj === undefined ? headers : { ...headers, "Content-Type": "application/json; charset=utf-8" },
      });

    if (request.method === "OPTIONS") return reply(204);
    if (request.method !== "POST") return reply(405, { error: "POST only" });

    if (!env.ADMIN_PASSWORD || !env.GITHUB_TOKEN) {
      return reply(500, { error: "サーバーの設定が済んでいません" });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return reply(400, { error: "リクエストが正しくありません" });

    if (!(await sameSecret(body.password || "", env.ADMIN_PASSWORD))) {
      return reply(401, { error: "パスワードが違います" });
    }
    if (body.action === "login") return reply(200, { ok: true });
    if (body.action !== "publish") return reply(400, { error: "リクエストが正しくありません" });

    const items = normalize(body.news);
    if (typeof items === "string") return reply(400, { error: items });

    try {
      const result = await publish(items, env);
      return reply(200, { ok: true, result, news: items });
    } catch (e) {
      console.error(e);
      return reply(502, { error: "公開に失敗しました。時間をおいてもう一度お試しください" });
    }
  },
};
