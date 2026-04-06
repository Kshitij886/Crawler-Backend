// builtwith.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import axios from "axios";

let data = loadApps();

export default async function builtwith(url, headers = null, html = null, userAgent = "builtwith") {
  let techs = {};
  let osGuess = "Unknown";

  // check URL patterns
  for (const [appName, appSpec] of Object.entries(data.apps)) {
    if (appSpec.url && contains(url, appSpec.url)) {
      addApp(techs, appName, appSpec);
    }
  }

  // fetch content if not provided
  if (!headers || !html) {
    try {
      let response;
      if (html) {
        response = await axios.head(url, { headers: { "User-Agent": userAgent } });
      } else {
        response = await axios.get(url, { headers: { "User-Agent": userAgent } });
      }

      if (!headers) headers = response.headers || {};
      if (!html && response.data) html = response.data;
    } catch (e) {
      console.error("Error fetching URL:", e.message);
      return { techs, os: osGuess };
    }
  }

  // check headers
  if (headers) {
    for (const [appName, appSpec] of Object.entries(data.apps)) {
      if (appSpec.headers && containsDict(headers, appSpec.headers)) {
        addApp(techs, appName, appSpec);
      }
    }

    // try OS detection
    osGuess = guessOS(headers);
  }

  // check HTML / scripts
  if (html) {
    if (Buffer.isBuffer(html)) html = html.toString();

    for (const [appName, appSpec] of Object.entries(data.apps)) {
      for (const key of ["html", "script"]) {
        let snippets = appSpec[key];
        if (!Array.isArray(snippets) && snippets) snippets = [snippets];
        if (snippets) {
          for (const snippet of snippets) {
            if (contains(html, snippet)) {
              addApp(techs, appName, appSpec);
              break;
            }
          }
        }
      }
    }

    // check meta tags
    const metas = {};
    const metaRegex = /<meta[^>]*?name=['"]([^'"]+)['"][^>]*?content=['"]([^'"]+)['"][^>]*?>/gi;
    let match;
    while ((match = metaRegex.exec(html))) {
      metas[match[1]] = match[2];
    }

    for (const [appName, appSpec] of Object.entries(data.apps)) {
      if (appSpec.meta) {
        for (const [name, content] of Object.entries(appSpec.meta)) {
          if (metas[name] && contains(metas[name], content)) {
            addApp(techs, appName, appSpec);
            break;
          }
        }
      }
    }
  }

  return { techs, os: osGuess };
}

function guessOS(headers) {
  const server = (headers["server"] || headers["Server"] || "").toLowerCase();
  const powered = (headers["x-powered-by"] || "").toLowerCase();

  if (server.includes("microsoft") || server.includes("iis") || powered.includes("asp.net")) {
    return "Windows (IIS)";
  }
  if (server.includes("apache") || server.includes("nginx") || server.includes("litespeed")) {
    return "Linux/Unix-like";
  }
  if (server.includes("openbsd")) {
    return "OpenBSD";
  }
  if (server.includes("cloudflare")) {
    return "Unknown (Cloudflare)";
  }
  if (server.includes("gws") || server.includes("google")) {
    return "Google Web Server (Linux-based)";
  }
  if (server.includes("oracle")) {
    return "Solaris/Oracle";
  }

  // fallback
  return "-";
}

function addApp(techs, appName, appSpec) {
  for (const category of getCategories(appSpec)) {
    if (!techs[category]) techs[category] = [];
    if (!techs[category].includes(appName)) {
      techs[category].push(appName);

      let implies = appSpec.implies || [];
      if (!Array.isArray(implies)) implies = [implies];
      for (const impliedApp of implies) {
        if (data.apps[impliedApp]) {
          addApp(techs, impliedApp, data.apps[impliedApp]);
        }
      }
    }
  }
}

function getCategories(appSpec) {
  return appSpec.cats.map((catId) => data.categories[catId.toString()]);
}

function contains(v, regex) {
  if (Buffer.isBuffer(v)) v = v.toString();
  const r = new RegExp(regex.split("\\;")[0], "i");
  return r.test(v);
}

function containsDict(d1, d2) {
  for (const [k2, v2] of Object.entries(d2)) {
    const v1 = d1[k2.toLowerCase()] || d1[k2];
    if (!v1 || !contains(v1, v2)) return false;
  }
  return true;
}

function loadApps(filename = "apps.json") {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const filepath = path.join(__dirname, filename);
  return JSON.parse(fs.readFileSync(filepath, "utf8"));
}



