import React, { useState } from "react";
import "./AuthForm.css";

const AuthForm = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "", username: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";

    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        onLoginSuccess(data.user);
      } else {
        alert(data.message || "Đăng nhập / đăng ký thất bại!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối server!");
    }
  };

  return (
    <div className={`container ${isSignUp ? "right-panel-active" : ""}`}>
      <div className="form-container sign-up-container">
        <form onSubmit={handleSubmit}>
          <h1>Sign up</h1>
          <input type="text" name="username" placeholder="Tên người dùng" onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
          <input type="password" name="password" placeholder="Mật khẩu" onChange={handleChange} required />
          <button type="submit">Sign up</button>
        </form>
      </div>

      <div className="form-container sign-in-container">
        <form onSubmit={handleSubmit}>
          <h1>Sign in</h1>
          <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
          <input type="password" name="password" placeholder="Mật khẩu" onChange={handleChange} required />
          <button type="submit">Sign in</button>
        </form>
      </div>

      <div className="overlay-container">
        <div className="overlay">
          <div className="overlay-panel overlay-left">
            <h1>Welcome back !</h1>
            <p>Sign in to join your reference room</p>
            <button className="ghost" onClick={() => setIsSignUp(false)}>
              Sign in
            </button>
          </div>
          <div className="overlay-panel overlay-right">
            <h1>welcome to meet-app!</h1>
            <p>create accounts to join your room</p>
            <button className="ghost" onClick={() => setIsSignUp(true)}>
              sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
