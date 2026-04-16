import AddTask from './components/AddTask';
import TaskList from './components/TaskList';
import { db } from './firebase';
import './App.css';

function App() {
  if (!db) {
    return (
      <div className="app-container offline">
        <header className="header">
          <h1>Заметки</h1>
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
          <h2>Заметки</h2>
          <button type="submit" form="add-task-form" className="new-note-btn">
            + Добавить задачу
          </button>
        </div>
        <TaskList />
      </aside>
      <main className="main-content">
        <AddTask />
      </main>
    </div>
  );
}

export default App;
