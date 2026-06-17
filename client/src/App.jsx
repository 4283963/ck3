import { useMemo } from 'react';
import Dashboard from './components/Dashboard.jsx';
import WarningBanner from './components/WarningBanner.jsx';
import IslandSelector from './components/IslandSelector.jsx';
import useIslandData from './hooks/useIslandData.js';
import './App.css';

function App() {
  const {
    summary,
    inverters,
    islands,
    selectedIsland,
    loading,
    error,
    lastUpdate,
    switchIsland,
  } = useIslandData(5000);

  const currentIslandName = useMemo(() => {
    const island = islands.find(i => i.id === selectedIsland);
    return island ? island.name : '';
  }, [islands, selectedIsland]);

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🏝️ 海岛光伏储能监控系统</h1>
          <div className="header-info">
            {islands.length > 0 && (
              <IslandSelector
                islands={islands}
                selectedIsland={selectedIsland}
                onSelect={switchIsland}
              />
            )}
            <span className="status-indicator"></span>
            <span className="status-text">
              {currentIslandName ? `${currentIslandName} - ` : ''}实时监控中
            </span>
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
