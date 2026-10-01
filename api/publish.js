// 管理画面の「公開する」から呼ばれる、お知らせ公開用の関数（Vercel Serverless Function）。
//
// サイト本体は GitHub Pages で配信している。この関数だけを Vercel に置き、
// GitHub の書き込み鍵をサーバー側に閉じ込めたまま data/news.json を更新する。
// 鍵とパスワードはブラウザに一切渡らない。
//
// 必要な環境変数（Vercel の Project Settings → Environment Variables）:
//   ADMIN_PASSWORD  管理画面のパスワード
//   GITHUB_TOKEN    Fine-grained token（このリポジトリの Contents: Read and write のみ）
//   GITHUB_REPO     例: shindory2000/nakamuradental（省略時はこの値）
//   GITHUB_BRANCH   GitHub Pages の公開ブランチ（省略時 main）
//   ALLOWED_ORIGIN  管理画面の配信元（省略時 https://nakamuradental.jp）
//
// POST { action: "login", password }         → パスワード確認のみ
// POST { action: "publish", password, news } → data/news.json を置き換えて commit

const crypto = require("crypto");

const PATH = "data/news.json";
const CATEGORIES = ["お知らせ", "診療案内", "重要", "休診"];
const MAX_ITEMS = 50;
const MAX_TITLE = 200;

function sameSecret(a, b) {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

// 受け取ったお知らせを検証し、公開用の形に揃える。不正なら理由の文字列を返す。
function normalize(news) {
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

async function publish(items) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || "shindory2000/nakamuradental";
  const branch = process.env.GITHUB_BRANCH || "main";
  const url = "/repos/" + repo + "/contents/" + PATH;

  const content = JSON.stringify(items, null, 2) + "\n";
  // 同時に2人が公開しても片方が消えないよう、sha の食い違い(409)は取り直して1回だけやり直す。
  for (let attempt = 0; attempt < 2; attempt++) {
    const cur = await gh("GET", url + "?ref=" + encodeURIComponent(branch), token);
    if (cur.status !== 200 && cur.status !== 404) throw new Error("GitHub read failed: " + cur.status);
    const sha = cur.status === 200 ? cur.data.sha : undefined;
    if (sha && Buffer.from(cur.data.content || "", "base64").toString("utf8") === content) return "unchanged";

    const put = await gh("PUT", url, token, {
      message: "お知らせを更新（管理画面から公開）",
      content: Buffer.from(content, "utf8").toString("base64"),
      branch,
      ...(sha ? { sha } : {}),
    });
    if (put.status === 200 || put.status === 201) return "published";
    if (put.status !== 409) throw new Error("GitHub write failed: " + put.status);
  }
  throw new Error("GitHub write conflict");
}

module.exports = async function handler(req, res) {
  const origin = process.env.ALLOWED_ORIGIN || "https://nakamuradental.jp";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  if (!process.env.ADMIN_PASSWORD || !process.env.GITHUB_TOKEN) {
    return res.status(500).json({ error: "サーバーの設定が済んでいません" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  if (!body || typeof body !== "object") return res.status(400).json({ error: "リクエストが正しくありません" });

  if (!sameSecret(body.password || "", process.env.ADMIN_PASSWORD)) {
    return res.status(401).json({ error: "パスワードが違います" });
  }
  if (body.action === "login") return res.status(200).json({ ok: true });
  if (body.action !== "publish") return res.status(400).json({ error: "リクエストが正しくありません" });

  const items = normalize(body.news);
  if (typeof items === "string") return res.status(400).json({ error: items });

  try {
    const result = await publish(items);
    return res.status(200).json({ ok: true, result, news: items });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: "公開に失敗しました。時間をおいてもう一度お試しください" });
  }
};

module.exports.normalize = normalize;
