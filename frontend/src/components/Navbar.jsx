// src/components/Navbar.jsx
import { useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  // Helper to format the path into a readable title
  const getPageTitle = () => {
    if (location.pathname === '/') return 'Dashboard';
    const path = location.pathname.substring(1);
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8 z-10 relative border-b border-gray-200">
      <h1 className="text-xl md:text-2xl font-extrabold text-blue-900 tracking-tight">
        Medical Billing System
      </h1>
      
      <div className="flex items-center space-x-4">
        {/* Dynamic Page Indicator */}
        <span className="hidden md:inline-block text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
          {getPageTitle()}
        </span>
        
        {/* Mock User Avatar */}
        <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
          A
        </div>
      </div>
    </header>
  );
};

export default Navbar;