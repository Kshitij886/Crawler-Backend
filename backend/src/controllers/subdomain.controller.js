import subdmomainFinder from "../analyzer/SubDomain/subdmomainFinder.js"

const subdomain = async (req, res) => {
    const domain = req.body.domain;
    if (!domain) {
        res.status(404).json({message : "Domain required"})
    }
    const result = await subdmomainFinder(domain)
    res.status(200).json({
        result
    })
}

export default subdomain