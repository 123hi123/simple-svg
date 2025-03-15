# 簡易 SVG 渲染與轉換工具

這是一個用於 SVG 編輯、預覽和轉換的工具，支持將 SVG 導出為 PNG、SVG 和 Windows ICO 格式。

## 快速啟動指南

### 環境要求

- Node.js (v14.0.0 或更高版本)
- npm (通常隨 Node.js 一起安裝)

### 安裝步驟

1. **克隆或下載項目**

   直接下載並解壓項目文件到您的電腦上。

2. **安裝依賴**

   打開終端/命令提示符，進入項目根目錄，運行：

   ```bash
   # 安裝所有依賴
   npm install
   ```

   主要依賴項：
   - `sharp` (v0.33.5): 用於圖像處理和轉換
   - `png-to-ico` (v2.1.8): 用於將 PNG 轉換為 Windows ICO 格式

3. **啟動服務器**

   在項目根目錄中運行：

   ```bash
   node server.js
   ```

   成功啟動後，您將看到以下訊息：
   ```
   Server running at http://localhost:1024/
   ```

   **Windows便捷啟動選項：**
   
   - **一鍵啟動**：雙擊項目根目錄中的 `start_server.bat` 文件，即可自動啟動服務。
     > 注意：啟動窗口需保持開啟，關閉窗口將停止服務。
   
   - **開機自啟動**：
     1. 右鍵點擊 `start_server_hidden.vbs` 並創建快捷方式
     2. 按 `Win + R` 鍵，輸入 `shell:startup` 打開啟動文件夾
     3. 將快捷方式移動到啟動文件夾中
     4. 或者使用 Windows 任務計劃程序設置開機時自動運行此 VBS 文件
     > 注意：使用VBS方式啟動時，服務將在後台運行，無窗口顯示。

4. **訪問應用**

   打開瀏覽器，訪問 [http://localhost:1024](http://localhost:1024)。

## 使用示例

### 渲染 SVG

1. 將您的 SVG 代碼粘貼到左側文本框中，或點擊「從剪貼板粘貼」按鈕。
2. SVG 將自動渲染在右側預覽區域。

### SVG 測試示例

複製以下 SVG 代碼到應用中測試：

```xml
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="80" fill="#3498db" />
  <rect x="60" y="60" width="80" height="80" fill="#e74c3c" />
  <polygon points="100,40 120,70 150,70 125,90 135,120 100,105 65,120 75,90 50,70 80,70" fill="#f1c40f" />
  <text x="100" y="175" font-family="Arial" font-size="18" text-anchor="middle" fill="white">SVG 測試</text>
</svg>
```

這將顯示一個藍色圓形、紅色矩形和黃色星形的簡單圖案。

### 導出圖像

- **下載 PNG**: 點擊「下載 PNG 🖼️」按鈕，將生成一個 PNG 文件供下載。
- **下載 SVG**: 點擊「下載 SVG」按鈕，將當前渲染的 SVG 下載為文件。
- **下載 ICO**: 
   1. 首次使用時，點擊「下載 ICO 圖標」按鈕，系統會要求您設置保存路徑。
   2. 輸入有效的 Windows 路徑，或從推薦路徑中選擇。
   3. 點擊「保存路徑設置」按鈕。
   4. 再次點擊「下載 ICO 圖標」按鈕，ICO 文件將保存到指定位置。

### 快速複製

- 點擊渲染區域，當前 SVG 將被轉換為 PNG 並複製到剪貼板。

### 使用歷史版本

- 每次渲染新的 SVG 都會自動保存到歷史記錄中。
- 從「渲染歷史」下拉菜單中選擇一個版本。
- 點擊「回滾到選定版本」按鈕恢復該版本。

## 疑難解答

- **端口被佔用**：如果端口 1024 已被佔用，請修改 `server.js` 文件中的端口號（在文件最底部）。
  ```javascript
  // 修改為其他端口，例如 3000
  server.listen(3000, () => {
      console.log('Server running at http://localhost:3000/');
  });
  ```

- **依賴安裝失敗**：若安裝 sharp 失敗，可嘗試：
  ```bash
  npm cache clean --force
  npm install sharp --verbose
  npm install png-to-ico
  ```

- **圖標生成失敗**: 如果顯示 "無法轉換為ICO格式" 錯誤，請確保重新啟動服務器：
  ```bash
  # 關閉當前運行的服務器（按 Ctrl+C）
  node server.js  # 重新啟動
  ```

- **後台服務問題**：如果使用 VBS 啟動後台服務，但無法訪問：
  1. 按 `Ctrl+Alt+Del` 打開任務管理器
  2. 檢查是否有 Node.js 進程在運行
  3. 如沒有，重新雙擊運行 `.bat` 文件查看錯誤信息

## 生成 ICO 文件注意事項

首次使用生成 ICO 功能時，需要設置保存路徑。請確保指定的路徑：
- 是絕對路徑（如 C:\Icons）
- 您的用戶賬戶具有寫入權限
- 不是系統目錄（如 Windows 或 System32）

推薦使用以下路徑：
- `C:\Users\Public\Pictures\Icons`
- `C:\Users\[您的用戶名]\Pictures\Icons`
- `D:\Icons`

## 主要功能

- 渲染和編輯 SVG
- 導出為 PNG 格式
- 導出為 SVG 格式
- 生成 Windows ICO 圖標文件
- 預覽和歷史記錄管理