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

document.getElementById('svgInput').addEventListener('input', renderSVG);
document.getElementById('renderArea').addEventListener('click', copySVGToClipboard);
updateSettings();
fetchRenderingHistory(); // Fetch initial rendering history when page loads
