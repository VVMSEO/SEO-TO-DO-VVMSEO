# To-Do & Telegram Reminders

A React + Firebase To-Do application that sends scheduled reminders to your Telegram account.

## Setup Instructions

### 1. Firebase Setup
Create a Firebase project, enable Firestore Database, and enable Anonymous Authentication in the Authentication section.
**Note:** Scheduled Cloud Functions require the Blaze (pay-as-you-go) plan.

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in your Firebase configuration values:
```bash
cp .env.example .env
```

### 3. Telegram Bot Setup
1. Send `/start` to `@BotFather` on Telegram to create a new bot and get your bot token.
2. Set the Telegram bot token in Firebase secrets:
```bash
firebase functions:secrets:set TELEGRAM_BOT_TOKEN
```

### 4. Deploy Cloud Functions
Deploy the scheduled function that sends reminders:
```bash
cd functions
npm install
firebase deploy --only functions
```

### 5. Deploy Frontend
Deploy the React app to GitHub Pages:
```bash
npm install
npm run deploy
```

### 6. Getting Telegram Chat ID
To receive reminders, you need your Telegram Chat ID. Send `/start` to `@userinfobot` on Telegram to get your ID, and enter it when adding a task.
