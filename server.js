const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { getIcon } = require('./iconService');

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    if (parsedUrl.pathname === '/icon') {
        getIcon(parsedUrl.query, res);
    } else {
        let filePath = path.join(__dirname, parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname);
        
        fs.readFile(filePath, (err, content) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404);
                    res.end('File not found');
                } else {
                    res.writeHead(500);
                    res.end(`Server error: ${err.code}`);
                }
            } else {
                const extname = path.extname(filePath);
                let contentType = 'text/html';
                
                switch (extname) {
                    case '.js':
                        contentType = 'text/javascript';
                        break;
                    case '.css':
                        contentType = 'text/css';
                        break;
                    case '.json':
                        contentType = 'application/json';
                        break;
                    case '.png':
                        contentType = 'image/png';
                        break;
                    case '.jpg':
                        contentType = 'image/jpg';
                        break;
                    case '.svg':
                        contentType = 'image/svg+xml';
                        break;
                }
                
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    }
});

server.listen(1024, () => {
    console.log('Server running at http://localhost:1024/');
});
