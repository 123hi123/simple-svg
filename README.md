# 簡易 SVG 渲染與轉換工具

這是一個用於 SVG 編輯、預覽和轉換的工具，支持將 SVG 導出為 PNG、SVG 和 ICO 格式。

## 快速啟動指南

### 環境要求

- Node.js (v14.0.0 或更高版本)
- npm (通常隨 Node.js 一起安裝)

### 安裝步驟

1. **克隆或下載項目**

   ```bash
   git clone https://your-repository-url/simple-svg.git
   cd simple-svg
   ```

   或者直接下載並解壓項目文件。

2. **安裝依賴**

   在項目根目錄下運行：

   ```bash
   # 安裝所有依賴
   npm install
   
   # 或者手動安裝單個依賴
   npm install sharp png-to-ico
   ```

   主要依賴項：
   - `sharp`: 用於圖像處理和轉換
   - `png-to-ico`: 用於將 PNG 轉換為 Windows ICO 格式

3. **啟動服務器**

   ```bash
   node server.js
   ```

   服務器將在 [http://localhost:1024](http://localhost:1024) 啟動。

4. **訪問應用**

   打開瀏覽器，訪問 [http://localhost:1024](http://localhost:1024)。

## 使用示例

### 渲染 SVG

1. 將您的 SVG 代碼粘貼到左側文本框中，或點擊「從剪貼板粘貼」按鈕。
2. SVG 將自動渲染在右側預覽區域。

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

- **依賴安裝失敗**：若 sharp 或其他依賴安裝失敗，可嘗試：
  ```bash
  npm cache clean --force
  npm install --no-optional
  ```

- **圖標生成失敗**：確保安裝了 png-to-ico 依賴：
  ```bash
  npm install png-to-ico --save
  ```

## 生成 ICO 文件注意事項

首次使用生成 ICO 功能時，需要設置保存路徑。請確保指定的路徑：
- 是絕對路徑（如 C:\Icons）
- 您的用戶賬戶具有寫入權限
- 不是系統目錄（如 Windows 或 System32）

推薦使用以下路徑：
- `C:\Users\Public\Pictures\Icons`
- `C:\Users\YourUsername\Pictures\Icons`
- `D:\Icons`

## 主要功能

- 渲染和編輯 SVG
- 導出為 PNG 格式
- 導出為 SVG 格式
- 生成 Windows ICO 圖標文件
- 預覽和歷史記錄管理 (不可用)