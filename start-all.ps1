# PowerShell launcher for AI Placement Portal
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   Starting AI-Powered Placement Prep & Career Guidance Portal" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan

$baseDir = $PSScriptRoot

Write-Host "`n[1/3] Launching Python Flask AI Microservice on Port 5001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\ai-service'; python app.py"

Write-Host "[2/3] Launching Node.js Express REST API on Port 5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\backend'; npm start"

Write-Host "[3/3] Launching Vite React Frontend on Port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\frontend'; npm run dev"

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host "All tiers started! Open your browser at: http://localhost:5173" -ForegroundColor Green
Write-Host "Demo Credentials:" -ForegroundColor White
Write-Host "Student Account: student@placement.edu / Student@123" -ForegroundColor Cyan
Write-Host "Admin Account:   admin@placement.edu   / Admin@123" -ForegroundColor Magenta
Write-Host "======================================================================" -ForegroundColor Cyan
