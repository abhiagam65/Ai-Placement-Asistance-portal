@echo off
TITLE AI Placement Preparation Portal Launcher
echo ======================================================================
echo    Starting AI-Powered Placement Prep & Career Guidance Portal
echo ======================================================================

echo [1/3] Launching Python Flask AI Microservice (Port 5001)...
start "AI Service (Flask :5001)" cmd /k "cd ai-service && python app.py"

echo [2/3] Launching Node.js Express REST Backend (Port 3000)...
start "Backend API (Express :3000)" cmd /k "cd backend && npm start"

echo [3/3] Launching React Vite Frontend (Port 5173)...
start "Frontend (Vite :5173)" cmd /k "cd frontend && npm run dev"

echo.
echo ======================================================================
echo All 3 tiers have been started in separate console windows!
echo Access the Portal at: http://localhost:5173
echo.
echo Demo Accounts:
echo - Student: student@placement.edu / Student@123
echo - Admin:   admin@placement.edu   / Admin@123
echo ======================================================================
pause
