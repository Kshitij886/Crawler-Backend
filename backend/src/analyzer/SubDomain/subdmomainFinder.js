import axios from "axios";
import { promises as dns } from "dns";
import { readFileSync } from "fs";
import { join } from "path";
import path from "path";
import { fileURLToPath } from "url";
import builtwith from "../techStack/techstackFinder.js";
import { JSDOM } from "jsdom";
import subdomain from "../../controllers/subdomain.controller.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbpath = join(__dirname, "ip-database.json");
const db = JSON.parse(readFileSync(dbpath, "utf8"));

const subDomains = [];
const API_KEY = "at_qZ1GguT1Yld73xxZWWbpe2Ex4TNpz";

export default async function subDomainFinder(domain) {
  try {
    const { data } = await axios.get(
      `https://subdomains.whoisxmlapi.com/api/v1?apiKey=${API_KEY}&domainName=${domain}`
    );
    for (const entry of data.result.records) {
      const res = await IPFinder(entry.domain);
      subDomains.push(res);
    }
    return subDomains
  } catch (err) {
    
  }
};

const searchDB = (ip) => {
  const ipInt = ipToInt(ip);
  try {
    for (const entry of db) {
      const startInt = ipToInt(entry.start);
      const endInt = ipToInt(entry.end);
      if (ipInt >= startInt && ipInt <= endInt) {
        return {
          ip,
          NetName: entry.netname,
          Country: entry.country
        };
      }
    }
  } catch (error) {
    // ignore and fallback
  }
  return { ip, NetName: "-", Country: "-" };
};


function ipToInt(ip) {
  return (
    ip.split(".").reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0
  );
}

const IPFinder = async (subDomain) => {
  try {
    // 1. Resolve IP
    const { address } = await dns.lookup(subDomain);

    if (!address) {
      return {
        subDomain,
        ip: "-",
        NetName: "-",
        Country: "-",
        title: "-",
        Technologies: "-"
      };
    }

    // 2. Lookup IP info from DB
    const { ip, NetName, Country } = searchDB(address);

    // 3. Get title
    const { title } = await titleFinder(subDomain);

    // 4. Detect technologies (try https first, fallback to http)
    let techsResult;
    try {
      techsResult = await builtwith(`https://${subDomain}`);
    } catch {
      techsResult = await builtwith(`http://${subDomain}`);
    }

    const techs = techsResult.techs || {};

    // 5. Build result
    const result = {
      subDomain,
      ip,
      NetName,
      Country,
      title,
      Technologies: techs,
    
    };

    return result;
  } catch (error) {
    console.error("Error in IPFinder:", error.message);
    return {
      subDomain,
      ip: "-",
      NetName: "-",
      Country: "-",
      title: "-",
      Technologies: "-",
      WebPlatform: "-"
    };
  }
};

const titleFinder = async (subDomain) => {
  try {
    const { data } = await axios.get(`https://${subDomain}`);
    const dom = new JSDOM(data, {pretendToBeVisual : false});
    return{title: dom.window.document.title};
    
  } catch (error) {
    try {
      const {data} = await axios.get(`http://${subDomain}`)
      const dom = new JSDOM(data);
      return {title : dom.window.document.title};
    } catch (error) {
      console.log("Error" , error.message)
      
    }
  }

};
