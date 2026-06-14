import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="w-full bg-white/10 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center z-50">
      {/* Logo and Brand Name */}
      <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition">
        <img src="/magic-maths-logo.png" alt="Maths Wizard Logo" className="w-10 h-10 object-contain" />
        <span className="text-xl font-bold tracking-wider text-white bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
          MATHS WIZARD
        </span>
      </Link>

      {/* User Actions */}
      {user && (
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Welcome,</span>
            <span className="text-white font-semibold text-sm bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              {user.name}
            </span>
          </div>
          
          <button
            onClick={logout}
            className="rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-medium px-5 py-2 hover:scale-105 transition transform active:scale-95 shadow-lg shadow-purple-500/20"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;