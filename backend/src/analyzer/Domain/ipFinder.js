import urlmd from "url";
import dns from "dns";

export default function IP_Port_Protocol(url) {
  return new Promise((resolve) => {
    try {
      const hostname = new URL(url).hostname;

      dns.lookup(hostname, (err, address, family) => {
        if (err) {
          const result = {
            hostname,
            ip: "-",
            protocol: "-",
          };
          resolve(result); // resolve the promise
          return;
        }

        const protocol = urlmd.parse(url).protocol || "-";
        const cleanProtocol = protocol.replace(":", "");

        const result = {
          hostname,
          ip: address,
          protocol: cleanProtocol,
        };
        resolve(result); // resolve the promise
      });
    } catch (err) {
      const result = {
        hostname: new URL(url).hostname,
        ip: "-",
        protocol: "-",
      };
      resolve(result); // resolve on exception
    }
  });
}
