import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
export default function Puzzle16() {
  const navigate = useNavigate();
  useEffect(() => navigate('/game/sliding'), []);
  return null;
}