const axios = require('axios');

const API_KEY =' APIKEY';


const subdomainAPI = async (domain) => {

    try {
        const response = await axios.get(`https://subdomains.whoisxmlapi.com/api/v1?apiKey=${API_KEY}&domainName=${domain}`)
        const subdomains = response.data;
        return subdomains;
    } catch(err){
        console.log('Error: ',err);
    }
}

(async () => {
    const domain = "tivazo.com"
    const result = await subdomainAPI(domain);
    console.log(result.result.records)
})()
