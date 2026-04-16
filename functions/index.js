const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendtelegramreminders = onSchedule("every 1 minutes", async (event) => {
  const db = admin.firestore();
  const now = new Date();
  
  const tasksRef = db.collection('tasks');
  const snapshot = await tasksRef
    .where('done', '==', false)
    .where('reminded', '==', false)
    .get();

  if (snapshot.empty) {
    console.log('No tasks to remind.');
    return;
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN environment variable is not set.');
    return;
  }

  const promises = [];

  snapshot.forEach(doc => {
    const task = doc.data();
    if (!task.dueDate || !task.dueTime || !task.telegramChatId) return;

    const taskDateTime = new Date(`${task.dueDate}T${task.dueTime}`);
    
    if (taskDateTime <= now) {
      const message = `🔔 Напоминание: ${task.title}\n\n${task.note || ''}`;
      
      const fetchPromise = fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: task.telegramChatId,
          text: message
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          console.log(`Reminder sent for task ${doc.id}`);
          return doc.ref.update({ reminded: true });
        } else {
          console.error(`Failed to send reminder for task ${doc.id}:`, data);
        }
      })
      .catch(err => console.error(`Error sending to Telegram for task ${doc.id}:`, err));

      promises.push(fetchPromise);
    }
  });

  await Promise.all(promises);
});
