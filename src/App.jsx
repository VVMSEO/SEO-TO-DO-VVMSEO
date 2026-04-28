import { useState } from 'react';
import TaskList from './components/TaskList';
import { db } from './firebase';
import { Plus, Search, Inbox, Calendar, CalendarDays, BarChart2, Hash, Ghost, Hash as HashIcon, Activity } from 'lucide-react';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('inbox'); // 'inbox', 'today', 'upcoming'
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  if (!db) {
    return (
      <div className="app-container offline">
        <div style={{ padding: '40px', color: 'var(--text-secondary)', textAlign: 'center' }}>
          <h2>SEO TO DO | VVMSEO</h2>
          <p>Firebase configuration is missing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {isSidebarOpen && (
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">S</div>
              <span>SEO</span>
            </div>
            <div className="sidebar-actions">
              <Activity size={16} />
              <Search size={16} />
            </div>
          </div>
          
          <ul className="nav-list">
            <li className="nav-item add-task">
              <Plus size={18} className="icon" />
              <span>Добавить задачу</span>
            </li>
            <li className="nav-item">
              <Search size={18} className="icon" />
              <span>Поиск</span>
            </li>
            <li className={`nav-item ${currentView === 'inbox' ? 'active' : ''}`} onClick={() => setCurrentView('inbox')}>
              <Inbox size={18} className="icon" style={{ color: '#246fe0' }} />
              <span>Входящие</span>
            </li>
            <li className={`nav-item ${currentView === 'today' ? 'active' : ''}`} onClick={() => setCurrentView('today')}>
              <Calendar size={18} className="icon" style={{ color: '#058527' }} />
              <span>Сегодня</span>
            </li>
            <li className={`nav-item ${currentView === 'upcoming' ? 'active' : ''}`} onClick={() => setCurrentView('upcoming')}>
              <CalendarDays size={18} className="icon" style={{ color: '#692fc2' }} />
              <span>Предстоящее</span>
            </li>
            <li className="nav-item">
              <Hash size={18} className="icon" style={{ color: '#eb8909' }} />
              <span>Фильтры и метки</span>
            </li>
            <li className="nav-item">
              <BarChart2 size={18} className="icon" style={{ color: '#246fe0' }} />
              <span>Отчеты</span>
            </li>
          </ul>

          <div className="sidebar-section">
            <div className="sidebar-section-title">
              <span>Избранное</span>
            </div>
            <ul className="nav-list" style={{ padding: 0 }}>
              <li className="nav-item">
                <HashIcon size={16} className="icon" />
                <span>kovry-karat.ru</span>
              </li>
              <li className="nav-item">
                <Ghost size={16} className="icon" style={{ color: '#888' }} />
                <span>лягушка</span>
              </li>
            </ul>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">
              <span>Мои проекты</span>
            </div>
            <ul className="nav-list" style={{ padding: 0 }}>
              <li className="nav-item">
                <HashIcon size={16} className="icon" />
                <span>SEO</span>
              </li>
              <li className="nav-item">
                <HashIcon size={16} className="icon" />
                <span>Личные дела</span>
              </li>
            </ul>
          </div>
        </aside>
      )}

      <main className="main-content">
        <div className="topbar">
          <div className="topbar-action">
            <Activity size={16} />
            <span>Отображение</span>
          </div>
        </div>
        <div className="view-container">
          <h1 className="view-header">
            {currentView === 'inbox' ? 'Входящие' : currentView === 'today' ? 'Сегодня' : 'Предстоящее'}
          </h1>
          <TaskList currentView={currentView} />
        </div>
      </main>
    </div>
  );
}

export default App;
