import { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar, Hash } from 'lucide-react';

export default function AddTask({ selectedTask, onClose }) {
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
      setTitle('');
      setNote('');
      setError('');
      
      const savedChatId = localStorage.getItem('telegramChatId');
      if (savedChatId) {
        setTelegramChatId(savedChatId);
      }
      
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setDueDate(`${yyyy}-${mm}-${dd}`);

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
      setError('Заголовок обязателен');
      return;
    }

    if (telegramChatId.trim()) {
      localStorage.setItem('telegramChatId', telegramChatId);
    }

    try {
      if (selectedTask) {
        const taskRef = doc(db, 'tasks', selectedTask.id);
        await updateDoc(taskRef, {
          title: title.trim(),
          note: note.trim(),
          dueDate,
          dueTime,
          telegramChatId: telegramChatId.trim(),
          ...(selectedTask.dueDate !== dueDate || selectedTask.dueTime !== dueTime ? { reminded: false } : {})
        });
      } else {
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
      }
      if (onClose) onClose();
    } catch (err) {
      console.error('Error saving task: ', err);
      setError('Не удалось сохранить задачу');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.name !== 'note') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      if (onClose) onClose();
    }
  };

  return (
    <div className="add-task-form-container">
      <input
        type="text"
        placeholder="Название задачи"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        className="add-task-input-title"
      />
      <textarea
        name="note"
        placeholder="Описание"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="add-task-input-desc"
      />
      <div className="add-task-meta">
        <label className="add-task-meta-item" title="Дата">
          <Calendar size={14} />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </label>
        <label className="add-task-meta-item" title="Время">
          <input
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
          />
        </label>
        <label className="add-task-meta-item" title="Telegram Chat ID">
          <Hash size={14} />
          <input
            type="text"
            placeholder="Telegram ID"
            value={telegramChatId}
            onChange={(e) => {
              setTelegramChatId(e.target.value);
              localStorage.setItem('telegramChatId', e.target.value);
            }}
          />
        </label>
      </div>
      {error && <div style={{ color: 'var(--accent-red)', fontSize: '0.8rem', marginBottom: '8px' }}>{error}</div>}
      <div className="add-task-actions">
        <button type="button" className="btn-cancel" onClick={onClose}>Отмена</button>
        <button type="button" className="btn-submit" onClick={handleSubmit} disabled={!title.trim()}>
          {selectedTask ? 'Сохранить' : 'Добавить задачу'}
        </button>
      </div>
    </div>
  );
}
