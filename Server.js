const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || 'YAHAN_APNA_TOKEN_DAALO';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const DB_FILE = './database.json';

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ users: {} }));
}

function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function getUser(userId, username) {
  const db = readDB();
  if (!db.users[userId]) {
    db.users[userId] = {
      id: userId,
      username: username || 'Warrior',
      tokens: 1000,
      energy: 500,
      maxEnergy: 500,
      level: 1,
      tapPower: 1,
      referrals: [],
      joinedAt: Date.now()
    };
    writeDB(db);
  }
  return db.users[userId];
}

app.use(express.static('public'));
app.use(express.json());

app.get('/api/user/:id', (req, res) => {
  const db = readDB();
  const user = db.users[req.params.id];
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.post('/api/tap/:id', (req, res) => {
  const db = readDB();
  const user = db.users[req.params.id];
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.energy > 0) {
    user.energy -= 1;
    user.tokens += user.tapPower;
    writeDB(db);
  }
  res.json(user);
});

app.get('/api/leaderboard', (req, res) => {
  const db = readDB();
  const users = Object.values(db.users).sort((a, b) => b.tokens - a.tokens).slice(0, 100);
  res.json(users);
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.first_name || 'Warrior';
  getUser(userId, username);

  bot.sendMessage(chatId,
    `🦠 Welcome to CURE Protocol, ${username}!\n\nScientists failed. Governments failed.\nNow it's YOUR turn.\n\n💊 Tap viruses. Earn $CURE.\n🎁 You received 1000 $CURE welcome bonus!`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🦠 PLAY NOW', web_app: { url: process.env.GAME_URL || 'https://example.com' } }]
        ]
      }
    }
  );
});

bot.onText(/\/balance/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const user = getUser(userId, msg.from.first_name);
  bot.sendMessage(chatId, `💊 Your balance: ${user.tokens} $CURE`);
});

app.listen(PORT, () => {
  console.log(`CURE Protocol server running on port ${PORT}`);
});
