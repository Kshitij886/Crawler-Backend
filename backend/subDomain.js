const axios = require("axios");
const dns = require("dns");
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const dbpath = path.join(__dirname, "ip-database.json");

const db = JSON.parse(fs.readFileSync(dbpath, "utf8"));
const subDomains = new Set();
// const SubDetails = new JSON
const domain = "tivazo.com";

const subDomainFinder = async () => {
  const url = `https://crt.sh/?q=%25.${domain}&output=json`;
  const { data } = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  //entry.name_value- foreach
  
  data.forEach((entry) => {
    const regrexE = /^[a-zA-Z0-9][a-zA-Z0-9\-_\.]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (
      !entry.name_value.includes(domain) ||
      subDomains.has(entry.name_value) ||
      !entry.name_value.match(regrexE)
    )
      return;
    subDomains.add(entry.name_value);
  });
};
const searchDB = (subDomain, ip) => {
  const ipInt = ipToInt(ip);
  for (const entry of db) {
    const startInt = ipToInt(entry.start);
    const endInt = ipToInt(entry.end);

    if (ipInt >= startInt && ipInt <= endInt) {
      console.log(
        `Sub-Domain: ${subDomain}\n ip: ${ip}\n whois: ${entry.netname} \ncountry: ${entry.country}`
      );
    }
  }
};
function ipToInt(ip) {
  return (
    ip.split(".").reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0
  );
}

const IPFinder = async () => {
  for (const subDomain of subDomains) {
    try {
      dns.lookup(subDomain, )
      console.log("\nfetching data ", subDomain);
       searchDB(subDomain, address);
    } catch (error) {
      subDomains.delete(subDomain);
      console.log("\nsub domain is deleted", subDomain);
    }
  }
};

const loadHtml = async (link) => {
  try {
    const res = await axios.get(`https://${link}`, [{ timeout: 5000 }]);
    const html = res.data;
    const $ = cheerio.load(html);
    return $;
  } catch (error) {
    try {
      const res = await axios.get(`http://${link}`, [{ timeout: 5000 }]);
      const html = res.data;
      const $ = cheerio.load(html);
      return $;
    } catch (error) {
      console.log("Error :", error.message)
    }
  }
};
const titleFinder = async () => {
  for (const subDomain of subDomains) {
    const $ = await loadHtml(subDomain);
    if ($) {
      const titleTxt = $("title").text() ;
      console.log(`Title: ${titleTxt ? titleTxt: "No title found"}`);
    }
  }
};

(async () => {
  await subDomainFinder();
  await IPFinder();
  await titleFinder();
})();
