import { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function AddTask({ selectedTask, onClearSelection }) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedTask) {
      setTitle(selectedTask.title || '');
      setNote(selectedTask.note || '');
      setDueDate(selectedTask.dueDate || '');
      setDueTime(selectedTask.dueTime || '');
      setTelegramChatId(selectedTask.telegramChatId || localStorage.getItem('telegramChatId') || '');
      setError('');
    } else {
      // Reset to default "Add" state
      setTitle('');
      setNote('');
      setError('');
      
      const savedChatId = localStorage.getItem('telegramChatId');
      if (savedChatId) {
        setTelegramChatId(savedChatId);
      }
      
      // Default date to today
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setDueDate(`${yyyy}-${mm}-${dd}`);

      // Default time to current + 30 min
      const future = new Date(today.getTime() + 30 * 60000);
      const hh = String(future.getHours()).padStart(2, '0');
      const min = String(future.getMinutes()).padStart(2, '0');
      setDueTime(`${hh}:${min}`);
    }
  }, [selectedTask]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!telegramChatId.trim()) {
      setError('Telegram Chat ID is required');
      return;
    }

    localStorage.setItem('telegramChatId', telegramChatId);

    try {
      if (selectedTask) {
        // Update existing task
        const taskRef = doc(db, 'tasks', selectedTask.id);
        await updateDoc(taskRef, {
          title: title.trim(),
          note: note.trim(),
          dueDate,
          dueTime,
          telegramChatId: telegramChatId.trim(),
          // If date/time changed, we might want to reset reminded status so it triggers again
          ...(selectedTask.dueDate !== dueDate || selectedTask.dueTime !== dueTime ? { reminded: false } : {})
        });
        onClearSelection(); // Deselect after saving
      } else {
        // Create new task
        await addDoc(collection(db, 'tasks'), {
          title: title.trim(),
          note: note.trim(),
          dueDate,
          dueTime,
          telegramChatId: telegramChatId.trim(),
          done: false,
          reminded: false,
          createdAt: serverTimestamp()
        });
        // Reset form
        setTitle('');
        setNote('');
      }
    } catch (err) {
      console.error('Error saving task: ', err);
      setError('Failed to save task');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="add-task-section">
      <form id="add-task-form" onSubmit={handleSubmit} className="add-task-form">
        <input
          type="text"
          placeholder="Заголовок задачи..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="title-input"
        />
        
        <textarea
          placeholder="Текст заметки..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="note-textarea"
        />
        
        <div className="meta-inputs">
          <div className="form-group">
            <label>Дата</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              onKeyDown={handleKeyDown}
              className="meta-input"
            />
          </div>
          <div className="form-group">
            <label>Время</label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              onKeyDown={handleKeyDown}
              className="meta-input"
            />
          </div>
          <div className="form-group">
            <label>Telegram Chat ID</label>
            <input
              type="text"
              placeholder="ID чата"
              value={telegramChatId}
              onChange={(e) => {
                setTelegramChatId(e.target.value);
                localStorage.setItem('telegramChatId', e.target.value);
              }}
              onKeyDown={handleKeyDown}
              className="meta-input"
            />
          </div>
        </div>
        {error && <span className="error-text">{error}</span>}
        <button type="submit" className="add-btn">Сохранить задачу</button>
      </form>
    </div>
  );
}
