import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import ComputerMenu from './pages/ComputerMenu';
import MultiplayerMenu from './pages/MultiplayerMenu';
import OnlineDuel from './pages/games/OnlineDuel';
import HectocSolo from './pages/games/HectocSolo';
import Calculator from './pages/games/Calculator';
import Sliding from './pages/games/Sliding';
import HectocMulti from './pages/games/HectocMulti';
import CalculatorMulti from './pages/games/CalculatorMulti';
import SlidingMulti from './pages/games/SlidingMulti';

// 🌟 IMPORT YOUR NEW LIVE DUELING MULTIPLAYER LOBBY HUB
import OnlineLobby from './pages/OnlineLobby';


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
          <Route path="/game/sliding" element={<ProtectedRoute><Sliding /></ProtectedRoute>} />
          <Route path="/game/hectoc-multi" element={<ProtectedRoute><HectocMulti /></ProtectedRoute>} />
          <Route path="/game/calculator-multi" element={<ProtectedRoute><CalculatorMulti /></ProtectedRoute>} />
          <Route path="/game/sliding-multi" element={<ProtectedRoute><SlidingMulti /></ProtectedRoute>} />
          
          {/* 🌟 NEW ROUTE ENTRY: MOUNTS YOUR DYNAMIC WEB SOCKET MATCHMAKING CONTROLLER */}
          <Route path="/game/online-lobby" element={<ProtectedRoute><OnlineLobby /></ProtectedRoute>} />
          <Route path="/game/online-duel/:roomId" element={<ProtectedRoute><OnlineDuel /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;