import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  // If the user is not logged in, redirect them straight to the login screen
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render the requested page component safely
  return children;
};

export default ProtectedRoute;