const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendtelegramreminders = onSchedule("every 1 minutes", async (event) => {
  const db = admin.firestore();
  const now = new Date();
  
  try {
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
      console.error('CRITICAL: TELEGRAM_BOT_TOKEN environment variable is not set.');
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
        .then(async (res) => {
          const data = await res.json();
          if (res.ok && data.ok) {
            console.log(`Reminder sent successfully for task ${doc.id}`);
            return doc.ref.update({ reminded: true });
          } else {
            console.error(`Telegram API error for task ${doc.id}:`, data);
            // If the chat ID is invalid or bot is blocked, we might want to mark it as reminded to avoid infinite loops
            if (data.error_code === 400 || data.error_code === 403) {
               console.warn(`Marking task ${doc.id} as reminded due to unrecoverable Telegram error (e.g. blocked bot or invalid chat ID).`);
               return doc.ref.update({ reminded: true });
            }
          }
        })
        .catch(err => {
          console.error(`Network or execution error sending to Telegram for task ${doc.id}:`, err);
        });

        promises.push(fetchPromise);
      }
    });

    await Promise.allSettled(promises);
    console.log(`Processed ${promises.length} reminders.`);
  } catch (error) {
    console.error('Error executing sendtelegramreminders function:', error);
  }
});
