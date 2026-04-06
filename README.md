# Crawler Backend

A Node.js backend API for domain and subdomain analysis, providing information about IP addresses, open ports, technology stacks, operating systems, and subdomains.

## Features

- **Domain Analysis**: Retrieve IP address, protocol, technology stack, OS, and open ports for a given domain.
- **Subdomain Discovery**: Find subdomains associated with a domain.
- **RESTful API**: Simple POST endpoints for analysis requests.
- **Built with Express.js**: Lightweight and scalable server framework.

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Crawler-Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file if needed for environment variables (e.g., database connections if using MongoDB).

4. Start the server:
   ```bash
   npm start
   ```

The server will run on `http://localhost:3000`.

## Usage

The API provides two main endpoints:

### Domain Analysis

**Endpoint:** `POST /api/domain`

**Request Body:**
```json
{
  "domain": "example.com"
}
```

**Response:**
```json
{
  "results": {
    "url": "example.com",
    "hostname": "example.com",
    "ip": "93.184.216.34",
    "protocol": "https",
    "tech": ["Nginx", "jQuery"],
    "os": "Linux",
    "ports": [80, 443]
  }
}
```

### Subdomain Discovery

**Endpoint:** `POST /api/subdomain`

**Request Body:**
```json
{
  "domain": "example.com"
}
```

**Response:**
```json
{
  "result": [
    "www.example.com",
    "api.example.com",
    "mail.example.com"
  ]
}
```

## Project Structure

```
Crawler-Backend/
├── index.js                 # Main entry point
├── package.json             # Project dependencies and scripts
└── src/
    ├── analyzer/
    │   ├── Domain/
    │   │   ├── ipFinder.js      # IP and protocol finder
    │   │   └── portFinder.js    # Port scanner
    │   ├── SubDomain/
    │   │   ├── ip-database.json # IP database
    │   │   └── subdmomainFinder.js # Subdomain finder
    │   └── techStack/
    │       ├── apps.json        # Tech stack database
    │       └── techstackFinder.js # Tech stack analyzer
    ├── controllers/
    │   ├── domain.controller.js    # Domain analysis controller
    │   └── subdomain.controller.js # Subdomain controller
    └── routes/
        └── findings.route.js       # API routes
```

## Dependencies

- **express**: Web framework for Node.js
- **cors**: Cross-origin resource sharing
- **axios**: HTTP client
- **cheerio**: HTML parser
- **jsdom**: DOM implementation
- **mongoose**: MongoDB object modeling
- **puppeteer**: Headless browser
- **node-nmap**: Nmap wrapper for port scanning
- **whoiser**: WHOIS client
- **builtwith**: Technology stack detection (imported as builtwith)

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature-name`.
3. Commit your changes: `git commit -am 'Add feature'`.
4. Push to the branch: `git push origin feature-name`.
5. Submit a pull request.

## License

ISC License - see package.json for details.

## Author

Kshitij Khatri