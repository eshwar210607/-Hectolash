import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import ComputerMenu from './pages/ComputerMenu';
import MultiplayerMenu from './pages/MultiplayerMenu';
import HectocSolo from './pages/games/HectocSolo';
import Calculator from './pages/games/Calculator';

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', background: '#0f0f1a', color: 'white' }}>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/computer" element={<ProtectedRoute><ComputerMenu /></ProtectedRoute>} />
          <Route path="/multiplayer" element={<ProtectedRoute><MultiplayerMenu /></ProtectedRoute>} />
          <Route path="/game/hectoc-solo" element={<ProtectedRoute><HectocSolo /></ProtectedRoute>} />
          <Route path="/game/calculator" element={<ProtectedRoute><Calculator /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;