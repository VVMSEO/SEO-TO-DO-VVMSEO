import { useState } from 'react';
import TaskList from './components/TaskList';
import { db } from './firebase';
import { Plus, Search, Inbox, Calendar, CalendarDays, BarChart2, Hash, Ghost, Hash as HashIcon, Activity } from 'lucide-react';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('inbox'); // 'inbox', 'today', 'upcoming', 'search', 'project'
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentProject, setCurrentProject] = useState(null);
  const [triggerAddTask, setTriggerAddTask] = useState(0);

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
            <li className="nav-item add-task" onClick={() => { setCurrentView('inbox'); setTriggerAddTask(prev => prev + 1); }}>
              <Plus size={18} className="icon" />
              <span>Добавить задачу</span>
            </li>
            <li className={`nav-item ${currentView === 'search' ? 'active' : ''}`} onClick={() => setCurrentView('search')}>
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
          </ul>

          <div className="sidebar-section">
            <div className="sidebar-section-title">
              <span>Метки</span>
            </div>
            <ul className="nav-list" style={{ padding: 0 }}>
              {['kovry-karat.ru', 'лягушка'].map(tag => (
                 <li key={tag} className={`nav-item ${currentView === 'tag' && currentProject === tag ? 'active' : ''}`} onClick={() => { setCurrentView('tag'); setCurrentProject(tag); }}>
                   <HashIcon size={16} className="icon" />
                   <span>{tag}</span>
                 </li>
              ))}
            </ul>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">
              <span>Мои проекты</span>
            </div>
            <ul className="nav-list" style={{ padding: 0 }}>
              {['SEO', 'Личные дела'].map(proj => (
                <li key={proj} className={`nav-item ${currentView === 'project' && currentProject === proj ? 'active' : ''}`} onClick={() => { setCurrentView('project'); setCurrentProject(proj); }}>
                  <HashIcon size={16} className="icon" />
                  <span>{proj}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}

      <main className="main-content">
        <div className="topbar">
          {currentView === 'search' && (
            <input 
              type="text" 
              placeholder="Поиск задач..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="add-task-input-title"
              style={{ flex: 1, margin: 0, padding: '8px 16px', background: 'var(--bg-sidebar)', borderRadius: '6px' }}
              autoFocus
            />
          )}
          <div className="topbar-action">
            <Activity size={16} />
            <span>Отображение</span>
          </div>
        </div>
        <div className="view-container">
          <h1 className="view-header">
            {currentView === 'inbox' && 'Входящие'}
            {currentView === 'today' && 'Сегодня'}
            {currentView === 'upcoming' && 'Предстоящее'}
            {currentView === 'search' && 'Поиск'}
            {currentView === 'project' && `Проект: ${currentProject}`}
            {currentView === 'tag' && `Метка: ${currentProject}`}
          </h1>
          <TaskList 
            currentView={currentView} 
            searchQuery={searchQuery} 
            currentProject={currentProject} 
            triggerAddTask={triggerAddTask}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
