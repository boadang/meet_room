// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { UserProvider } from "./context/UserContext";

import AuthForm from "./pages/AuthForm";
import Home from "./pages/Home";
import Room from "./pages/Room";

const AppRoutes = () => {
  const navigate = useNavigate();

  // Định nghĩa hàm xử lý khi login thành công
  const handleLoginSuccess = (user) => {
    console.log("Đăng nhập thành công:", user);
    localStorage.setItem("user", JSON.stringify(userData));
    console.log("User data saved to localStorage:", userData);
    // Chuyển sang trang Home
    navigate("/home");
  };

  return (
    <Routes>
      <Route path="/" element={<AuthForm onLoginSuccess={handleLoginSuccess} />} />
      <Route path="/home" element={<Home />} />
      <Route path="/room/:roomId" element={<Room />} />
    </Routes>
  );
};

export default function App() {
  return (
    <UserProvider>
      <Router>
        <AppRoutes />
        <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      </Router>
    </UserProvider>
  );
}
