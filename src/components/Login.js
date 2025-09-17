import React, { useState } from "react";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5169/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const err = await response.json();
        setError(err.message || "Invalid username or password");
        return;
      }

      const user = await response.json();
      onLogin(user); // user = { id, username }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again.");
    }
  };
  return (
    <div className="login-container">
      {/* App Title */}
      <h1 className="login-title">Appointments</h1>
      <form className="login-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        <p className="register-link">
        Don't have an account? <a href="#">Register</a>
        </p>

      </form>
    </div>
  );
}

export default Login;
