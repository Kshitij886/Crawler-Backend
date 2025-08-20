const puppeteer = require("puppeteer");
const axios = require("axios");


  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function normalizeUrl(input) {
    let u = input.trim();
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    try {
      const url = new URL(u);
      url.protocol = "https:";
      return url.toString().replace(/\/$/, "");
    } catch {
      throw new Error(`Invalid domain/URL: ${input}`);
    }
  }

  function uniq(arr) {
    const seen = new Set();

    return arr.filter((o) => {
      const key = `${o.name}|${o.area}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function addFinding(list, name, area, confidence, evidence) {
    list.push({ name, area, confidence, evidence });
  }

  function detectFromHeaders(headers, findings) {
    const h = {};
    for (const [k, v] of Object.entries(headers || {})) h[k.toLowerCase()] = v;

    if (h["server"] && /cloudflare/i.test(h["server"])) {
      addFinding(
        findings,
        "Cloudflare (CDN/Proxy)",
        "hosting",
        "high",
        "server: cloudflare"
      );
    }
    if (h["cd-ray"] || h["cd-cache-status"]) {
      addFinding(
        findings,
        "CloudFlare (CDN/proxy)",
        "hosting",
        "high",
        "cf-* headers present"
      );
    }
    if (h["x-vercel-id"] || /vercel/i.test(h["server"] || "")) {
      addFinding(
        findings,
        "Vercel",
        "hosting",
        "high",
        h["x-vercel-id"] ? "x-vercel-id present" : "server: vercel"
      );
    }
    if (h["x-nf-request-id"] || /netlify/i.test(h["server"] || "")) {
      addFinding(
        findings,
        "Netlify",
        "hosting",
        "medium",
        h["x-nf-request-id"] ? "x-nf-request-id" : "server header"
      );
    }
    if (h["via"] && /cloudfront/i.test(h["via"])) {
      addFinding(
        findings,
        "AWS CloudFront",
        "hosting",
        "medium",
        "via: cloudfront"
      );
    }
    if (h["x-github-request-id"] || /GitHub.com/i.test(h["server"] || "")) {
      addFinding(
        findings,
        "GitHub Pages",
        "hosting",
        "medium",
        "GitHub headers"
      );
    }
    if (h["x-served-by"] && /fastly/i.test(h["x-served-by"])) {
      addFinding(
        findings,
        "Fastly",
        "hosting",
        "medium",
        "x-served-by: fastly"
      );
    }
    // for backend
    if (h["x-powered-by"]) {
      addFinding(
        findings,
        h["x-powered-by"],
        "backend",
        "medium",
        "x-powered-by"
      );
      if (/express/i.test(h["x-powered-by"]))
        addFinding(
          findings,
          "Express.js (Node)",
          "backend",
          "high",
          "x-powered-by: Express"
        );
      if (/php/i.test(h["x-powered-by"]))
        addFinding(findings, "PHP", "backend", "high", "x-powered-by: PHP");
      if (/next\.js/i.test(h["x-powered-by"]))
        addFinding(
          findings,
          "Next.js",
          "frontend",
          "high",
          "x-powered-by: Next.js"
        );
      if (/asp\.net/i.test(h["x-powered-by"]))
        addFinding(
          findings,
          ".NET (ASP.NET)",
          "backend",
          "high",
          "x-powered-by: ASP.NET"
        );
    }

    if (h["x-aspnet-version"] || h["x-aspnetmvc-version"]) {
      addFinding(
        findings,
        ".NET (ASP.NET)",
        "backend",
        "high",
        "ASP.NET headers"
      );
    }
    if (h["x-runtime"]) {
      addFinding(
        findings,
        "Ruby on Rails",
        "backend",
        "medium",
        "x-runtime present"
      );
    }

    // for Cookies
    const cookies = [].concat(h["set-cookie"] || []);
    for (const c of cookies) {
      if (/PHPSESSID/i.test(c))
        addFinding(findings, "PHP", "backend", "high", "cookie: PHPSESSID");
      if (/laravel_session/i.test(c))
        addFinding(
          findings,
          "Laravel (PHP)",
          "backend",
          "high",
          "cookie: laravel_session"
        );
      if (/JSESSIONID/i.test(c))
        addFinding(
          findings,
          "Java (JSP/Spring)",
          "backend",
          "medium",
          "cookie: JSESSIONID"
        );
      if (/csrftoken/i.test(c))
        addFinding(
          findings,
          "Django (Python)",
          "backend",
          "medium",
          "cookie: csrftoken"
        );
      if (/express\.sid/i.test(c))
        addFinding(
          findings,
          "Express.js (Node)",
          "backend",
          "medium",
          "cookie: express.sid"
        );
      if (/_cfduid|__cf_bm|cf_ob_info|cf_use_ob/i.test(c))
        addFinding(
          findings,
          "Cloudflare",
          "hosting",
          "high",
          "Cloudflare cookie"
        );
    }
    if (h["server"])
      addFinding(
        findings,
        `Server: ${h["server"]}`,
        "hosting",
        "low",
        "server header"
      );
  }

  function detectFromHtmlAndScripts(html, scriptSrcs, findings) {
    const lower = html.toLowerCase();

    // CMS
    if (lower.includes("wp-content") || lower.includes("wp-includes")) {
      addFinding(
        findings,
        "WordPress (CMS)",
        "frontend",
        "high",
        "wp-content/wp-includes in HTML"
      );
      addFinding(findings, "PHP", "backend", "medium", "WordPress implies PHP");
    }
    if (lower.includes("drupal-settings-json")) {
      addFinding(
        findings,
        "Drupal (CMS)",
        "frontend",
        "medium",
        "drupal-settings-json"
      );
      addFinding(findings, "PHP", "backend", "medium", "Drupal implies PHP");
    }
    if (lower.includes("shopify") || /cdn\.shopify\.com/.test(lower)) {
      addFinding(findings, "Shopify", "frontend", "medium", "Shopify markers");
    }

    // Framework markers
    if (
      /id="__next"|window\.__NEXT_DATA__|\/_next\//i.test(html) ||
      scriptSrcs.some((s) => /\/_next\//i.test(s))
    ) {
      addFinding(
        findings,
        "Next.js (React)",
        "frontend",
        "high",
        "Next.js build markers"
      );
    }

    if (scriptSrcs.some((s) => /\/static\/js\/main\.[a-f0-9]+\.js/i.test(s))) {
      addFinding(
        findings,
        "React (CRA build)",
        "frontend",
        "medium",
        "CRA static/js"
      );
    }

    if (/id="___gatsby"|window\.___gatsby/i.test(html)) {
      addFinding(
        findings,
        "Gatsby (React)",
        "frontend",
        "high",
        "gatsby markers"
      );
    }
    if (/__remixManifest|__remixContext/i.test(html)) {
      addFinding(
        findings,
        "Remix (React)",
        "frontend",
        "medium",
        "remix markers"
      );
    }
    if (
      /vue\.js|vue-runtime|__VUE__|data-v-app/i.test(html) ||
      scriptSrcs.some((s) => /vue(\.runtime)?(\.global)?(\.prod)?\.js/i.test(s))
    ) {
      addFinding(findings, "Vue.js", "frontend", "medium", "vue markers");
    }
    if (
      /__NUXT__|\/_nuxt\//i.test(html) ||
      scriptSrcs.some((s) => /\/_nuxt\//i.test(s))
    ) {
      addFinding(findings, "Nuxt (Vue)", "frontend", "high", "nuxt markers");
    }
    if (/ng-version=|angular(\.min)?\.js/i.test(html)) {
      addFinding(findings, "Angular", "frontend", "high", "angular markers");
    }
    if (
      /data-sveltekit|\/_app\/immutable\//i.test(html) ||
      scriptSrcs.some((s) => /\/_app\/immutable\//i.test(s))
    ) {
      addFinding(
        findings,
        "SvelteKit",
        "frontend",
        "medium",
        "sveltekit markers"
      );
    }

    // CSS frameworks
    if (
      /tailwindcss|class="[^"]*\b(prose|container mx-|grid grid-|flex gap-)/i.test(
        html
      )
    ) {
      addFinding(
        findings,
        "Tailwind CSS",
        "frontend",
        "low",
        "tailwind utility classes"
      );
    }
    if (/bootstrap(\.min)?\.css|data-bs-/i.test(html)) {
      addFinding(
        findings,
        "Bootstrap",
        "frontend",
        "medium",
        "bootstrap markers"
      );
    }
  }

  async function dnsHints(hostname, findings) {
    const dns = require("dns").promises;
    try {
      const addrs = await dns.resolve4(hostname);
      for (const ip of addrs) {
        if (/^(104\.|172\.|188\.)/.test(ip)) {
          addFinding(
            findings,
            "Cloudflare (CDN/Proxy)",
            "hosting",
            "high",
            `A record -> ${ip}`
          );
        }
      }
    } catch {}
  }

  async function probeWellKnown(baseUrl, findings) {
    try {
      const wp = await axios.get(baseUrl + "/wp-json", {
        timeout: 6000,
        validateStatus: () => true,
      });
      if (wp.status === 200 && typeof wp.data === "object") {
        addFinding(
          findings,
          "WordPress (CMS)",
          "frontend",
          "high",
          "/wp-json OK"
        );
        addFinding(
          findings,
          "PHP",
          "backend",
          "medium",
          "WordPress implies PHP"
        );
      }
    } catch {}

    try {
      const r = await axios.get(baseUrl + "/robots.txt", {
        timeout: 5000,
        validateStatus: () => true,
      });
      if (r.status === 200 && /next\.js|gatsby|nuxt|sveltekit/i.test(r.data)) {
        addFinding(
          findings,
          "Framework (from robots.txt)",
          "frontend",
          "low",
          "robots.txt mentions framework"
        );
      }
    } catch {}
  }

  async function analyze(domainOrUrl) {
    const results = { target: domainOrUrl, findings: [], notes: [] };

    let baseUrl = normalizeUrl(domainOrUrl);
    const hostname = new URL(baseUrl).hostname;

    let ax = null;
    try {
      ax = await axios.get(baseUrl, {
        timeout: 12000,
        maxRedirects: 5,
        validateStatus: () => true,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
    } catch (e) {
      results.notes.push(`axios https failed: ${e.message} — retrying http`);

      try {
        baseUrl = baseUrl.replace(/^https:/, "http:");
        ax = await axios.get(baseUrl, {
          timeout: 12000,
          maxRedirects: 5,
          validateStatus: () => true,
        });
      } catch (e2) {
        results.notes.push(`axios http failed: ${e2.message}`);
      }
    }

    if (ax && ax.headers) detectFromHeaders(ax.headers, results.findings);
    let initialHtml = ax && ax.data ? String(ax.data) : "";

    await dnsHints(hostname, results.findings);

    let html = initialHtml;
    let scriptSrcs = [];
    try {
      const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36"
      );
      await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

      await page.goto(baseUrl, { waitUntil: "networkidle2", timeout: 30000 });
      await sleep(300); // tiny settle time

      html = await page.content();
      scriptSrcs = await page.$$eval("script[src]", (els) =>
        els.map((e) => e.src)
      );

      const winMarkers = await page.evaluate(() => ({
        hasNextData: !!window.__NEXT_DATA__,
        hasNuxt: !!window.__NUXT__,
        hasRemix: !!window.__remixManifest || !!window.__remixContext,
        hasGatsby: !!window.___gatsby,
        angularVersion:
          document.documentElement.getAttribute("ng-version") || null,
      }));

      if (winMarkers.hasNextData)
        addFinding(
          results.findings,
          "Next.js (React)",
          "frontend",
          "high",
          "window.__NEXT_DATA__"
        );
      if (winMarkers.hasNuxt)
        addFinding(
          results.findings,
          "Nuxt (Vue)",
          "frontend",
          "high",
          "window.__NUXT__"
        );
      if (winMarkers.hasRemix)
        addFinding(
          results.findings,
          "Remix (React)",
          "frontend",
          "medium",
          "window.__remix*"
        );
      if (winMarkers.hasGatsby)
        addFinding(
          results.findings,
          "Gatsby (React)",
          "frontend",
          "high",
          "window.___gatsby"
        );
      if (winMarkers.angularVersion)
        addFinding(
          results.findings,
          `Angular ${winMarkers.angularVersion}`,
          "frontend",
          "high",
          "ng-version"
        );

      await browser.close();
    } catch (e) {
      results.notes.push(`Puppeteer pass failed: ${e.message}`);
    }

    detectFromHtmlAndScripts(html || initialHtml, scriptSrcs, results.findings);

    try {
      const origin = new URL(baseUrl).origin;
      await probeWellKnown(origin, results.findings);
    } catch {}

    const names = results.findings.map((f) => f.name);
    const hasNext = names.some((n) => /Next\.js/i.test(n));
    const hasVercel = names.some((n) => /Vercel/i.test(n));
    const hasCloudflarePages = names.some((n) => /Cloudflare Pages/i.test(n));
    const hasWordPress = names.some((n) => /WordPress/i.test(n));

    if (
      hasNext &&
      (hasVercel || names.some((n) => /x-vercel-id|Vercel/i.test(n)))
    ) {
      addFinding(
        results.findings,
        "Node.js runtime (Vercel/Edge)",
        "backend",
        "medium",
        "Next.js + Vercel"
      );
    } else if (hasNext) {
      addFinding(
        results.findings,
        "Node.js (likely)",
        "backend",
        "low",
        "Next.js implies Node/Edge"
      );
    }
    if (hasCloudflarePages) {
      addFinding(
        results.findings,
        "Cloudflare Workers/Pages (JS/Edge)",
        "backend",
        "low",
        "Cloudflare Pages"
      );
    }
    if (hasWordPress) {
      addFinding(
        results.findings,
        "MySQL (likely)",
        "database",
        "low",
        "WordPress typical stack"
      );
    }

    results.findings = uniq(results.findings).sort((a, b) => {
      const c = { high: 0, medium: 1, low: 2 };
      if (a.area === b.area) return c[a.confidence] - c[b.confidence];
      const order = ["frontend", "backend", "database", "hosting"];
      return order.indexOf(a.area) - order.indexOf(b.area);
    });

    return results;
  }

  function prettyPrint(res) {
    const groups = ["frontend", "backend", "database", "hosting"];
    for (const g of groups) {
      const items = res.findings.filter((f) => f.area === g);
      if (!items.length) continue;
      const title = {
        frontend: "Frontend",
        backend: " Backend",
        database: " Database",
        hosting: " CDN/Hosting",
      }[g];
      console.log("\n" + title + ":");
      for (const it of items) {
        console.log(` - ${it.name} `);
      }
    }
    if (res.notes?.length) {
      console.log("\nNotes:");
      res.notes.forEach((n) => console.log(" - " + n));
    }
  }


module.exports = {analyze, prettyPrint};