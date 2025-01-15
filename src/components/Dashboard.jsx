import React, { useState, useEffect, useRef } from "react";
import Layout from "./Layout";
import apiClient from "../api/apiClient";
import { FaPlay, FaClock, FaUser, FaFolder } from "react-icons/fa";

const Dashboard = ({ onLogout }) => {
  const [webinars, setWebinars] = useState([]);
  const [selectedWebinar, setSelectedWebinar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userFullName, setUserFullName] = useState("");
  const [isWebViewBlocked, setIsWebViewBlocked] = useState(false);
  const [detectedApp, setDetectedApp] = useState(null);
  const webviewRef = useRef(null);
  const [dynamicUrl, setDynamicUrl] = useState("");

  useEffect(() => {
    const fetchUserAndWebinars = async () => {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const deviceMac = localStorage.getItem("device_mac");
      
      if (!token) {
        setError("Lütfen giriş yapın.");
        setLoading(false);
        return;
      }

      if (!deviceMac) {
        setError("Cihaz bilgisi bulunamadı. Lütfen tekrar giriş yapın.");
        setLoading(false);
        return;
      }

      try {
        const userResponse = await apiClient.get("/panel/profile-setting", {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-device-mac": deviceMac
          },
        });
        setUserFullName(userResponse.data.data.user.full_name);

        const response = await apiClient.get("/panel/webinars/purchases", {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-device-mac": deviceMac
          },
        });
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const activeWebinars = (response.data.data?.webinars || []).filter(
          (webinar) => !webinar.expired && webinar.expire_on > currentTimestamp
        );
        setWebinars(activeWebinars);
      } catch (err) {
        setError(`Veriler alınırken bir hata oluştu.\n${err.response?.data?.message || err.message || 'Bilinmeyen hata'}`);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndWebinars();
  }, []);

  useEffect(() => {
    let cleanupFunction = () => {};

    if (selectedWebinar) {
      let isCurrentlyBlocked = false;
      
      const handleScreenCapture = (status) => {
        if (status.isRecording !== isCurrentlyBlocked) {
          isCurrentlyBlocked = status.isRecording;
          setIsWebViewBlocked(status.isRecording);
          setDetectedApp(status.detectedApp);
        }
      };

      window.electron.onScreenCaptureStatus(handleScreenCapture);
      
      cleanupFunction = () => {
        isCurrentlyBlocked = false;
        setIsWebViewBlocked(false);
        setDetectedApp(null);
      };
    }

    return cleanupFunction;
  }, [selectedWebinar]);

  const handleWebinarClick = (webinar) => {
    const updatedLink = webinar.link.replace("/course/", "/course/learning_app/");
    setDynamicUrl(updatedLink);
    setSelectedWebinar(webinar);
  };

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  if (loading) {
    return (
      <Layout
        title="Yükleniyor..."
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onLogout={onLogout}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        userFullName={userFullName}
      >
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout
        title="Hata"
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onLogout={onLogout}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        userFullName={userFullName}
      >
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-50 text-accent-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-neutral-900 dark:text-white">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={selectedWebinar ? selectedWebinar.title : "Satın Alınan Dersler"}
      isDarkMode={isDarkMode}
      onToggleDarkMode={toggleDarkMode}
      onLogout={onLogout}
      onGoBack={() => setSelectedWebinar(null)}
      isDetailPage={!!selectedWebinar}
      isFullscreen={isFullscreen}
      onToggleFullscreen={toggleFullscreen}
      userFullName={userFullName}
    >
      {selectedWebinar ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                {selectedWebinar.title}
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400">
                {selectedWebinar.teacher?.full_name}
              </p>
            </div>
          </div>
          <div className="relative w-full h-[600px]">
            {!isWebViewBlocked ? (
              <webview
                ref={webviewRef}
                src={dynamicUrl}
                className="w-full h-full rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-soft"
                allowpopups="true"
                partition="persist:session"
              />
            ) : (
              <div className="absolute inset-0 bg-black rounded-xl flex items-center justify-center">
                <div className="text-center text-white p-8 space-y-4 max-w-lg">
                  <div className="text-5xl mb-4">⚠️</div>
                  <h3 className="text-2xl font-bold">Güvenlik Uyarısı</h3>
                  <p className="text-lg mb-2">Video kaydı uygulaması tespit edildi.</p>
                  <div className="text-sm">
                    <p className="text-green-400 mt-4">Uygulama kapatıldığında video otomatik olarak devam edecektir.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {webinars.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 text-primary-600 mb-4">
                <FaFolder className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Henüz Ders Bulunmuyor
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                Satın alınan ders bulunmamaktadır. Mağazadan yeni dersler satın alabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {webinars.map((webinar) => (
                <div
                  key={webinar.id}
                  className={`group relative overflow-hidden rounded-2xl transition-all duration-300 ${
                    isDarkMode
                      ? "bg-neutral-800/30 hover:bg-neutral-800/50 ring-1 ring-neutral-700/50"
                      : "bg-white hover:bg-neutral-50/80 ring-1 ring-neutral-200/50"
                  } hover:shadow-xl hover:shadow-neutral-900/5 backdrop-blur-sm`}
                >
                  {webinar.rate > 0 && (
                    <div className="absolute top-3 right-3 z-30 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                      <div className={`flex gap-0.5 ${isDarkMode ? 'text-yellow-300/90' : 'text-yellow-500/90'}`}>
                        {[...Array(5)].map((_, index) => (
                          <span key={index} className="text-xs">
                            {index < Math.floor(webinar.rate) ? "★" : "☆"}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="aspect-[16/9] relative overflow-hidden rounded-t-2xl">
                    <div className={`absolute inset-0 flex items-center justify-center ${
                      isDarkMode ? 'bg-neutral-800/50' : 'bg-neutral-100/50'
                    } backdrop-blur-sm`}>
                      <span className={`text-xl font-bold text-center px-4 ${
                        isDarkMode ? 'text-neutral-600' : 'text-neutral-400'
                      }`}>
                        {webinar.title}
                      </span>
                    </div>
                    <img
                      src={webinar.image}
                      alt={webinar.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-all duration-500 relative z-10"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          onClick={() => handleWebinarClick(webinar)}
                          className="bg-white/95 hover:bg-white text-primary-600 p-4 rounded-full transform -translate-y-4 group-hover:translate-y-0 transition-all duration-500 hover:scale-110"
                        >
                          <FaPlay className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className={`font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary-500 transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-neutral-900'
                          }`}>
                            {webinar.title}
                          </h3>
                          <span className={`text-[10px] font-medium ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'} shrink-0 mt-1 tabular-nums`}>
                            #{webinar.id}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                              <FaUser className="w-3.5 h-3.5 shrink-0 opacity-75" />
                              <span className="truncate text-sm">{webinar.teacher?.full_name || "Bilinmiyor"}</span>
                            </div>
                            <div className={`flex items-center gap-2 text-xs ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                              <span className="opacity-60">Satın Alma:</span>
                              <span className={`${isDarkMode ? 'text-neutral-300' : 'text-neutral-600'} tabular-nums`}>
                                {new Date(webinar.purchased_at * 1000).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                              <FaFolder className="w-3.5 h-3.5 shrink-0 opacity-75" />
                              <span className="truncate text-sm">{webinar.category || "Genel"}</span>
                            </div>
                            <div className={`flex items-center gap-2 text-xs ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                              <span className="opacity-60">Son Kullanma:</span>
                              <span className={`tabular-nums ${
                                webinar.expired 
                                  ? 'text-red-500/90 dark:text-red-400/90' 
                                  : isDarkMode ? 'text-neutral-300' : 'text-neutral-600'
                              }`}>
                                {new Date(webinar.expire_on * 1000).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleWebinarClick(webinar)}
                        className="w-full py-2.5 px-4 rounded-xl font-medium text-sm bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white shadow-lg shadow-primary-600/20 hover:shadow-primary-500/30 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <FaPlay className="w-3.5 h-3.5" />
                        Dersi İzle
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default Dashboard;
