import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Temporary placeholder for Home while we complete the dashboard next
const TemporaryHome = () => (
  <div className="flex flex-col items-center justify-center min-h-[calc(100vh-73px)] text-white">
    <h1 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
      Welcome to the Arena!
    </h1>
    <p className="text-gray-400">Your core authentication and routing engine is working perfectly.</p>
  </div>
);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0f0f1a] text-white">
        <Navbar />
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Gameplay Dashboard Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <TemporaryHome />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;