import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../LoginPage/LoginPage.css';
import logo from '../../images/logo.png';

function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      setShowErrorMessage(true);
      setTimeout(() => {
        setShowErrorMessage(false);
      }, 3000);
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });
      if (response.ok) {
        setSuccessMessage('Password reset successful. Redirecting to login...');
        setShowSuccessMessage(true);
        setTimeout(() => {
          setShowSuccessMessage(false);
          navigate('/login');
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
    <div className="prikol">
      {showErrorMessage && <div className="error-message">{errorMessage}</div>}
      {showSuccessMessage && <div className="success-message">{successMessage}</div>}
      <div className="login-container">
        <img src={logo} alt="Logo" />
        <h2>Welcome Back</h2>
        <form className="login-form" onSubmit={handleResetPassword}>
          <div className="input-wrapper lock">
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="input-wrapper lock">
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button type="submit">Reset Password</button>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
