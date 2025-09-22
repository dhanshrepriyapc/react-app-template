import React, { useState } from "react";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [timeZoneId, setTimeZoneId] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  ); // default to browser timezone
  const [error, setError] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = isRegister
        ? "http://localhost:5169/api/users/register"
        : "http://localhost:5169/api/users/login";

      const body = isRegister
        ? { username, password, timeZoneId }
        : { username, password };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json();
        setError(err.message || "Something went wrong");
        return;
      }

      const data = await response.json();
      if (isRegister) {
      // Registration succeeded
      setError(""); // clear previous errors
      alert("Registration successful! You can now login."); 
      return; // stop further processing
    }
      // Save JWT token for login
      if (!isRegister && data.token) {
        localStorage.setItem("jwtToken", data.token);
      }

      // Pass user info and token to App
      onLogin({ id: data.user.id, username: data.user.username }, data.token);
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
        {isRegister && (
          <select
            value={timeZoneId}
            onChange={(e) => setTimeZoneId(e.target.value)}
          >
            {Intl.supportedValuesOf("timeZone").map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        )}
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
              <p className="link-text">Don’t have an account?</p>
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
