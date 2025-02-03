import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../LoginPage/LoginPage.css';
import logo from '../../images/logo.png';

function RegistrationPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const navigate = useNavigate();

  const handleRegistration = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });
      if (response.ok) {
        navigate('/login');
      } else {
        const { error } = await response.json();
        setErrorMessage(error);
        setShowErrorMessage(true);
        setTimeout(() => {
          setShowErrorMessage(false);
        }, 3000);
      }
    } catch (error) {
      setErrorMessage('An error occurred during registration.');
      setShowErrorMessage(true);
      setTimeout(() => {
        setShowErrorMessage(false);
      }, 3000);
    }
  };

  return (
    <div>
      {showErrorMessage && <div className="error-message">{errorMessage}</div>}
      <div className="login-container">
        <img src={logo} alt="Logo" />
        <h2>Welcome</h2>
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
        <form className="login-form" onSubmit={handleRegistration}>
          <div className="input-wrapper user">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="input-wrapper email">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
          <button type="submit">Register</button>
        </form>
      </div>
    </div>
  );
}

export default RegistrationPage;
