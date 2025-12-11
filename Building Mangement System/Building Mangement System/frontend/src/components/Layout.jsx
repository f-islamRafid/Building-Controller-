import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <i className="fas fa-building"></i>
            <span>Building Management System</span>
          </div>
          <div className="nav-menu">
            <div className="nav-user">
              <i className="fas fa-user-circle"></i>
              <span>{user?.full_name || 'User'}</span>
              {isAdmin && <span className="badge-admin">Admin</span>}
            </div>
            <button onClick={handleLogout} className="logout-btn">
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;

