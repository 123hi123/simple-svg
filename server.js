const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { getIcon, getRenderingHistory, rollbackToVersion } = require('./iconService');

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    if (parsedUrl.pathname === '/icon') {
        try {
            await getIcon(parsedUrl.query, res);
        } catch (error) {
            console.error('Error generating icon:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
        }
    } else if (parsedUrl.pathname === '/history') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(getRenderingHistory()));
    } else if (parsedUrl.pathname === '/rollback') {
        const timestamp = parsedUrl.query.timestamp;
        if (timestamp) {
            const version = rollbackToVersion(timestamp);
            if (version) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(version));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Version not found' }));
            }
        } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Timestamp parameter is required' }));
        }
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
