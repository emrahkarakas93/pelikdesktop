import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setUsername(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const getErrorMessage = (message) => {
    switch (message) {
      case 'api.auth.not_verified':
        return 'Hesabınız henüz doğrulanmamış.';
      case 'auth.inactive_account':
        return 'Hesabınız aktif değil.';
      case 'auth.banned_account':
        return 'Hesabınız engellenmiş.';
      case 'auth.incorrect':
        return 'Kullanıcı adı veya şifre hatalı.';
      case 'This device is not registered for this user':
        return 'Bu cihaz bu kullanıcı için kayıtlı değil.';
      case 'x-device-mac header is required':
        return 'Cihaz bilgisi alınamadı. Lütfen uygulamayı yeniden kurun.';
      case 'client identification failed.check the api key':
        return 'Uygulama kimlik doğrulaması başarısız. Lütfen uygulamayı yeniden kurun.';
      default:
        return 'Giriş başarısız. Lütfen tekrar deneyin.';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const macResult = await window.electron.getMacAddress();
      if (!macResult.success) {
        setError("Cihaz bilgisi alınamadı. Lütfen tekrar deneyin.");
        setLoading(false);
        return;
      }

      const cleanMacAddress = macResult.macAddress;

      const response = await apiClient.post(
        "/login",
        { 
          username, 
          password,
          device_mac: cleanMacAddress
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY,
            "x-device-mac": cleanMacAddress
          },
        }
      );

      if (response.data.success) {
        localStorage.clear();
        sessionStorage.clear();

        localStorage.setItem("device_mac", cleanMacAddress);
        
        if (rememberMe) {
          localStorage.setItem("token", response.data.data.token);
          localStorage.setItem("rememberedEmail", username);
        } else {
          sessionStorage.setItem("token", response.data.data.token);
        }
        
        onLoginSuccess();
        navigate("/dashboard");
      } else {
        const errorMessage = response.data?.message || 'Bilinmeyen hata';
        console.log('Error response:', response.data);
        setError(getErrorMessage(errorMessage));
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Bilinmeyen hata';
      console.log('Error caught:', err.response?.data);
      setError(getErrorMessage(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-primary-100 to-secondary-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-shadow duration-300 p-8 space-y-8">
          {/* Logo ve Başlık */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 mb-4 animate-float">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">Hoş Geldiniz</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-neutral-700">
                E-posta Adresi
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="username"
                  className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ornek@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                Şifre
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="rememberMe" className="ml-2 text-sm text-neutral-600">
                  Beni Hatırla
                </label>
              </div>

            </div>

            {error && (
              <div className="p-4 rounded-lg bg-accent-50 border border-accent-200 text-accent-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 ${
                loading
                  ? 'bg-neutral-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 active:from-primary-800 active:to-primary-700 shadow-soft hover:shadow-none'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Giriş Yapılıyor...
                </div>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
