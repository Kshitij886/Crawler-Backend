import  IP_Port_Protocol  from  "../analyzer/Domain/ipFinder.js";
import  FindPort from  "../analyzer/Domain/portFinder.js";
import  builtwith  from  "../analyzer/techStack/techstackFinder.js";


export default async  function domain(req, res) {
    const url = req.body.domain;
    if (!url) {
        return res.status(404).json({ message : "Url missing"})
    }
    const { hostname,ip, protocol } = await IP_Port_Protocol(url);
    const {techs, os} = await  builtwith(url);
    const ports = await FindPort(hostname);
    const result = {
        url : url,
        hostname : hostname,
        ip : ip,
        protocol : protocol,
        tech : techs,
        os : os,
        ports : ports
    }
    res.status(200).json({
        results : result
    })

} 

