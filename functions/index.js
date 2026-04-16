const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const telegramBotToken = defineSecret("TELEGRAM_BOT_TOKEN");

exports.sendReminders = onSchedule({
  schedule: "every 1 minutes",
  secrets: [telegramBotToken]
}, async (event) => {
  const now = new Date();
  const currentDateTime = now.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"

  try {
    const tasksSnapshot = await db.collection("tasks")
      .where("done", "==", false)
      .where("reminded", "==", false)
      .get();

    if (tasksSnapshot.empty) {
      console.log("No tasks to remind.");
      return;
    }

    const promises = [];

    tasksSnapshot.forEach((doc) => {
      const task = doc.data();
      
      const taskDateTime = `${task.dueDate}T${task.dueTime}`;

      if (taskDateTime <= currentDateTime) {
        const token = telegramBotToken.value();
        const chatId = task.telegramChatId;
        const text = `⏰ Напоминание: ${task.title}\n${task.note || ''}\nВремя: ${task.dueDate} ${task.dueTime}`;

        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        
        const sendPromise = fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: text
          })
        })
        .then(async (response) => {
          if (response.ok) {
            await doc.ref.update({ reminded: true });
            console.log(`Successfully reminded task ${doc.id}`);
          } else {
            console.error(`Failed to send Telegram message for task ${doc.id}: ${response.statusText}`);
          }
        })
        .catch((error) => {
          console.error(`Error sending Telegram message for task ${doc.id}:`, error);
        });

        promises.push(sendPromise);
      }
    });

    await Promise.allSettled(promises);
    console.log("Finished processing reminders.");
  } catch (error) {
    console.error("Error querying tasks:", error);
  }
});
