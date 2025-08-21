const { execFile } = require("node:child_process");

const nmapPath = "C:\\Program Files (x86)\\Nmap\\nmap.exe";
const target = "getdarkscout.com";
let details = [];

function port_Finder(details) {
  execFile(
    nmapPath,
    [...details, target],
    (err, stdout, stderr) => {
      if (err) {
        console.error("Exec error:", err);
        return;
      }
      console.log("=== RAW NMAP OUTPUT ===");
      console.log(stdout);
      if (stderr) console.error("STDERR:", stderr);
    }
  );
}


const info = process.argv[2];
switch (info) {
  case "medium":
    details = ["-p","1-10000","-sV","-T4"];
    port_Finder(details);
    break;
  case "light":
    details = ["-p", "1-1000"];
    port_Finder(details);
    break;
  case "deep" :
    details = ["-p-", "-sV",]
    port_Finder(details);
    break;
  default:
    console.log(`
                 Light Scan : node portFinder.js light
                 Medium Scan : node portFinder.js medium
                 Deep Scan : node portFinder.js deep
                `);
    break;
}
