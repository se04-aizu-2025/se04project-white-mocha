# Sorting Visualizer

This project is a sorting algorithm visualizer with a Java backend API
and a React (Vite) frontend.

---

## Backend (Java API)

### Build
```bash
cd backend
javac -d . $(find . -name "*.java")
Run


java api.ApiServer
The server will start at:



http://localhost:7070
Frontend (React + Vite)
Install dependencies


cd frontend
npm install
Run development server


npm run dev
Open in browser:



http://localhost:5173
Startup Order
Start the backend first

Then start the frontend

API Check (Optional)


curl http://localhost:7070/algorithms
