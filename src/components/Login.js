import React, { useState } from "react";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRegister, setIsRegister] = useState(false); // toggle between login & register

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = isRegister
        ? "http://localhost:5169/api/users/register"
        : "http://localhost:5169/api/users/login";

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const err = await response.json();
        setError(err.message || "Something went wrong");
        return;
      }

      const user = await response.json();

      if (isRegister) {
        // after registration, auto-login user
        onLogin(user);
      } else {
        onLogin(user); // user = { id, username }
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again.");
    }
  };

  return (
    <div className="login-container">
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

        <button type="submit">{isRegister ? "Register" : "Login"}</button>

        {error && <p className="error-message">{error}</p>}

        <p className="register-link">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setIsRegister(false);
                  setError("");
                }}
              >
                Login
              </button>
            </>
          ) : (
            <>
              Don’t have an account?{" "}
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setIsRegister(true);
                  setError("");
                }}
              >
                Register
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  );
}

export default Login;
