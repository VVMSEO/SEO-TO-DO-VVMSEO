import { useState } from 'react';
import AddTask from './components/AddTask';
import TaskList from './components/TaskList';
import { db } from './firebase';
import './App.css';

function App() {
  const [selectedTask, setSelectedTask] = useState(null);

  if (!db) {
    return (
      <div className="app-container offline">
        <header className="header">
          <h1>СПИСОК ДЕЛ</h1>
          <div style={{ fontSize: '0.8rem', color: '#ff4d4d' }}>● System Offline</div>
        </header>
        <div style={{ padding: '20px', color: 'var(--text-secondary)', textAlign: 'center' }}>
          <p>Firebase configuration is missing.</p>
          <p style={{ marginTop: '10px' }}>Please configure your Firebase environment variables in the AI Studio Settings panel to use this app.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>СПИСОК ДЕЛ</h2>
          <button 
            type="button" 
            className="new-note-btn"
            onClick={() => setSelectedTask(null)}
          >
            + Добавить задачу
          </button>
        </div>
        <TaskList onSelectTask={setSelectedTask} selectedTaskId={selectedTask?.id} />
      </aside>
      <main className="main-content">
        <AddTask selectedTask={selectedTask} onClearSelection={() => setSelectedTask(null)} />
      </main>
    </div>
  );
}

export default App;
