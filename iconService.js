const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIco = require('png-to-ico');  // 引入 png-to-ico 庫

// Store rendering history
const renderingHistory = [];

// 添加持久化配置存储
const configPath = path.join(__dirname, 'config.json');
let config = {
    icoSavePath: ''  // 默认为空，表示没有设置保存路径
};

// 加载配置
function loadConfig() {
    try {
        if (fs.existsSync(configPath)) {
            const configData = fs.readFileSync(configPath, 'utf8');
            config = JSON.parse(configData);
        }
    } catch (error) {
        console.error('Error loading config:', error);
    }
}

// 保存配置
function saveConfig() {
    try {
        const configData = JSON.stringify(config, null, 2);
        console.log('寫入配置:', configData);
        fs.writeFileSync(configPath, configData, 'utf8');
    } catch (error) {
        console.error('保存配置時出錯:', error);
        throw error;
    }
}

// 初始加载配置
loadConfig();

// 获取当前保存路径配置
function getIcoSavePath() {
    return config.icoSavePath;
}

// 设置保存路径
function setIcoSavePath(path) {
    console.log('嘗試設置路徑 (原始):', path);
    
    if (!path || typeof path !== 'string') {
        throw new Error('路徑不能為空或無效');
    }
    
    // 移除路徑中的引號
    path = path.replace(/^["']|["']$/g, '');
    
    // 處理路徑的特殊情況
    path = path.trim();
    
    console.log('處理後的路徑:', path);
    
    // 檢查路徑格式
    if (!/^[a-zA-Z]:[\\\/]/.test(path)) {
        console.error('路徑格式無效, 不是有效的Windows絕對路徑:', path);
        throw new Error('請使用有效的Windows絕對路徑 (例如: C:\\folder 或 D:/folder)');
    }
    
    // 額外安全檢查 - 不允許在系統目錄下創建目錄
    const systemFolders = ['windows', 'system32', 'program files', 'program files (x86)'];
    const pathLower = path.toLowerCase();
    
    for (const folder of systemFolders) {
        if (pathLower.includes(`\\${folder}\\`) || pathLower.includes(`/${folder}/`)) {
            console.error('路徑包含系統目錄:', path);
            throw new Error(`不建議在系統目錄 "${folder}" 中創建檔案，請選擇其他位置`);
        }
    }
    
    // 規範化路徑格式（確保使用正確的路徑分隔符）
    try {
        path = path.replace(/\//g, '\\');
        const normalizedPath = path; // 使用Node.js的路徑工具規範化
        console.log('規範化後的路徑:', normalizedPath);
        path = normalizedPath;
    } catch (error) {
        console.error('規範化路徑時出錯:', error);
        // 繼續使用原始路徑
    }
    
    // 設置路徑
    config.icoSavePath = path;
    
    // 嘗試創建目錄（如果不存在）
    try {
        // 檢查路徑是否有效
        if (path.trim() === '') {
            throw new Error('路徑不能為空');
        }
        
        if (!fs.existsSync(path)) {
            console.log(`路徑 ${path} 不存在，嘗試創建...`);
            try {
                fs.mkdirSync(path, { recursive: true });
                console.log(`創建目錄成功: ${path}`);
            } catch (mkdirError) {
                console.error(`創建目錄失敗: ${mkdirError.message}`, mkdirError);
                throw new Error(`無法創建目錄: ${mkdirError.message}`);
            }
        } else {
            console.log(`路徑已存在: ${path}`);
            // 檢查寫入權限
            try {
                const testFile = path.endsWith('\\') ? `${path}test_write_permission.tmp` : `${path}\\test_write_permission.tmp`;
                console.log(`嘗試寫入測試文件: ${testFile}`);
                fs.writeFileSync(testFile, 'test');
                fs.unlinkSync(testFile);
                console.log('已確認寫入權限');
            } catch (permError) {
                console.error(`無寫入權限: ${permError.message}`, permError);
                throw new Error(`無權限寫入該目錄 (${path}): ${permError.message}`);
            }
        }
    } catch (error) {
        console.error(`設置路徑 "${path}" 時出錯:`, error);
        throw error;
    }
    
    // 保存配置
    try {
        saveConfig();
        console.log('保存配置成功');
    } catch (configError) {
        console.error('保存配置失敗:', configError);
        throw new Error(`保存配置失敗: ${configError.message}`);
    }
    
    return config.icoSavePath;
}

function generateIcon(text, size = 100, color = '#000000', backgroundColor = '#FFFFFF') {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <rect width="100%" height="100%" fill="${backgroundColor}"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size/2}" fill="${color}" text-anchor="middle" dy=".3em">${text}</text>
    </svg>
    `;
    return svg;
}

async function getIcon(req, res) {
    const { text, size, color, backgroundColor } = req.query;
    const svg = generateIcon(text, size, color, backgroundColor);
    
    res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
    res.end(svg);

    // Generate thumbnail
    const thumbnailSize = 50;
    const thumbnailBuffer = await sharp(Buffer.from(svg))
        .resize(thumbnailSize, thumbnailSize)
        .toBuffer();

    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    const version = {
        timestamp,
        thumbnail: thumbnailBuffer.toString('base64'),
        params: { text, size, color, backgroundColor }
    };
    
    renderingHistory.push(version);
    return version;
}

// 生成.ico文件并保存到指定路径
async function generateIcoFile(svgString, filename = 'icon') {
    try {
        console.log('開始生成ICO文件...');
        
        // 首先将SVG转换为PNG缓冲区
        const pngBuffer = await sharp(Buffer.from(svgString))
            .resize(256, 256)  // ico文件通常为256x256像素
            .png()
            .toBuffer();
        
        console.log('SVG已轉換為PNG緩衝區');
        
        // 使用png-to-ico將PNG轉換為ICO
        let icoBuffer;
        try {
            icoBuffer = await pngToIco([pngBuffer]);
            console.log('PNG已轉換為ICO格式');
        } catch (icoError) {
            console.error('將PNG轉換為ICO時出錯:', icoError);
            throw new Error(`無法轉換為ICO格式: ${icoError.message}`);
        }
        
        // 检查保存路径是否设置
        if (!config.icoSavePath) {
            throw new Error('保存路径未设置');
        }
        
        // 再次確保目錄存在
        try {
            if (!fs.existsSync(config.icoSavePath)) {
                fs.mkdirSync(config.icoSavePath, { recursive: true });
                console.log(`創建目錄: ${config.icoSavePath}`);
            }
        } catch (dirError) {
            console.error(`確保路徑 ${config.icoSavePath} 存在時出錯:`, dirError);
            throw dirError;
        }
        
        // 构建完整的文件路径
        const fullPath = path.join(config.icoSavePath, `${filename}.ico`);
        
        // 写入文件
        try {
            fs.writeFileSync(fullPath, icoBuffer);
            console.log(`ICO文件已保存到: ${fullPath}`);
        } catch (writeError) {
            console.error(`寫入文件 ${fullPath} 時出錯:`, writeError);
            throw writeError;
        }
        
        return {
            success: true,
            path: fullPath
        };
    } catch (error) {
        console.error('Error generating ICO file:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

function getRenderingHistory() {
    return renderingHistory;
}

function rollbackToVersion(timestamp) {
    const index = renderingHistory.findIndex(v => v.timestamp === timestamp);
    if (index !== -1) {
        const version = renderingHistory[index];
        renderingHistory.splice(index + 1);
        return version;
    }
    return null;
}

module.exports = { 
    getIcon, 
    getRenderingHistory, 
    rollbackToVersion, 
    generateIcoFile, 
    getIcoSavePath, 
    setIcoSavePath 
};
