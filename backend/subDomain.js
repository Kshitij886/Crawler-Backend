const axios = require("axios");
const dns = require("dns").promises;
const fs = require("fs");
const path = require("path");
const puppeteer = require('puppeteer')
const cheerio = require('cheerio')

const dbpath = path.join(__dirname, "ip-database.json");

const db = JSON.parse(fs.readFileSync(dbpath, "utf8"));
const subDomains = new Set();
const domain = "tivazo.com";

const subDomainFinder = async () => {
  const url = `https://crt.sh/?q=%25.${domain}&output=json`;
  const { data } = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
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
  console.log(`Found ${subDomains.size} subdomains:`, [...subDomains]);
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
  const toDelete = [];
  for (const subDomain of subDomains) {
    try {
      const { address } = await dns.lookup(subDomain);
      console.log("\nfetching data ", subDomain);
      searchDB(subDomain, address);
    } catch (error) {
      toDelete.push(subDomain);
      console.log("\nsub domain to be deleted", subDomain);
    }
  }
  for (const subDomain of toDelete) {
    subDomains.delete(subDomain);
  }
  console.log(`Remaining subdomains: ${[...subDomains]}`);
};

const loadHtml = async (link) => {
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  try {
   
    await page.goto(`https://${link}`,{ waitUntil: "networkidle2", timeout: 10000 })
    const html = await page.content();
    const $ = cheerio.load(html);
    console.log(`HTML length for ${link}: ${html.length}`);
    console.log(`Title tag for ${link}: ${$("title").prop("outerHTML") || "No title tag"}`);
    await browser.close();
    return $;
  } catch (error) {
    try {
      await page.goto(`http://${link}`, {waitUntil: 'networkidle2', timeout: 10000})
      const html = await page.content;
      const $ = cheerio.load(html);
      console.log(`HTML length for ${link}: ${html.length}`);
      console.log(`Title tag for ${link}: ${$("title").prop("outerHTML") || "No title tag"}`); 
      browser.close();
      return $;
    } catch (error) {
      console.log(`Error loading ${link}: ${error.message}`);
      return null;
    }
  }
};

const titleFinder = async () => {
  for (const subDomain of subDomains) {
    const $ = await loadHtml(subDomain);
    if ($) {
      const titleTxt = $("title").text();
      console.log(`Title for ${subDomain}: ${titleTxt || "No title found"}`);
    } else {
      console.log(`Failed to load HTML for ${subDomain}`);
    }
  }
};

(async () => {
  await subDomainFinder();
  await IPFinder();
  await titleFinder();
})();