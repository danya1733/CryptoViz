import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../LoginPage/LoginPage.css';
import logo from '../../images/logo.png';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        setSuccessMessage('Password reset link has been sent to your email.');
        setShowSuccessMessage(true);
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
      } else {
        const { error } = await response.json();
        setErrorMessage(error);
        setShowErrorMessage(true);
        setTimeout(() => {
          setShowErrorMessage(false);
        }, 3000);
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
      setShowErrorMessage(true);
      setTimeout(() => {
        setShowErrorMessage(false);
      }, 3000);
    }
  };

  return (
    <div>
      {showErrorMessage && <div className="error-message">{errorMessage}</div>}
      {showSuccessMessage && <div className="success-message">{successMessage}</div>}

      <div className="login-container">
        <img src={logo} alt="Logo" />
        <h2>Welcome</h2>
        <p>
          Remember your password? <Link to="/login">Login</Link>
        </p>
        <form className="login-form" onSubmit={handleForgotPassword}>
          <div className="input-wrapper email">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit">Reset Password</button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
