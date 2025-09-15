const puppeteer = require("puppeteer");
const info = require("./model/info.js");
const urlmd = require("url");
const dns = require('dns');
const {analyze, prettyPrint}= require('./techStack.js')


let count = 1;
// const API_KEY = 'ab519f29-14af-4342-a3e4-326c227eeff7';
const url = "https://tivazo.com/";
const visited = new Set();
const socialSites = [
  "instagram",
  "tiktok",
  "linkedin",
  "facebook",
  "x.com",
  "youtube",
  "pinterest",
  "reddit",
  "snapchat", 
  "tumblr"
]

const defaultPorts = {
  "http": 80,
  "https": 443,
  "ftp": 21,
  "ssh": 22,
  "smtp": 25,
  "imap": 143,
  "pop3": 110,
  "mysql": 3306,
  "mongodb": 27017
};

const start = async (page, url, doc) => {
  if (visited.has(url)) return;
  visited.add(url);

  // console.log(`Crawling the website : ${url}`);
  try {
    if (url.includes("mailto:")) {
      const email = url.split(":")[1];
      if (!doc.email.includes(email)) {
        console.log(`Email found: ${email}`);
        doc.email.push(email);
      }
      await doc.save();
      return;
    } else if (url.includes("tel:")) {
      const phone = url.split(":")[1];
      if (!doc.contact.includes(phone)) {
        console.log(`Phone found: ${phone}`);
        doc.contact.push(phone);
      }
      await doc.save();
      return;
    }
    await page.goto(url, {waitUntil: "domcontentloaded", timeout: 10000});
  } catch (error) {
    console.log("Error: ", error.message);
    return;
  }

  if(count === 1) {
    const links = await page.$$eval("a", (elements) =>
      elements.map((el) => el.href)
    );
    count++;
    for (const link of links) { 
      if (
        link &&
        !visited.has(link) &&
        link.includes("contact") ||
        link.includes("about") ||
        link.includes("team")|| 
        link.includes("press") ||
        socialSites.some((site) => link.includes(site))||
        !link.includes(new URL(url).hostname)
      ) {
        await start(page, link, doc);
      }
    }
    return 1;
  }

  await check(page, url, doc);
};



const check = async (page, url, doc) => {
  if (socialSites.some((site) => url.includes(site))) {
    console.log("Social link found, skipping further checks.");
    if (!doc.socialLink.includes(url)) {
      doc.socialLink.push(url);
      await doc.save();
    }
    return;
  }


  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
  } catch (error) {
    console.log("Error: ", error.message);
    return;
  }

  const links = await page.$$eval("a", (elements) =>
    elements.map((el) => el.href)
  );

  for (const link of links) {
    if (link.includes("mailto:")) {
      const email = link.split(":")[1];
      if (!doc.email.includes(email)) {
        doc.email.push(email);
        console.log(`Email added: ${email}`);
      }
    } else if (link.includes("tel:")) {
      const contact = link.split(":")[1];
      if (!doc.contact.includes(contact)) {
        doc.contact.push(contact);
        console.log(`Contact added: ${contact}`);
      }
    } else if(socialSites.some((site) => url.includes(site))) {
      if (!doc.socialLink.includes(link)) {
        doc.socialLink.push(link);
        console.log(`Social Link added: ${link}`);
      }
    }
  }
  try {
    // await page.waitForSelector('body', {timeStamp: 10000})
    const pageText = await page.evaluate(() => document.body.innerText);
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const foundEmails = pageText.match(emailRegex) || [];
  if(foundEmails){
    for( const email of foundEmails){
      if(!doc.email.includes(email)){
        doc.email.push(email);
        console.log(`Email added from text: ${email}`);
      }
    }
  }
  const phoneRegex =/\+?\d{1,4}?[-.\s]?\(?\d{2,4}?\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;

  const foundPhones = pageText.match(phoneRegex) || [];
  if(foundPhones){
    for(const contact of foundPhones){
      if(contact.length >= 8 && !contact.includes(".")){
         if(!doc.contact.includes(contact)){
        doc.contact.push(contact);
        console.log(`Contact added from text: ${contact}`)
      }}}}
    
  } catch (error) {
    console.log("Error : ", error.message)
    
  }
  await doc.save();
};



function IP_Port_Protocol (url) {
  try {
    dns.lookup(new URL(url).hostname, (err, address, family) => {
      if(err) {
        console.log("Error : ", err.message);
      }
      console.log(`IP address of ${new URL(url).hostname} is ${address}, Family : IPv${family}`)
      const protocol = urlmd.parse(url).protocol;
      const cleanProtocal = protocol.replace(':','');
      const port = defaultPorts[cleanProtocal];
      console.log(`Port: ${port} and Protocol: ${cleanProtocal}`);
      
    })
  } catch (error) {
    
  }
}

(async () => {
  const domain = new URL(url).hostname;
  // const tech_Stack = await detectTech(domain);
   IP_Port_Protocol(url);
   try {
    console.log("Analysing tech stack: ")
    const res = await analyze(domain);
    console.log(`\nTech stack for ${res.target}:`);
    prettyPrint(res);
  } catch (e) {
    console.error("Error:", e.message);
    process.exit(2);
  }
  let doc = await info.findOne({ domain });
  if (!doc) {
    doc = new info({
      domain,
      email: [],
      contact: [],
      socialLink: [],
      techStack: [],
    });
  }
  const browser = await puppeteer.launch();
  console.log("Crawling started...")
  const page = await browser.newPage();
  const num = await start(page, url, doc);
  if(num == 1){
    console.log("Crawling completed...")
    await page.close();
    process.exit(2);
  }
  
})();