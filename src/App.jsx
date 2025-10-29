import { Outlet } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Estilos para el layout principal
const mainContentStyles = {
  marginLeft: '240px',
};

const pageWrapperStyles = {
  padding: '1.5rem',
};

function App() {
  return (
    <div className="app-container">
      <Sidebar />
      <div style={mainContentStyles}>
        <Header />
        <main style={pageWrapperStyles}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default App;