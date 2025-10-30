import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar.jsx';
import Header from './components/layout/Header.jsx';

export default function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="app-layout">
      {/* --- EL OVERLAY --- */}
      {/* Se muestra solo si la sidebar está abierta. Al hacer clic en él, se cierra. */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'is-active' : ''}`}
        onClick={closeSidebar}
      />

      <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />
      
      <div className="main-content">
        <Header onMenuClick={toggleSidebar} />
        <main style={{ padding: '1.5rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}