const fs = require('fs');
const path = require('path');

function generateIcon(text, size = 100, color = '#000000', backgroundColor = '#FFFFFF') {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <rect width="100%" height="100%" fill="${backgroundColor}"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size/2}" fill="${color}" text-anchor="middle" dy=".3em">${text}</text>
    </svg>
    `;
    return svg;
}

function getIcon(req, res) {
    const { text, size, color, backgroundColor } = req.query;
    const svg = generateIcon(text, size, color, backgroundColor);
    
    res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
    res.end(svg);
}

module.exports = { getIcon };
