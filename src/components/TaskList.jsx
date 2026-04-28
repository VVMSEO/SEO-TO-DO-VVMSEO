import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar, Plus, Maximize2, MoreHorizontal, Check } from 'lucide-react';
import AddTask from './AddTask'; // Create an inline version

export default function TaskList({ currentView }) {
  const [tasks, setTasks] = useState([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'tasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksData);
    }, (error) => {
      console.error("Error fetching tasks:", error);
    });

    return () => unsubscribe();
  }, []);

  const toggleDone = async (task) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t));
    try {
      await updateDoc(doc(db, 'tasks', task.id), { done: !task.done });
    } catch (error) {
      console.error("Error updating task:", error);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: task.done } : t));
    }
  };

  const deleteTask = async (id) => {
    const previousTasks = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (error) {
      console.error("Error deleting task:", error);
      setTasks(previousTasks);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['янв', 'февр', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сент', 'окт', 'нояб', 'дек'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  const isOverdue = (task) => {
    if (!task.dueDate || !task.dueTime) return false;
    const now = new Date();
    const taskDate = new Date(`${task.dueDate}T${task.dueTime}`);
    return taskDate < now && !task.done;
  };

  const filterTasks = () => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    return tasks.filter(task => {
      if (task.done) return false; // Hide done tasks by default for a cleaner look
      
      switch (currentView) {
        case 'inbox':
          return true; // Show all active
        case 'today':
          return task.dueDate === todayStr || isOverdue(task);
        case 'upcoming':
          return task.dueDate > todayStr;
        default:
          return true;
      }
    });
  };

  const filteredTasks = filterTasks();

  return (
    <div className="task-list">
      {filteredTasks.map(task => {
        const overdue = isOverdue(task);
        
        if (editingTaskId === task.id) {
          return (
            <AddTask 
              key={task.id} 
              selectedTask={task} 
              onClose={() => setEditingTaskId(null)} 
            />
          );
        }

        return (
          <div key={task.id} className={`task-card ${overdue ? 'overdue' : ''} ${task.done ? 'done' : ''}`} onClick={() => setEditingTaskId(task.id)}>
            <div className="task-checkbox-container" onClick={(e) => { e.stopPropagation(); toggleDone(task); }}>
              <div className={`task-checkbox ${task.done ? 'done' : ''}`}>
                {task.done && <Check size={12} />}
              </div>
            </div>
            
            <div className="task-content">
              <div className="task-title">{task.title}</div>
              {task.note && <div className="task-note-preview">{task.note}</div>}
              
              <div className="task-meta-info">
                {task.dueDate && (
                  <span className={`task-meta-item ${overdue ? 'overdue' : ''}`}>
                    <Calendar size={12} />
                    {formatDate(task.dueDate)} {task.dueTime ? task.dueTime : ''}
                  </span>
                )}
                {task.telegramChatId && (
                  <span className="task-meta-item" style={{ color: 'var(--text-muted)' }}>
                    ID: ***{task.telegramChatId.slice(-4)}
                  </span>
                )}
              </div>
            </div>

            <div className="task-actions">
              <MoreHorizontal size={16} className="task-action" onClick={(e) => { e.stopPropagation(); /* Menu placeholder */ }} />
              <button 
                onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} 
                className="btn-cancel" 
                style={{ padding: '4px' }}
                title="Удалить"
              >✕</button>
            </div>
          </div>
        );
      })}

      {!isAddingTask ? (
        <div className="inline-add-btn" onClick={() => setIsAddingTask(true)}>
          <Plus size={16} />
          <span>Добавить задачу</span>
        </div>
      ) : (
        <AddTask onClose={() => setIsAddingTask(false)} />
      )}
    </div>
  );
}
