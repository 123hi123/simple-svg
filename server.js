const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { getIcon, getRenderingHistory, rollbackToVersion, generateIcoFile, getIcoSavePath, setIcoSavePath } = require('./iconService');

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    console.log(`收到請求: ${req.method} ${parsedUrl.pathname}`);
    
    try {
        // ICO保存路徑相關處理
        if (parsedUrl.pathname === '/ico-save-path') {
            handleIcoSavePath(req, res);
            return;
        }
        
        // 測試路徑相關處理
        if (parsedUrl.pathname === '/test-path') {
            handleTestPath(req, res);
            return;
        }
        
        // 其他原有的路由處理...
        if (parsedUrl.pathname === '/icon') {
            await handleIcon(req, parsedUrl, res);
        } else if (parsedUrl.pathname === '/history') {
            handleHistory(res);
        } else if (parsedUrl.pathname === '/rollback') {
            handleRollback(parsedUrl, res);
        } else if (parsedUrl.pathname === '/generate-ico') {
            handleGenerateIco(req, res);
        } else {
            // 處理靜態文件
            handleStaticFiles(parsedUrl, res);
        }
    } catch (error) {
        console.error('處理請求時出錯:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: false, 
            error: `伺服器內部錯誤: ${error.message}`
        }));
    }
});

// 處理設置和獲取ICO保存路徑
function handleIcoSavePath(req, res) {
    if (req.method === 'GET') {
        // 獲取當前保存路徑
        try {
            const savePath = getIcoSavePath();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ path: savePath }));
        } catch (error) {
            console.error('獲取保存路徑時出錯:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: false, 
                error: `獲取保存路徑時出錯: ${error.message}` 
            }));
        }
    } else if (req.method === 'POST') {
        // 設置保存路徑
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            console.log('接收到的請求體:', body);
            
            try {
                let data;
                try {
                    data = JSON.parse(body);
                } catch (parseError) {
                    console.error('解析請求數據時出錯:', parseError, '原始請求體:', body);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: `無效的JSON數據: ${parseError.message}` 
                    }));
                    return;
                }
                
                if (!data || !data.path) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false,
                        error: '路徑不能為空' 
                    }));
                    return;
                }
                
                let newPath = data.path;
                console.log('接收到的原始路徑:', newPath);
                
                // 移除可能的前後引號
                newPath = newPath.replace(/^["']|["']$/g, '');
                
                // 處理反斜杠
                if (newPath.includes('\\\\')) {
                    newPath = newPath.replace(/\\\\/g, '\\');
                }
                
                console.log('處理後的最終路徑:', newPath);
                
                try {
                    const savedPath = setIcoSavePath(newPath);
                    console.log('保存成功，返回路徑:', savedPath);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        path: savedPath 
                    }));
                } catch (pathError) {
                    console.error('設置路徑時出錯:', pathError);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: pathError.message || '設置路徑時出錯' 
                    }));
                }
            } catch (error) {
                console.error('處理路徑設置請求時出錯:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false, 
                    error: `處理請求時出錯: ${error.message}` 
                }));
            }
        });
    } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: false,
            error: 'Method not allowed' 
        }));
    }
}

// 處理測試路徑
function handleTestPath(req, res) {
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            console.log('接收到測試路徑請求:', body);
            
            try {
                let data;
                try {
                    data = JSON.parse(body);
                } catch (parseError) {
                    console.error('解析請求數據時出錯:', parseError);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: `無效的JSON數據: ${parseError.message}` 
                    }));
                    return;
                }
                
                if (!data || !data.path) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false,
                        error: '路徑不能為空' 
                    }));
                    return;
                }
                
                let testPath = data.path;
                console.log('測試路徑:', testPath);
                
                // 處理路徑
                testPath = testPath.replace(/^["']|["']$/g, '');
                if (testPath.includes('\\\\')) {
                    testPath = testPath.replace(/\\\\/g, '\\');
                }
                
                // 測試路徑
                try {
                    const pathExists = fs.existsSync(testPath);
                    let message;
                    
                    if (pathExists) {
                        // 測試寫入權限
                        try {
                            const testFile = testPath.endsWith('\\') ? 
                                `${testPath}test_permission.tmp` : 
                                `${testPath}\\test_permission.tmp`;
                            fs.writeFileSync(testFile, 'test');
                            fs.unlinkSync(testFile);
                            message = '路徑存在並可寫入';
                        } catch (writeError) {
                            console.error('測試寫入時出錯:', writeError);
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ 
                                success: false, 
                                error: `路徑存在但無法寫入: ${writeError.message}` 
                            }));
                            return;
                        }
                    } else {
                        message = '路徑不存在，但系統將在保存時嘗試創建它';
                    }
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        message: message,
                        path: testPath
                    }));
                } catch (error) {
                    console.error('測試路徑時出錯:', error);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: `測試路徑時出錯: ${error.message}` 
                    }));
                }
            } catch (error) {
                console.error('處理測試路徑請求時出錯:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false, 
                    error: `處理請求時出錯: ${error.message}` 
                }));
            }
        });
    } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: false,
            error: '不支持的請求方法' 
        }));
    }
}

// 處理圖標生成
async function handleIcon(req, parsedUrl, res) {
    try {
        await getIcon(parsedUrl.query, res);
    } catch (error) {
        console.error('Error generating icon:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
}

// 處理渲染歷史
function handleHistory(res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getRenderingHistory()));
}

// 處理回滾版本
function handleRollback(parsedUrl, res) {
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
}

// 處理生成ICO文件
function handleGenerateIco(req, res) {
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const svgString = data.svg;
                let filename = data.filename || 'icon';
                
                // 替換文件名中的無效字符
                filename = filename.replace(/[\\/:*?"<>|]/g, '_');
                
                if (!svgString) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: 'SVG數據不能為空' 
                    }));
                    return;
                }
                
                try {
                    const result = await generateIcoFile(svgString, filename);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                } catch (icoError) {
                    console.error('Error in generateIcoFile:', icoError);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: `生成ICO文件時出錯: ${icoError.message}` 
                    }));
                }
            } catch (error) {
                console.error('Error parsing JSON:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false, 
                    error: `解析請求數據時出錯: ${error.message}` 
                }));
            }
        });
    } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
}

// 處理靜態文件
function handleStaticFiles(parsedUrl, res) {
    let filePath = path.join(__dirname, parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname);
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false,
                    error: 'File not found' 
                }));
            } else {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false,
                    error: `Server error: ${err.code}` 
                }));
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

server.listen(1024, () => {
    console.log('Server running at http://localhost:1024/');
});
