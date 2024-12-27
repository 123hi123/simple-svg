const fs = require('fs');
const path = require('path');

const sharp = require('sharp');

// Store rendering history
const renderingHistory = [];

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

module.exports = { getIcon, getRenderingHistory, rollbackToVersion };
