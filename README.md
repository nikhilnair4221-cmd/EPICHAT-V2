# 🧠 EpiChat — AI-Powered Epilepsy Detection & Management Platform

EpiChat is a full-stack medical web application for EEG-based seizure detection, patient management, and AI-assisted clinical support.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Backend | FastAPI (Python) |
| Database | SQLite (via SQLAlchemy) |
| AI | Google Gemini / OpenAI |
| EEG Processing | MNE + PyTorch |

---

## ⚙️ Prerequisites

Make sure you have these installed:

- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [Git](https://git-scm.com/)

---

## 📦 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/nikhilnair4221-cmd/EPICHAT-V2.git
cd EPICHAT-V2
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate

# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Configure Environment Variables

```bash
# Copy the example env file
copy .env.example .env       # Windows
cp .env.example .env         # Mac/Linux
```

Then open `.env` and add your **free** Google Gemini API key:
- Get one at 👉 https://aistudio.google.com/app/apikey

#### Start the Backend

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: **http://localhost:8000**
API docs at: **http://localhost:8000/docs**

---

### 3. Frontend Setup

Open a **new terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🖥️ Running the App

You need **two terminals** running simultaneously:

| Terminal | Command | URL |
|----------|---------|-----|
| Backend | `uvicorn app.main:app --reload` | http://localhost:8000 |
| Frontend | `npm run dev` | http://localhost:5173 |

Open **http://localhost:5173** in your browser.

---

## 🔑 Getting a Free API Key

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key into `backend/.env` as `GEMINI_API_KEY=your-key-here`

---

## 📁 Project Structure

```
EpiChat/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI entry point
│   │   ├── database.py      # DB connection
│   │   ├── models/          # ML & DB models
│   │   └── routers/         # API routes
│   ├── requirements.txt
│   └── .env.example         # ← copy this to .env
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   └── lib/api.js       # API helper
│   └── package.json
└── README.md
```

---

## 📄 License

MIT License — feel free to use and modify.
