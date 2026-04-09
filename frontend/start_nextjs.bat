@echo off
REM Update the path for this exact session
set "PATH=C:\Program Files\nodejs;%PATH%"

REM Confirm Node exists
node -v

REM Install Next.js dependencies properly
npm install

REM Ensure Chart modules are installed
npm install react-chartjs-2 chart.js

REM Start the server
npm run dev
