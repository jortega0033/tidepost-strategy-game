// Static server for dist/ on one stable loopback origin (GET and HEAD only).
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { extname, resolve, sep } from "node:path";

const HOST = "127.0.0.1";
const root = resolve(fileURLToPath(new URL("../dist", import.meta.url)));
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8" };
const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log("Usage: node scripts/serve.mjs [--help] [--version]\nServes dist/ on http://127.0.0.1:8791 (fails when the port is taken).");
  process.exit(0);
}
if (args.includes("--version") || args.includes("-v")) {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  console.log(pkg.version);
  process.exit(0);
}

const portOption = args.indexOf("--port");
const port = portOption >= 0 ? Number(args[portOption + 1]) : 8791; // --port is for tests only

const server = createServer(async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  try {
    let path = decodeURIComponent(new URL(req.url, `http://${HOST}`).pathname);
    if (path.endsWith("/")) path += "index.html";
    const file = resolve(root, `.${path}`);
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    res.writeHead(404).end();
  }
});

server.on("error", (err) => {
  console.error(`cannot listen on ${HOST}:${port}: ${err.message}`);
  process.exit(1);
});
server.listen(port, HOST, () => console.log(`http://${HOST}:${port}`));
