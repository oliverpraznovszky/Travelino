import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import MainPage from './pages/MainPage';
import AdminPage from './pages/AdminPage';
import Login from './components/Login';
import Register from './components/Register';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="text-center p-5">Töltés...</div>;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  if (adminOnly && !isAdmin()) {
    return <Navigate to="/" />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              <ProtectedRoute>
                <MainPage />
              </ProtectedRoute>
            ) : (
              <div className="container mt-5">
                <div className="row">
                  <div className="col-md-6">
                    <Login />
                  </div>
                  <div className="col-md-6">
                    <Register />
                  </div>
                </div>
              </div>
            )
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
