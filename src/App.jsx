import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import apiClient from "./api/apiClient";
import Swal from 'sweetalert2';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const deviceMac = localStorage.getItem("device_mac");

      if (!token || !deviceMac) {
        setIsLoggedIn(false);
        navigate("/");
        setInitialized(true);
        return;
      }

      try {
        const response = await apiClient.post("/check-session", {}, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "x-device-mac": deviceMac,
            "x-api-key": process.env.REACT_APP_API_KEY,
            "Content-Type": "application/json"
          }
        });

        if (response.data.success) {
          setIsLoggedIn(true);
          navigate("/dashboard");
        } else {
          await Swal.fire({
            title: 'Oturum Süresi Doldu',
            text: 'Tekrar giriş yapmanız gerekiyor',
            icon: 'warning',
            confirmButtonText: 'Tamam',
            confirmButtonColor: '#3085d6'
          });
          // Token ve MAC adresini temizle
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          localStorage.removeItem("device_mac");
          setIsLoggedIn(false);
          navigate("/");
        }
      } catch (error) {
        await Swal.fire({
          title: 'Oturum Hatası',
          text: 'Tekrar giriş yapmanız gerekiyor',
          icon: 'error',
          confirmButtonText: 'Tamam',
          confirmButtonColor: '#3085d6'
        });
        // Hata durumunda da temizle
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        localStorage.removeItem("device_mac");
        setIsLoggedIn(false);
        navigate("/");
      } finally {
        setInitialized(true);
      }
    };

    checkSession();
  }, [navigate]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    navigate("/dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    localStorage.removeItem("device_mac");
    setIsLoggedIn(false);
    navigate("/");
  };

  if (!initialized) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-secondary-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login onLoginSuccess={handleLoginSuccess} />
        }
      />
      <Route
        path="/dashboard"
        element={
          isLoggedIn ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/" replace />
        }
      />
    </Routes>
  );
};

export default App;