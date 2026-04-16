import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function TaskList() {
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

  const activeTasks = tasks.filter(t => !t.done);
  const completedTasks = tasks.filter(t => t.done);

  return (
    <div className="task-list">
      {activeTasks.length > 0 && <div className="list-title">Активные</div>}
      {activeTasks.map(task => {
        const overdue = isOverdue(task.dueDate, task.dueTime);
        return (
          <div key={task.id} className={`task-card ${overdue ? 'overdue' : ''}`}>
            <div className="task-card-header">
              <div className="task-title">{task.title}</div>
              <div className="task-actions">
                <input 
                  type="checkbox" 
                  checked={task.done} 
                  onChange={() => toggleDone(task)}
                  className="checkbox-input" 
                  title="Выполнено" 
                />
                <button onClick={() => deleteTask(task.id)} className="delete-btn" title="Удалить">✕</button>
              </div>
            </div>
            <div className="task-meta-info">
              {formatDate(task.dueDate)} {task.dueTime} • ID: {maskChatId(task.telegramChatId)}
            </div>
            {task.note && <div className="task-note-preview">{task.note}</div>}
          </div>
        );
      })}
      
      {completedTasks.length > 0 && (
        <>
          <div className="list-title" style={{ marginTop: '24px' }}>Завершенные</div>
          {completedTasks.map(task => (
            <div key={task.id} className="task-card done">
              <div className="task-card-header">
                <div className="task-title">{task.title}</div>
                <div className="task-actions">
                  <input 
                    type="checkbox" 
                    checked={task.done} 
                    onChange={() => toggleDone(task)}
                    className="checkbox-input" 
                    title="Восстановить" 
                  />
                  <button onClick={() => deleteTask(task.id)} className="delete-btn" title="Удалить">✕</button>
                </div>
              </div>
              <div className="task-meta-info">
                {formatDate(task.dueDate)} {task.dueTime} • ID: {maskChatId(task.telegramChatId)}
              </div>
              {task.note && <div className="task-note-preview">{task.note}</div>}
            </div>
          ))}
        </>
      )}
      
      {tasks.length === 0 && <p className="empty-state">Нет задач.</p>}
    </div>
  );
}
