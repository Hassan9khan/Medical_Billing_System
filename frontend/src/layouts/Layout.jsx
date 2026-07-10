// src/layouts/Layout.jsx
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const Layout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper to highlight the active menu item
  const isActive = (path) => location.pathname === path ? 'bg-blue-800' : 'hover:bg-blue-700';

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-blue-900 text-white flex flex-col shadow-lg">
        <div className="p-6 text-2xl font-bold border-b border-blue-800 text-center tracking-wider">
          MedBill+
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <Link to="/" className={`block py-3 px-4 rounded transition-colors ${isActive('/')}`}>Dashboard</Link>
          <Link to="/patients" className={`block py-3 px-4 rounded transition-colors ${isActive('/patients')}`}>Patients</Link>
          <Link to="/doctors" className={`block py-3 px-4 rounded transition-colors ${isActive('/doctors')}`}>Doctors</Link>
          <Link to="/services" className={`block py-3 px-4 rounded transition-colors ${isActive('/services')}`}>Services</Link>
          <Link to="/billing" className={`block py-3 px-4 rounded transition-colors ${isActive('/billing')}`}>Billing</Link>
          <Link to="/reports" className={`block py-3 px-4 rounded transition-colors ${isActive('/reports')}`}>Reports</Link>
        </nav>
        <div className="p-4 border-t border-blue-800">
          <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 py-2 rounded font-semibold transition-colors">
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm h-16 flex items-center px-8">
          <h1 className="text-xl font-semibold text-gray-700 capitalize">
            {location.pathname === '/' ? 'Dashboard' : location.pathname.substring(1)}
          </h1>
        </header>

        <Navbar />
        
        {/* Dynamic Page Content (The Outlet) */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;