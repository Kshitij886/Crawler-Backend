const net = require("net");
const axios = require("axios");

const ports = [
  80, 443, 2052, 2053, 2082, 2083, 2086, 2087, 2095, 2096, 8080, 8443, 8880, 20,
  21, 22, 23, 25, 53, 110, 143, 465, 587, 993, 995, 135, 139, 445, 3389, 67, 68,
  123, 161, 162, 389, 636, 3306, 5432, 1723, 5900, 2049, 111, 500, 1433, 1521,
  3128, 3268, 5060, 5631, 6666, 8000, 8888, 9100, 9999, 10000, 27017, 6379,
  11211, 25565,
];

async function checkPort(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let banner = "";
    let service = "";
    let resolved = false;
    const timeoutMs = 3000;

    function safeResolve(result) {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve(result);
      }
    }

    socket.setTimeout(timeoutMs);

    socket.on("connect", async () => {
      const httpPorts = [
        80, 443, 2052, 2053, 2082, 2083, 2086, 2087, 2095, 2096, 8080, 8443,
        8880, 8000, 8888,
      ];
      if (httpPorts.includes(port)) {
        try {
          const protocol = [443, 2053, 2083, 2087, 2096, 8443].includes(port)
            ? "https"
            : "http";
          const res = await axios.get(`${protocol}://${host}:${port}`, {
            timeout: timeoutMs,
          });
          banner = res.headers["server"] || JSON.stringify(res.headers);
          service = detectServiceFromHeaders(res.headers);
          safeResolve({ port, state: "open", service, version: banner });
        } catch (e) {
          banner = `-`;
          service = [443, 2053, 2083, 2087, 2096, 8443].includes(port)
            ? "ssl/http"
            : "http";
          safeResolve({ port, state: "open", service, version: banner });
        }
      } else {
        if (port === 22) socket.write("SSH-2.0-Client\r\n");
        else if (port === 25 || port === 465 || port === 587)
          socket.write("HELO localhost\r\n");
        else if (port === 21) socket.write("HELP\r\n");

        socket.once("data", (data) => {
          banner = data.toString().trim().substring(0, 200);
          service = detectServiceFromBanner(banner);
          safeResolve({ port, state: "open", service, version: banner });
        });

        setTimeout(() => {
          if (!resolved) {
            service = detectServiceFromPort(port);
            safeResolve({
              port,
              state: "open",
              service,
              version: "No banner received",
            });
          }
        }, 1500);
      }
    });

    socket.on("error", (err) => {
      let banner = `Error: ${err.code || err.message}`;
      let state = "closed";
      if (err.code === "ECONNREFUSED") {
        banner = "Connection refused (port closed)";
      } else if (err.code === "EHOSTUNREACH") {
        banner = "Host unreachable";
        state = "unreachable";
      } else {
        banner = "Connection timed out (no response)";
        state = "filtered";
      }
      safeResolve({ port, state, service: "unknown", version: banner });
    });

    socket.on("timeout", () => {
      safeResolve({
        port,
        state: "filtered",
        service: "unknown",
        version: "Connection timed out (no response)",
      });
    });

    socket.connect(port, host);
  });
}

function detectServiceFromHeaders(headers) {
  if (headers["server"]) {
    const server = headers["server"].toLowerCase();
    if (server.includes("cloudflare")) return "http";
    if (server.includes("nginx")) return "ssl/http";
    if (server.includes("apache")) return "http";
    if (server.includes("express")) return "http";
    if (server.includes("iis")) return "http";
    return "http";
  }
  return "http";
}

function detectServiceFromBanner(banner) {
  banner = banner.toLowerCase();
  if (banner.startsWith("ssh-")) return "ssh";
  if (banner.includes("smtp")) return "smtp";
  if (banner.includes("ftp")) return "ftp";
  if (banner.includes("mysql")) return "mysql";
  if (banner.includes("postgresql")) return "postgresql";
  if (banner.includes("mongodb")) return "mongodb";
  if (banner.includes("redis")) return "redis";
  return "unknown";
}

function detectServiceFromPort(port) {
  const portServices = {
    20: "ftp-data",
    21: "ftp",
    22: "ssh",
    23: "telnet",
    25: "smtp",
    53: "dns",
    80: "http",
    110: "pop3",
    143: "imap",
    443: "ssl/http",
    465: "smtps",
    587: "smtp-submission",
    993: "imaps",
    995: "pop3s",
    135: "msrpc",
    139: "netbios-ssn",
    445: "microsoft-ds",
    3389: "rdp",
    67: "dhcp",
    68: "dhcp",
    123: "ntp",
    161: "snmp",
    162: "snmptrap",
    389: "ldap",
    636: "ldaps",
    3306: "mysql",
    5432: "postgresql",
    8080: "http",
    8443: "ssl/http",
    1723: "pptp",
    5900: "vnc",
    2049: "nfs",
    111: "rpcbind",
    500: "isakmp",
    1433: "mssql",
    1521: "oracle",
    3128: "squid",
    3268: "ad-global-catalog",
    5060: "sip",
    5631: "pcanywhere",
    6666: "irc",
    8000: "http",
    8888: "http",
    9100: "jetdirect",
    9999: "custom",
    10000: "webmin",
    27017: "mongodb",
    6379: "redis",
    11211: "memcached",
    25565: "minecraft",
    2052: "http",
    2053: "ssl/http",
    2082: "http",
    2083: "ssl/http",
    2086: "http",
    2087: "ssl/http",
    2095: "http",
    2096: "ssl/http",
    8880: "http",
  };
  return portServices[port] || "unknown";
}

(async () => {
  const host = "tivazo.com";
  const batchSize = 10;
  const results = [];

  for (let i = 0; i < ports.length; i += batchSize) {
    const batch = ports.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((p) => checkPort(host, p))
    );
    results.push(...batchResults);
    batchResults.forEach((result) => {
      if (result.state == "open") {
        console.log(
          `${host}:${result.port} → state: ${result.state}, service: ${result.service}, version: ${result.version}`
        );
      }
    });
  }
   console.log("___________________________________________________________________________")
  for (const result of results ){
   
    if (result.state === "open") {
      console.log(
        `${host}:${result.port} => state: ${result.state}, service: ${result.service}, version: ${result.version}`
      );
    } 
  }
})();
