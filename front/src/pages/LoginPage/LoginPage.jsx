import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css';
import logo from '../../images/logo.png';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        const { token, userId } = await response.json();
        login(token, userId);
        navigate('/graph');
      } else {
        const { error } = await response.json();
        setErrorMessage(error);
        setShowErrorMessage(true);
        setTimeout(() => {
          setShowErrorMessage(false);
        }, 3000);
      }
    } catch (error) {
      setErrorMessage('An error occurred during login.');
      setShowErrorMessage(true);
      setTimeout(() => {
        setShowErrorMessage(false);
      }, 3000);
    }
  };
  return (
    <div className="prikol">
      {showErrorMessage && <div className="error-message">{errorMessage}</div>}
      <div className="login-container">
        <img src={logo} alt="Logo" />
        <h2>Welcome Back</h2>
        <p>
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
        <p>
          Forgot password?<Link to="/forgot-password"> Reset password</Link>
        </p>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-wrapper user">
            <input
              type="text"
              placeholder="Login"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="input-wrapper lock">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="submitBtn" type="submit">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
