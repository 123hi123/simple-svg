   @echo off
   echo SVG渲染器啟動中...
   echo 請勿關閉此窗口，關閉窗口將停止服務。
   echo.
   echo 服務啟動後，請訪問: http://localhost:1024
   echo.
   node "%~dp0server.js"
   pause