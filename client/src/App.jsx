import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard.jsx';
import WarningBanner from './components/WarningBanner.jsx';
import './App.css';

function App() {
  const [summary, setSummary] = useState(null);
  const [inverters, setInverters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = async () => {
    try {
      const [summaryRes, latestRes] = await Promise.all([
        fetch('/api/data/summary'),
        fetch('/api/data/latest'),
      ]);

      if (!summaryRes.ok || !latestRes.ok) {
        throw new Error('获取数据失败');
      }

      const summaryData = await summaryRes.json();
      const latestData = await latestRes.json();

      if (summaryData.success) {
        setSummary(summaryData.data);
      }
      if (latestData.success) {
        setInverters(latestData.data);
      }

      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🏝️ 海岛光伏储能监控系统</h1>
          <div className="header-info">
            <span className="status-indicator"></span>
            <span className="status-text">实时监控中</span>
            {lastUpdate && (
              <span className="update-time">
                最后更新: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">
        {summary && summary.warning && (
          <WarningBanner lowBatteryCount={summary.lowBatteryCount} />
        )}

        {loading && <div className="loading">加载中...</div>}

        {error && (
          <div className="error-box">
            <p>⚠️ {error}</p>
            <p>请确保后端服务正在运行</p>
          </div>
        )}

        {!loading && !error && summary && (
          <Dashboard summary={summary} inverters={inverters} />
        )}
      </main>
    </div>
  );
}

export default App;
