import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function TaskList({ onSelectTask, selectedTaskId }) {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'tasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort: undone first, then by dueDate + dueTime ascending
      tasksData.sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        const dateTimeA = `${a.dueDate}T${a.dueTime}`;
        const dateTimeB = `${b.dueDate}T${b.dueTime}`;
        return dateTimeA.localeCompare(dateTimeB);
      });
      
      setTasks(tasksData);
    }, (error) => {
      console.error("Error fetching tasks:", error);
    });

    return () => unsubscribe();
  }, []);

  const toggleDone = async (task) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t));
    try {
      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, { done: !task.done });
    } catch (error) {
      console.error("Error updating task:", error);
      // Revert on error
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: task.done } : t));
    }
  };

  const deleteTask = async (id) => {
    // Optimistic update
    const previousTasks = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (error) {
      console.error("Error deleting task:", error);
      // Revert on error
      setTasks(previousTasks);
    }
  };

  const isOverdue = (dueDate, dueTime) => {
    const now = new Date();
    const taskDate = new Date(`${dueDate}T${dueTime}`);
    return taskDate < now;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [yyyy, mm, dd] = dateStr.split('-');
    return `${dd}.${mm}.${yyyy}`;
  };

  const maskChatId = (chatId) => {
    if (!chatId) return '';
    return `***${chatId.slice(-4)}`;
  };

  const categorizeTasks = (tasksList) => {
    const groups = {
      overdue: [],
      today: [],
      tomorrow: [],
      upcoming: [],
      completed: []
    };

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`;

    tasksList.forEach(task => {
      if (task.done) {
        groups.completed.push(task);
        return;
      }

      if (!task.dueDate || !task.dueTime) {
        groups.upcoming.push(task);
        return;
      }

      const taskDateTime = new Date(`${task.dueDate}T${task.dueTime}`);
      if (taskDateTime < now) {
        groups.overdue.push(task);
      } else if (task.dueDate === todayStr) {
        groups.today.push(task);
      } else if (task.dueDate === tomorrowStr) {
        groups.tomorrow.push(task);
      } else {
        groups.upcoming.push(task);
      }
    });

    return groups;
  };

  const groupedTasks = categorizeTasks(tasks);

  const renderTaskCard = (task, isOverdue = false) => (
    <div 
      key={task.id} 
      className={`task-card ${isOverdue ? 'overdue' : ''} ${task.done ? 'done' : ''} ${selectedTaskId === task.id ? 'selected' : ''}`}
      onClick={() => onSelectTask(task)}
    >
      <div className="task-card-header">
        <div className="task-title">{task.title}</div>
        <div className="task-actions">
          <input 
            type="checkbox" 
            checked={task.done} 
            onChange={(e) => {
              e.stopPropagation();
              toggleDone(task);
            }}
            className="checkbox-input" 
            title={task.done ? "Восстановить" : "Выполнено"} 
          />
          <button 
            onClick={(e) => {
              e.stopPropagation();
              deleteTask(task.id);
              if (selectedTaskId === task.id) onSelectTask(null);
            }} 
            className="delete-btn" 
            title="Удалить"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="task-meta-info">
        {formatDate(task.dueDate)} {task.dueTime} • ID: {maskChatId(task.telegramChatId)}
      </div>
      {task.note && <div className="task-note-preview">{task.note}</div>}
    </div>
  );

  return (
    <div className="task-list">
      {groupedTasks.overdue.length > 0 && (
        <>
          <div className="list-title">Просроченные</div>
          {groupedTasks.overdue.map(task => renderTaskCard(task, true))}
        </>
      )}

      {groupedTasks.today.length > 0 && (
        <>
          <div className="list-title" style={{ marginTop: groupedTasks.overdue.length ? '24px' : '0' }}>Сегодня</div>
          {groupedTasks.today.map(task => renderTaskCard(task))}
        </>
      )}

      {groupedTasks.tomorrow.length > 0 && (
        <>
          <div className="list-title" style={{ marginTop: (groupedTasks.overdue.length || groupedTasks.today.length) ? '24px' : '0' }}>Завтра</div>
          {groupedTasks.tomorrow.map(task => renderTaskCard(task))}
        </>
      )}

      {groupedTasks.upcoming.length > 0 && (
        <>
          <div className="list-title" style={{ marginTop: (groupedTasks.overdue.length || groupedTasks.today.length || groupedTasks.tomorrow.length) ? '24px' : '0' }}>Предстоящие</div>
          {groupedTasks.upcoming.map(task => renderTaskCard(task))}
        </>
      )}
      
      {groupedTasks.completed.length > 0 && (
        <>
          <div className="list-title" style={{ marginTop: '24px' }}>Завершенные</div>
          {groupedTasks.completed.map(task => renderTaskCard(task))}
        </>
      )}
      
      {tasks.length === 0 && <p className="empty-state">Нет задач.</p>}
    </div>
  );
}
