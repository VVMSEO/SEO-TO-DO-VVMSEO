import { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar, Hash } from 'lucide-react';

export default function AddTask({ selectedTask, onClose }) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [project, setProject] = useState('');
  const [tag, setTag] = useState('');
  const [error, setError] = useState('');
  const [showReminderParams, setShowReminderParams] = useState(false);

  useEffect(() => {
    if (selectedTask) {
      setTitle(selectedTask.title || '');
      setNote(selectedTask.note || '');
      setDueDate(selectedTask.dueDate || '');
      setDueTime(selectedTask.dueTime || '');
      setReminderDate(selectedTask.reminderDate || '');
      setReminderTime(selectedTask.reminderTime || '');
      setTelegramChatId(selectedTask.telegramChatId || localStorage.getItem('telegramChatId') || '');
      setProject(selectedTask.project || '');
      setTag(selectedTask.tag || '');
      setShowReminderParams(!!(selectedTask.reminderDate || selectedTask.reminderTime));
      setError('');
    } else {
      setTitle('');
      setNote('');
      setError('');
      setShowReminderParams(false);
      setReminderDate('');
      setReminderTime('');
      setProject('');
      setTag('');
      
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

    const taskData = {
      title: title.trim(),
      note: note.trim(),
      dueDate,
      dueTime,
      telegramChatId: telegramChatId.trim(),
      project: project.trim(),
      tag: tag.trim()
    };

    if (showReminderParams && reminderDate && reminderTime) {
      taskData.reminderDate = reminderDate;
      taskData.reminderTime = reminderTime;
    } else {
      taskData.reminderDate = null;
      taskData.reminderTime = null;
    }

    try {
      if (selectedTask) {
        const taskRef = doc(db, 'tasks', selectedTask.id);
        const hasTimeChanged = 
          selectedTask.dueDate !== dueDate || 
          selectedTask.dueTime !== dueTime || 
          selectedTask.reminderDate !== taskData.reminderDate ||
          selectedTask.reminderTime !== taskData.reminderTime;
          
        await updateDoc(taskRef, {
          ...taskData,
          ...(hasTimeChanged ? { reminded: false } : {})
        });
      } else {
        await addDoc(collection(db, 'tasks'), {
          ...taskData,
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
        <label className="add-task-meta-item" title="Дата дедлайна">
          <Calendar size={14} />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </label>
        <label className="add-task-meta-item" title="Время дедлайна">
          <input
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
          />
        </label>
        
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', gap: '8px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={showReminderParams}
              onChange={(e) => setShowReminderParams(e.target.checked)}
            />
            Свое время напоминания
          </label>
        </div>
      </div>

      {showReminderParams && (
        <div className="add-task-meta" style={{ marginTop: '-4px' }}>
          <label className="add-task-meta-item" title="Дата напоминания" style={{ borderColor: 'var(--accent-red)' }}>
            <Calendar size={14} color="var(--accent-red)" />
            <input
              type="date"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
            />
          </label>
          <label className="add-task-meta-item" title="Время напоминания" style={{ borderColor: 'var(--accent-red)' }}>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
            />
          </label>
        </div>
      )}

      <div className="add-task-meta">
        <label className="add-task-meta-item" title="Telegram Chat ID" style={{ flex: 1 }}>
          <Hash size={14} />
          <input
            type="text"
            placeholder="Telegram ID"
            value={telegramChatId}
            onChange={(e) => {
              setTelegramChatId(e.target.value);
              localStorage.setItem('telegramChatId', e.target.value);
            }}
            style={{ width: '100%' }}
          />
        </label>
        <label className="add-task-meta-item" title="Метка" style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Метка"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            style={{ width: '100%' }}
          />
        </label>
        <label className="add-task-meta-item" title="Проект" style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Проект"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            style={{ width: '100%' }}
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
