import React from "react";
import { FaMoon, FaSun, FaSignOutAlt, FaArrowLeft, FaExpand, FaCompress } from "react-icons/fa";

const Layout = ({
  title,
  children,
  isDarkMode,
  onToggleDarkMode,
  onLogout,
  onGoBack,
  isDetailPage,
  isFullscreen,
  onToggleFullscreen,
  userFullName
}) => {
  const handleFullscreenToggle = () => {
    window.electron.toggleFullscreen();
  };

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isDarkMode 
          ? "bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900" 
          : "bg-gradient-to-br from-primary-50 via-primary-100 to-secondary-100"
      }`}
    >
      <header
        className={`${
          isDarkMode 
            ? "bg-neutral-800/80 backdrop-blur-sm border-b border-neutral-700" 
            : "bg-white/80 backdrop-blur-sm border-b border-neutral-200"
        } p-4 shadow-soft transition-all duration-300`}
      >
        {/* Logo ve Title */}
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img
              src={isDarkMode ? "./logo-white.png" : "./logo.png"}
              alt="Logo"
              className="h-auto w-32 max-w-[140px]"
            />
            <h1
              className={`text-2xl font-bold ${
                isDarkMode 
                  ? "text-white" 
                  : "bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent"
              } transition-colors duration-300`}
              style={{ letterSpacing: "1px" }}
            >
              {title}
            </h1>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            {isDetailPage && (
              <button
                onClick={onGoBack}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isDarkMode
                    ? "bg-neutral-700 hover:bg-neutral-600 text-white"
                    : "bg-white hover:bg-neutral-50 text-neutral-700 shadow-soft hover:shadow-none"
                }`}
              >
                <FaArrowLeft className="mr-2" />
                Geri Dön
              </button>
            )}

            {userFullName && (
              <div className={`px-4 py-2 rounded-lg font-medium ${
                isDarkMode ? "text-white" : "text-neutral-700"
              }`}>
                Hoşgeldiniz, {userFullName}
              </div>
            )}

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${
                isDarkMode
                  ? "bg-neutral-700 hover:bg-neutral-600 text-white"
                  : "bg-white hover:bg-neutral-50 text-neutral-700 shadow-soft hover:shadow-none"
              }`}
            >
              {isDarkMode ? <FaSun size={18} /> : <FaMoon size={18} />}
            </button>

            <button
              onClick={handleFullscreenToggle}
              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${
                isDarkMode
                  ? "bg-neutral-700 hover:bg-neutral-600 text-white"
                  : "bg-white hover:bg-neutral-50 text-neutral-700 shadow-soft hover:shadow-none"
              }`}
            >
              {isFullscreen ? <FaCompress size={18} /> : <FaExpand size={18} />}
            </button>

            <button
              onClick={onLogout}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isDarkMode
                  ? "bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-700 hover:to-accent-600 text-white"
                  : "bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white shadow-soft hover:shadow-none"
              }`}
            >
              <FaSignOutAlt className="mr-2" />
              Çıkış Yap
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-grow p-6">
        <div className={`rounded-xl ${
          isDarkMode 
            ? "bg-neutral-800/50 shadow-xl" 
            : "bg-white/50 shadow-card hover:shadow-card-hover"
        } transition-all duration-300 p-6`}>
          {children}
        </div>
      </main>

      <footer
        className={`${
          isDarkMode 
            ? "bg-neutral-800/80 backdrop-blur-sm text-neutral-400 border-t border-neutral-700" 
            : "bg-white/80 backdrop-blur-sm text-neutral-600 border-t border-neutral-200"
        } p-4 text-center transition-colors duration-300`}
      >
        © {new Date().getFullYear()} PELİK DESKTOP APP
      </footer>
    </div>
  );
};

export default Layout;
