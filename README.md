# KhanFlow

> A modern, AI-powered scheduling and task management platform that integrates seamlessly with your calendar and productivity tools.

## 🚀 Features

- **Smart Calendar Integration**: Connect Google Calendar, Outlook, and sync all your meetings
- **Intelligent Scheduling**: Create customizable event types and manage availability
- **Multi-Platform Task Management**: Integrate with Google Tasks and Microsoft To-Do
- **Voice Assistant**: Natural language task and event creation powered by OpenAI
- **AI Suggestions**: Get personalized productivity recommendations
- **Life Organization**: Organize goals and intentions with life areas and intent boards
- **Video Conferencing**: Integrated support for Zoom and Microsoft Teams

## 🏗️ Architecture

- **Backend**: Express.js + TypeScript + PostgreSQL (Supabase)
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Authentication**: JWT with Google and Microsoft OAuth
- **AI/Voice**: OpenAI API (GPT-4 & Whisper)

## 📁 Project Structure

```
khanflow/
├── backend/          # Express.js API server
├── new-frontend/     # Next.js client application
├── docs/            # Documentation
│   ├── setup/       # Setup guides
│   ├── testing/     # Testing documentation
│   └── troubleshooting/
└── .github/         # CI/CD workflows
```

## 🛠️ Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or Supabase account)
- Google OAuth credentials (for authentication)
- OpenAI API key (for voice features)

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/khanflow.git
cd khanflow

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../new-frontend
npm install
```

### 2. Configure Environment Variables

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials
```

**Frontend** (`new-frontend/.env.local`):
```bash
cp new-frontend/.env.example new-frontend/.env.local
# Edit new-frontend/.env.local with your credentials
```

See [docs/setup/OAUTH_SETUP_GUIDE.md](docs/setup/OAUTH_SETUP_GUIDE.md) for detailed OAuth configuration.

### 3. Database Setup

```bash
cd backend
npm run db:setup
```

See [docs/setup/SUPABASE_SETUP.md](docs/setup/SUPABASE_SETUP.md) for Supabase-specific instructions.

### 4. Run Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd new-frontend
npm run dev
```

Access the application at `http://localhost:3000`

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test
npm run test:watch

# Frontend E2E tests
cd new-frontend
npm run test:e2e
```

## 📚 Documentation

- [OAuth Setup Guide](docs/setup/OAUTH_SETUP_GUIDE.md)
- [Supabase Setup](docs/setup/SUPABASE_SETUP.md)
- [Database Setup](docs/setup/DATABASE_SETUP.md)
- [System Architecture](docs/SUGGESTION_SYSTEM_ARCHITECTURE.md)
- [Testing Documentation](docs/testing/)

## 🚀 Deployment

See deployment guides:
- [AWS Deployment (Coming Soon)](docs/deployment/AWS.md)
- [Docker Deployment (Coming Soon)](docs/deployment/DOCKER.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 🙏 Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation in `/docs`

---

Built with ❤️ using Next.js, Express, and OpenAI

