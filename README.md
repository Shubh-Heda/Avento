# Avento - Sports & Events Connection Platform

Modern social platform built with **React + TypeScript + Vite** and powered by **Firebase**.

## Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Firebase account (free tier works)

### Installation

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Server runs at: **http://localhost:3001**

---

## Firebase Setup

### 1. Get Firebase Credentials
1. Go to [Firebase Console](https://console.firebase.google.com/project/avento-us)
2. Click ⚙️ **Settings** → **Project Settings**
3. Under "Your apps", click the **Web** icon
4. Copy the config values

### 2. Add to `.env.local`
```env
VITE_FIREBASE_API_KEY="your_api_key"
VITE_FIREBASE_AUTH_DOMAIN="avento-us.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="avento-us"
VITE_FIREBASE_STORAGE_BUCKET="avento-us.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
VITE_FIREBASE_APP_ID="your_app_id"
```

### 3. Enable Firebase Services
- **Firestore Database**: Build → Firestore Database → Create (test mode)
- **Authentication**: Build → Authentication → Email/Password + Google
- **Realtime Database** (optional): Build → Realtime Database → Create (test mode)

### 4. Refresh & Done ✅
Hard refresh browser (`Ctrl+Shift+R`) → App now uses live Firebase

---

## Project Structure

```
src/
  ├── components/    # React components
  ├── services/      # Firebase & business logic
  ├── lib/           # Firebase config, auth, utilities
  └── App.tsx        # Main app component

public/             # Static assets
build/              # Production build output
.env.local          # Firebase credentials (gitignored)
```

---

## Key Features

- ✅ User authentication (Email/Password, Google)
- ✅ Real-time user activity (Firestore)
- ✅ Sports matches & event booking
- ✅ Community chat & messaging
- ✅ Trust scoring system
- ✅ Payment integration

---

## Build & Deploy

```bash
# Build for production
npm run build

# Preview build
npm run preview

# Deploy to Vercel (configured)
vercel
```

---

## Troubleshooting

**Port 3000 already in use?** → Dev server automatically switches to 3001

**Firebase config errors?** → Check `.env.local` has all required keys and no typos

**Demo mode showing?** → Open console (F12) → If you see "Demo mode", credentials aren't loaded. Check `.env.local` is saved correctly.

---

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Backend**: Firebase (Auth, Firestore, Realtime DB)
- **Styling**: Tailwind CSS
- **UI**: Shadcn/ui, Sonner toast notifications

---

For questions or issues, check the browser console for detailed error messages.bash
# Clone the repository
git clone https://github.com/Shubh-Heda/Avento.git

# Navigate to project directory
cd Avento

# Install dependencies
npm install

# Start development server
npm run dev
```

Live demo: https://shubh-heda.github.io/Avento/

Visit `http://localhost:5173` to run it locally during development.

### Build for Production

```bash
npm run build
```

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript
- **UI Components**: Radix UI, Tailwind CSS v4
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Backend**: Supabase (Database & Auth)

## 📁 Project Structure

```
src/
├── components/        # React components
│   ├── Dashboard.tsx
│   ├── MatchFinder.tsx
│   ├── GroupChat.tsx
│   └── ...
├── services/         # Business logic & API calls
├── lib/             # Utilities & helpers
├── styles/          # Global styles
└── assets/          # Images & static files
```

## 🎨 Key Components

- **Dashboard**: Main hub for all activities
- **MatchFinder**: AI-powered match recommendations
- **GroupChat**: Real-time messaging system
- **MapView**: Interactive location-based features
- **PaymentModal**: Secure payment processing
- **ActivityFeed**: Social feed with updates
- **AchievementSystem**: Gamification features

## 🔐 Features Overview

### For Players
- Find matches instantly based on location and skill level
- Connect with like-minded sports enthusiasts
- Track your sports journey with stats and achievements
- Earn trust scores through consistent participation

### For Organizers
- Create and manage matches/events easily
- Automated payment collection and splitting
- Group communication tools
- Attendance tracking and verification

### For Community
- Public/private visibility controls
- Community events and tournaments
- Social features (gratitude, memories, friendships)
- Voice rooms for discussions

## 📱 Screenshots

[Add screenshots of your app here]

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

**Shubh Heda**
- GitHub: [@Shubh-Heda](https://github.com/Shubh-Heda)

## 🙏 Acknowledgments

Built with modern web technologies and best practices to create a seamless social sports experience.

---

⭐ If you like this project, please give it a star on GitHub!
  