# AI Writing Assistant

A full-stack MERN application powered by OpenAI's GPT to help users improve their writing through grammar checking, spell checking, and intelligent rephrasing.

## Features

- **Grammar Checking**: AI-powered grammar correction
- **Spell Checking**: Advanced spell checking with context awareness
- **Intelligent Rephrasing**: Multiple suggestions for sentence rephrasing
- **Authentication**: Secure login with Privy
- **Responsive Design**: Beautiful UI built with Tailwind CSS

## Tech Stack

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- Axios
- React Router
- Privy for Authentication

**Backend:**
- Node.js with Express
- OpenAI API
- CORS enabled

## Prerequisites

Before you begin, ensure you have:
- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key (get from https://platform.openai.com/)
- Privy App ID (get from https://dashboard.privy.io/)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/SaurabhR44/AI-Writing-Assistant.git
cd AI-Writing-Assistant/AI-Writing-Assistant-MERN
```

### 2. Install Dependencies

```bash
npm run install-all
```

Or manually:

```bash
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

### 3. Setup Environment Variables

**Server (.env)**
```bash
cd server
cp .env.example .env
# Edit .env and add your OpenAI API key
nano .env
```

**Client (.env)**
```bash
cd ../client
cp .env.example .env
# Edit .env and add your Privy App ID
nano .env
```

### 4. Environment Variables Configuration

**Server `.server/.env`:**
```
PORT=8000
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxx
```

**Client `client/.env`:**
```
VITE_PRIVY_APP_ID=your_privy_app_id_here
```

## Running the Application

### Development Mode

From the root directory:

```bash
npm run dev
```

This will start both the client (Vite dev server) and server simultaneously.

Alternatively, run them separately:

**Terminal 1 - Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

### Production Build

```bash
npm run build
```

This will create an optimized build of the React frontend in `client/dist/`.

## Deployment to Vercel

### Frontend Deployment

1. **Push to GitHub** (if not already):
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Deploy on Vercel**:
   - Go to https://vercel.com/
   - Click "New Project"
   - Select your GitHub repository
   - Configure build settings:
     - **Framework Preset**: Vite
     - **Root Directory**: `AI-Writing-Assistant-MERN/client`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   - Add Environment Variables:
     - `VITE_PRIVY_APP_ID`: Your Privy App ID
   - Click Deploy

### Backend Deployment (Optional - Use a separate service)

The backend can be deployed to:
- **Render**: https://render.com/ (free tier available)
- **Railway**: https://railway.app/
- **Heroku**: https://www.heroku.com/

For production, update the API endpoint in `client/src/components/Editor.jsx` from `http://localhost:8000` to your deployed backend URL.

## API Endpoints

### Analyze (Rephrase)
```
POST /api/analyze
Body: { sentence: string }
Response: { rephrasedSentences: string[] }
```

### Grammar Check
```
POST /api/grammarcheck
Body: { text: string }
Response: { correctedText: string }
```

### Spell Check
```
POST /api/spellcheck
Body: { text: string }
Response: { correctedText: string }
```

## Project Structure

```
AI-Writing-Assistant-MERN/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── .env               # Client environment variables
├── server/                # Express backend
│   ├── routes/            # API routes
│   ├── app.js             # Main server file
│   ├── package.json
│   └── .env               # Server environment variables
└── package.json           # Root package.json
```

## Troubleshooting

### Port Already in Use
If port 8000 is already in use:
```bash
# Change PORT in server/.env
PORT=3001
```

### OpenAI API Errors
- Ensure your API key is valid
- Check OpenAI API usage limits
- Verify account has sufficient credits

### Privy Authentication Issues
- Verify Privy App ID is correctly set
- Check Privy dashboard for app configuration
- Clear browser cookies and try again

### CORS Errors
- Ensure backend is running on the correct port
- Check API endpoint URLs in frontend code
- Verify CORS is properly configured in `server/app.js`

## Contributing

Feel free to fork this project and submit pull requests for any improvements.

## License

ISC

## Support

For issues and questions, please create an issue on GitHub or contact the development team.

---

Built with ❤️ by Saurabh R
