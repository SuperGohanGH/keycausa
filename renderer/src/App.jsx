import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import PasswordsPage from "./pages/PasswordPage.jsx";
import AddPasswordPage from "./pages/AddPasswordPage.jsx";
import SetupQuestionPage from "./pages/SetupQuestionPage.jsx";
import ManageQuestionsPage from "./pages/ManageQuestionsPage.jsx";
import startSound from "./assets/audiostart.mp3";

function ProtectedRoute({ children }) {
  const authed = localStorage.getItem("authed") === "1";
  return authed ? children : <Navigate to="/" replace />;
}

export default function App() {
  // sonido al abrir
  useEffect(() => {
    const audio = new Audio(startSound);
    audio.currentTime = 0.9;
    audio.play().catch(() => {});
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/setup-question" element={<SetupQuestionPage />} />
      <Route
        path="/passwords"
        element={
          <ProtectedRoute>
            <PasswordsPage />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/add" 
        element={
          <ProtectedRoute>
            <AddPasswordPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/manage-questions" 
        element={
          <ProtectedRoute>
            <ManageQuestionsPage />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
