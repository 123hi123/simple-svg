@echo off
cd /d %~dp0
node server.js > server_log.txt 2>&1