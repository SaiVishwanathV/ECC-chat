import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import Chats from './pages/Chats';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';

import { getUserProfile } from './services/firestore';

export default function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profile = await getUserProfile(currentUser.uid);
          setUserProfile(profile);
        } catch {
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isVerifiedUser = user && (user.emailVerified || userProfile?.emailVerified || userProfile?.status === 'active');

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={isVerifiedUser ? <Navigate to="/chats" replace /> : <Landing />}
        />
        <Route
          path="/login"
          element={isVerifiedUser ? <Navigate to="/chats" replace /> : <Login />}
        />
        <Route
          path="/signup"
          element={isVerifiedUser ? <Navigate to="/chats" replace /> : <Signup />}
        />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Protected Routes */}
        <Route
          path="/chats"
          element={
            <ProtectedRoute user={user} userProfile={userProfile} loading={loading}>
              <Chats user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute user={user} userProfile={userProfile} loading={loading}>
              <Settings user={user} />
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
