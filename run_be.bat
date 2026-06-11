@echo off
echo Starting MondoPT Backend Watcher...
start powershell -NoProfile -ExecutionPolicy Bypass -File watch_be.ps1
cd backend
echo Starting MondoPT Spring Boot Backend...
mvn spring-boot:run
pause
