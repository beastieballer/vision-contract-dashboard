import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createLead, getLeadById, listLeads, patchLead } from "./src/leads.js";
import { getSettings, patchSettings } from "./src/settings.js";
import {
  generateBallparkQuoteForLead,
  generateProposalForLead,
  getQuoteById,
  listQuotesForLead
} from "./src/quotes.js";
import { draftReplyForLead, listMessagesForLead } from "./src/messages.js";
import { createDefaultFollowUpsForLead, listTasksForLead } from "./src/tasks.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function sendJson(res, code, value) {
  const body = JSON.stringify(value);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body) });
  res.end(body);
}

function sendText(res, code, value, contentType = "text/plain; charset=utf-8") {
  const body = String(value ?? "");
  res.writeHead(code, { "Content-Type": contentType, "Content-Length": Buffer.byteLength(body) });
  res.end(body);
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 2_000_000) {
        reject(new Error("body_too_large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function matchRoute(pattern, pathname) {
  const pParts = pattern.split("/").filter(Boolean);
  const aParts = pathname.split("/").filter(Boolean);
  if (pParts.length !== aParts.length) return null;

  const params = {};
  for (let i = 0; i < pParts.length; i++) {
    const p = pParts[i];
    const a = aParts[i];
    if (p.startsWith(":")) params[p.slice(1)] = decodeURIComponent(a);
    else if (p !== a) return null;
  }
  return params;
}

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"]
]);

function tryServeStatic(req, res, pathname) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  if (safePath.includes("..")) return false;
  const filePath = path.join(__dirname, safePath);
  if (!filePath.startsWith(__dirname)) return false;
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return false;

  const ext = path.extname(filePath).toLowerCase();
  const ct = contentTypes.get(ext) ?? "application/octet-stream";
  res.writeHead(200, { "Content-Type": ct });
  fs.createReadStream(filePath).pipe(res);
  return true;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const pathname = url.pathname;
    const method = (req.method ?? "GET").toUpperCase();

    if (method === "GET" && pathname === "/api/health") return sendJson(res, 200, { ok: true });

    if (method === "GET" && pathname === "/api/settings") return sendJson(res, 200, getSettings());
    if (method === "PATCH" && pathname === "/api/settings") {
      const body = await parseJsonBody(req);
      return sendJson(res, 200, patchSettings(body ?? {}));
    }

    if (method === "GET" && pathname === "/api/leads") return sendJson(res, 200, listLeads());
    if (method === "POST" && pathname === "/api/leads") {
      const body = await parseJsonBody(req);
      return sendJson(res, 201, createLead(body ?? {}));
    }

    const leadParams = matchRoute("/api/leads/:id", pathname);
    if (leadParams && method === "GET") {
      const lead = getLeadById(leadParams.id);
      if (!lead) return sendJson(res, 404, { error: "not_found" });
      return sendJson(res, 200, lead);
    }
    if (leadParams && method === "PATCH") {
      const body = await parseJsonBody(req);
      const lead = patchLead(leadParams.id, body ?? {});
      if (!lead) return sendJson(res, 404, { error: "not_found" });
      return sendJson(res, 200, lead);
    }

    const tasksParams = matchRoute("/api/leads/:id/tasks", pathname);
    if (tasksParams && method === "GET") return sendJson(res, 200, listTasksForLead(tasksParams.id));

    const followUpsParams = matchRoute("/api/leads/:id/actions/create-followups", pathname);
    if (followUpsParams && method === "POST") {
      const result = createDefaultFollowUpsForLead(followUpsParams.id);
      if (!result) return sendJson(res, 404, { error: "not_found" });
      return sendJson(res, 200, result);
    }

    const quotesParams = matchRoute("/api/leads/:id/quotes", pathname);
    if (quotesParams && method === "GET") return sendJson(res, 200, listQuotesForLead(quotesParams.id));

    const quoteParams = matchRoute("/api/quotes/:id", pathname);
    if (quoteParams && method === "GET") {
      const quote = getQuoteById(quoteParams.id);
      if (!quote) return sendJson(res, 404, { error: "not_found" });
      return sendJson(res, 200, quote);
    }

    const quoteHtmlParams = matchRoute("/api/quotes/:id/proposal.html", pathname);
    if (quoteHtmlParams && method === "GET") {
      const quote = getQuoteById(quoteHtmlParams.id);
      if (!quote) return sendText(res, 404, "Not found");
      return sendText(res, 200, quote.outputs?.proposalHtml ?? "<p>No proposal HTML.</p>", "text/html; charset=utf-8");
    }

    const ballparkParams = matchRoute("/api/leads/:id/actions/generate-ballpark", pathname);
    if (ballparkParams && method === "POST") {
      const body = await parseJsonBody(req);
      const quote = generateBallparkQuoteForLead(ballparkParams.id, body ?? {});
      if (!quote) return sendJson(res, 404, { error: "not_found" });
      return sendJson(res, 201, quote);
    }

    const proposalParams = matchRoute("/api/leads/:id/actions/generate-proposal", pathname);
    if (proposalParams && method === "POST") {
      const body = await parseJsonBody(req);
      const quote = generateProposalForLead(proposalParams.id, body ?? {});
      if (!quote) return sendJson(res, 404, { error: "not_found" });
      return sendJson(res, 201, quote);
    }

    const messagesParams = matchRoute("/api/leads/:id/messages", pathname);
    if (messagesParams && method === "GET") return sendJson(res, 200, listMessagesForLead(messagesParams.id));

    const draftParams = matchRoute("/api/leads/:id/actions/draft-reply", pathname);
    if (draftParams && method === "POST") {
      const body = await parseJsonBody(req);
      const message = draftReplyForLead(draftParams.id, body ?? {});
      if (!message) return sendJson(res, 404, { error: "not_found" });
      return sendJson(res, 201, message);
    }

    if (method === "GET" && tryServeStatic(req, res, pathname)) return;

    return sendJson(res, 404, { error: "not_found" });
  } catch (e) {
    if (e?.message === "body_too_large") return sendJson(res, 413, { error: "body_too_large" });
    return sendJson(res, 500, { error: "server_error", detail: String(e?.message ?? e) });
  }
});

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
server.listen(port, "127.0.0.1", () => {
  // eslint-disable-next-line no-console
  console.log(`Window film workflow prototype running on http://localhost:${port}`);
});
