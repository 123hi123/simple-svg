function updateSettings() {
    const sizeOption = document.getElementById('sizeOption').value;
    const customSizeInputs = document.getElementById('customSizeInputs');
    customSizeInputs.style.display = sizeOption === 'custom' ? 'block' : 'none';
    renderSVG();
}

function renderSVG() {
    const svgInput = document.getElementById('svgInput').value.trim();
    const renderArea = document.getElementById('renderArea');
    
    if (svgInput === '') {
        renderArea.innerHTML = '';
        updateStatus('Waiting for SVG input...');
        return;
    }

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgInput, 'image/svg+xml');
    let svgElement = svgDoc.documentElement;

    if (svgElement.tagName.toLowerCase() !== 'svg') {
        renderArea.innerHTML = 'Invalid SVG input';
        updateStatus('Invalid SVG input');
        return;
    }

    const sizeOption = document.getElementById('sizeOption').value;
    let width, height;

    if (sizeOption === 'custom') {
        width = parseInt(document.getElementById('width').value, 10) || 1024;
        height = parseInt(document.getElementById('height').value, 10) || 1024;
    } else {
        width = svgElement.width.baseVal.value || 1024;
        height = svgElement.height.baseVal.value || 1024;
    }

    svgElement.setAttribute('width', width);
    svgElement.setAttribute('height', height);

    const backgroundColor = document.getElementById('backgroundColor').value;
    renderArea.style.backgroundColor = backgroundColor === 'transparent' ? 'transparent' : backgroundColor;

    renderArea.innerHTML = svgElement.outerHTML;
    convertSVGtoPNGAndCopyToClipboard(false);
}

function generateSVG() {
    const svgContent = document.getElementById('renderArea').innerHTML;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // 顯示成功提示
    showSuccessToast('SVG 文件下載成功！');
}

function generatePNG() {
    const renderArea = document.getElementById('renderArea');
    const svgElement = renderArea.querySelector('svg');
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    
    const canvas = document.createElement('canvas');
    const scale = 2; // Increase resolution
    canvas.width = svgElement.width.baseVal.value * scale;
    canvas.height = svgElement.height.baseVal.value * scale;
    
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        if (document.getElementById('backgroundColor').value !== 'transparent') {
            ctx.fillStyle = document.getElementById('backgroundColor').value;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'generated.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // 顯示成功提示
            showSuccessToast('PNG 文件下載成功！');
        }, 'image/png');
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
}

async function pasteFromClipboard() {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById('svgInput').value = text;
        renderSVG();
    } catch (err) {
        console.error('Failed to read clipboard contents: ', err);
    }
}

function convertSVGtoPNGAndCopyToClipboard(copyToClipboard = true) {
    const renderArea = document.getElementById('renderArea');
    const svgElement = renderArea.querySelector('svg');
    if (!svgElement) {
        updateStatus('No SVG found to convert');
        return;
    }

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    
    const canvas = document.createElement('canvas');
    const scale = 2; // Increase resolution
    canvas.width = svgElement.width.baseVal.value * scale;
    canvas.height = svgElement.height.baseVal.value * scale;
    
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        if (document.getElementById('backgroundColor').value !== 'transparent') {
            ctx.fillStyle = document.getElementById('backgroundColor').value;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(function(blob) {
            if (copyToClipboard) {
                navigator.clipboard.write([new ClipboardItem({'image/png': blob})]).then(() => {
                    updateStatus('PNG copied to clipboard');
                    // 顯示成功提示
                    showSuccessToast('PNG 已複製到剪貼板！');
                }).catch(err => {
                    console.error('Error copying PNG to clipboard:', err);
                    updateStatus('Failed to copy PNG to clipboard');
                });
            } else {
                updateStatus('SVG rendered successfully');
            }
        }, 'image/png');
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
}

function updateStatus(message) {
    document.getElementById('statusMessage').textContent = message;
}

function copySVGToClipboard() {
    convertSVGtoPNGAndCopyToClipboard(true);
}

async function fetchRenderingHistory() {
    try {
        const response = await fetch('/history');
        if (!response.ok) {
            throw new Error('Failed to fetch rendering history');
        }
        const history = await response.json();
        updateRenderingHistoryUI(history);
    } catch (error) {
        console.error('Error fetching rendering history:', error);
        updateStatus('Failed to fetch rendering history');
    }
}

function updateRenderingHistoryUI(history) {
    const select = document.getElementById('renderingHistory');
    select.innerHTML = '<option value="">Select a version</option>';
    history.forEach((version, index) => {
        const option = document.createElement('option');
        option.value = version.timestamp;
        option.innerHTML = `
            <div style="display: flex; align-items: center;">
                <img src="data:image/svg+xml;base64,${version.thumbnail}" width="30" height="30" style="margin-right: 10px;">
                <span>Version ${index + 1}: ${version.timestamp}</span>
            </div>
        `;
        select.appendChild(option);
    });
}

function selectHistoryVersion() {
    const select = document.getElementById('renderingHistory');
    const selectedVersion = select.value;
    if (selectedVersion) {
        updateStatus(`Selected version: ${selectedVersion}`);
    }
}

async function rollbackToVersion() {
    const select = document.getElementById('renderingHistory');
    const selectedTimestamp = select.value;
    if (!selectedTimestamp) {
        updateStatus('Please select a version to rollback to');
        return;
    }

    try {
        const response = await fetch(`/rollback?timestamp=${selectedTimestamp}`);
        if (!response.ok) {
            throw new Error('Failed to rollback to selected version');
        }
        const result = await response.json();
        document.getElementById('svgInput').value = result.params.text || '';
        document.getElementById('backgroundColor').value = result.params.backgroundColor || 'transparent';
        if (result.params.size) {
            document.getElementById('sizeOption').value = 'custom';
            document.getElementById('width').value = result.params.size;
            document.getElementById('height').value = result.params.size;
        } else {
            document.getElementById('sizeOption').value = 'dynamic';
        }
        updateStatus('Rolled back to selected version successfully');
        // 顯示成功提示
        showSuccessToast('成功回滾到選定版本！');
        renderSVG(); // Re-render the SVG with the rolled back version
        fetchRenderingHistory(); // Update the history UI
    } catch (error) {
        console.error('Error rolling back to version:', error);
        updateStatus('Failed to rollback to selected version');
    }
}

async function renderSVG() {
    const svgInput = document.getElementById('svgInput').value.trim();
    const renderArea = document.getElementById('renderArea');
    
    if (svgInput === '') {
        renderArea.innerHTML = '';
        updateStatus('Waiting for SVG input...');
        return;
    }

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgInput, 'image/svg+xml');
    let svgElement = svgDoc.documentElement;

    if (svgElement.tagName.toLowerCase() !== 'svg') {
        renderArea.innerHTML = 'Invalid SVG input';
        updateStatus('Invalid SVG input');
        return;
    }

    const sizeOption = document.getElementById('sizeOption').value;
    let width, height;

    if (sizeOption === 'custom') {
        width = parseInt(document.getElementById('width').value, 10) || 1024;
        height = parseInt(document.getElementById('height').value, 10) || 1024;
    } else {
        width = svgElement.width.baseVal.value || 1024;
        height = svgElement.height.baseVal.value || 1024;
    }

    svgElement.setAttribute('width', width);
    svgElement.setAttribute('height', height);

    const backgroundColor = document.getElementById('backgroundColor').value;
    renderArea.style.backgroundColor = backgroundColor === 'transparent' ? 'transparent' : backgroundColor;

    renderArea.innerHTML = svgElement.outerHTML;
    convertSVGtoPNGAndCopyToClipboard(false);

    // After successful render, fetch and update rendering history
    await fetchRenderingHistory();
}

// 顯示成功提示框
function showSuccessToast(message = '操作成功！', duration = 3000) {
    const toast = document.getElementById('successToast');
    const toastMessage = toast.querySelector('.toast-message');
    
    // 設置提示訊息
    toastMessage.textContent = message;
    
    // 顯示提示框
    toast.classList.add('visible');
    
    // 設定計時器自動隱藏
    setTimeout(() => {
        toast.classList.remove('visible');
    }, duration);
}

// 生成ICO图标并保存到指定路径
async function generateICO() {
    const renderArea = document.getElementById('renderArea');
    const svgElement = renderArea.querySelector('svg');
    if (!svgElement) {
        updateStatus('未找到SVG，無法生成ICO文件');
        return;
    }

    // 顯示正在生成
    updateStatus('正在生成ICO文件...');

    // 首先检查是否已设置保存路径
    try {
        const response = await fetch('/ico-save-path');
        if (!response.ok) {
            throw new Error('無法獲取ICO保存路徑');
        }
        
        let data;
        try {
            data = await response.json();
        } catch (error) {
            console.error('解析路徑數據時出錯:', error);
            updateStatus('無法獲取保存路徑：服務器返回了無效的數據');
            return;
        }
        
        if (!data.path) {
            updateStatus('請先設置ICO保存路徑');
            openPathDialog(); // 打开路径设置对话框
            return;
        }

        // 获取文件名
        const filename = document.getElementById('icoFilename').value || 'icon';
        
        // 获取SVG字符串
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        
        // 發送請求前顯示正在處理
        updateStatus(`正在生成並保存ICO文件 "${filename}.ico"...`);
        
        // 发送请求生成ICO
        const icoResponse = await fetch('/generate-ico', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                svg: svgString,
                filename: filename
            })
        });
        
        let result;
        try {
            result = await icoResponse.json();
        } catch (error) {
            console.error('解析ICO生成結果時出錯:', error);
            const text = await icoResponse.text();
            updateStatus(`生成ICO文件失敗: 服務器返回了無效的數據 (${text})`);
            return;
        }
        
        if (!icoResponse.ok) {
            updateStatus(`生成ICO文件失敗: ${result?.error || `服務器錯誤 ${icoResponse.status}`}`);
            return;
        }
        
        if (result.success) {
            const successMessage = `ICO文件已成功保存到: ${result.path}`;
            updateStatus(successMessage);
            
            // 顯示成功提示
            showSuccessToast(successMessage);
        } else {
            updateStatus(`生成ICO文件失敗: ${result.error || '未知錯誤'}`);
        }
    } catch (error) {
        console.error('Error generating ICO file:', error);
        updateStatus(`生成ICO文件時出錯: ${error.message}`);
    }
}

// 加载当前ICO保存路径
async function loadIcoSavePath() {
    try {
        const response = await fetch('/ico-save-path');
        if (!response.ok) {
            throw new Error('無法獲取ICO保存路徑');
        }
        const data = await response.json();
        document.getElementById('icoSavePath').value = data.path || '';
    } catch (error) {
        console.error('Error loading ICO save path:', error);
        updateStatus('無法加載ICO保存路徑');
    }
}

// 打开路径设置对话框
function openPathDialog() {
    const dialog = document.getElementById('icoPathDialog');
    const currentPath = document.getElementById('icoSavePath').value;
    document.getElementById('newIcoSavePath').value = currentPath;
    dialog.classList.add('visible');
}

// 关闭路径设置对话框
function closePathDialog() {
    const dialog = document.getElementById('icoPathDialog');
    dialog.classList.remove('visible');
}

// 獲取用戶主目錄的模擬函數（前端無法直接獲取系統路徑）
function getUserHome() {
    return 'C:\\Users\\' + (navigator.userAgent.indexOf('Windows NT 10.0') !== -1 ? 'YourUsername' : 'User');
}

// 測試路徑是否可用
async function testPath() {
    let testPath = document.getElementById('newIcoSavePath').value;
    if (!testPath) {
        updateStatus('請先輸入一個路徑進行測試');
        return;
    }
    
    // 處理路徑
    testPath = testPath.trim().replace(/^["']|["']$/g, '');
    
    // 處理路徑中的反斜杠問題 (確保使用雙反斜杠)
    if (testPath.includes('\\') && !testPath.includes('\\\\')) {
        testPath = testPath.replace(/\\/g, '\\\\');
    }
    
    updateStatus(`正在測試路徑: ${testPath}`);
    
    try {
        const response = await fetch('/test-path', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ path: testPath })
        });
        
        // 獲取響應文本
        const responseText = await response.text();
        let result;
        
        try {
            result = JSON.parse(responseText);
        } catch (error) {
            updateStatus(`路徑測試失敗: 服務器返回了無效的響應 (${responseText.substring(0, 50)}${responseText.length > 50 ? '...' : ''})`);
            return;
        }
        
        if (result.success) {
            const successMessage = `✅ 路徑測試成功: ${result.message || '可以使用此路徑'}`;
            updateStatus(successMessage);
            // 顯示成功提示框
            showSuccessToast('路徑測試成功！', 2000);
        } else {
            updateStatus(`❌ 路徑測試失敗: ${result.error || '無法寫入此路徑'}`);
        }
    } catch (error) {
        console.error('測試路徑時出錯:', error);
        updateStatus(`測試路徑時出錯: ${error.message}`);
    }
}

// 選擇預設路徑
function selectPath(path) {
    document.getElementById('newIcoSavePath').value = path;
    updateStatus(`已選擇路徑: ${path}`);
}

// 保存新的ICO保存路径
async function saveIcoSavePath() {
    let newPath = document.getElementById('newIcoSavePath').value;
    if (!newPath) {
        updateStatus('保存路徑不能為空');
        return;
    }
    
    // 去除前後的空格
    newPath = newPath.trim();
    
    // 移除路徑兩端的引號（如果有）
    newPath = newPath.replace(/^["']|["']$/g, '');
    
    // 基本路徑格式驗證
    if (!/^[a-zA-Z]:[\\\/]/.test(newPath)) {
        updateStatus('無效的路徑格式！請使用絕對路徑 (例如: C:\\folder)');
        return;
    }
    
    // 處理路徑中的反斜杠問題 (確保使用雙反斜杠)
    if (newPath.includes('\\') && !newPath.includes('\\\\')) {
        newPath = newPath.replace(/\\/g, '\\\\');
    }
    
    console.log('處理後的路徑:', newPath);
    
    // 顯示正在保存
    updateStatus('正在保存路徑設置...');
    
    try {
        const response = await fetch('/ico-save-path', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                path: newPath
            })
        });
        
        // 首先檢查是否有響應
        if (!response) {
            updateStatus('設置保存路徑失敗: 沒有收到服務器響應');
            return;
        }
        
        // 嘗試獲取響應文本
        const responseText = await response.text();
        console.log('服務器原始響應:', responseText);
        
        // 嘗試解析為JSON
        let result;
        try {
            if (responseText && responseText.trim()) {
                result = JSON.parse(responseText);
            } else {
                updateStatus('設置保存路徑失敗: 服務器返回空響應');
                return;
            }
        } catch (jsonError) {
            console.error('解析服務器響應時出錯:', jsonError, '原始響應:', responseText);
            updateStatus(`設置保存路徑失敗: 服務器返回的數據無法解析 (${responseText.substring(0, 50)}${responseText.length > 50 ? '...' : ''})`);
            return;
        }
        
        if (!response.ok) {
            updateStatus(`設置保存路徑失敗: ${result?.error || '伺服器錯誤 ' + response.status}`);
            return;
        }
        
        if (result.success) {
            document.getElementById('icoSavePath').value = result.path;
            const successMessage = `✅ ICO保存路徑已成功設置為: ${result.path}`;
            updateStatus(successMessage);
            // 顯示成功提示框
            showSuccessToast('ICO保存路徑設置成功！');
            closePathDialog();
        } else {
            updateStatus(`❌ 設置保存路徑失敗: ${result.error || '未知錯誤'}`);
        }
    } catch (error) {
        console.error('設置保存路徑時出錯:', error);
        updateStatus(`設置保存路徑時出錯: ${error.message}`);
    }
}

document.getElementById('svgInput').addEventListener('input', renderSVG);
document.getElementById('renderArea').addEventListener('click', copySVGToClipboard);
updateSettings();
fetchRenderingHistory(); // Fetch initial rendering history when page loads
loadIcoSavePath(); // 加载当前ICO保存路径
