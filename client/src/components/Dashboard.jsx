import { useState } from 'react';
import StatCard from './StatCard.jsx';
import InverterList from './InverterList.jsx';
import './Dashboard.css';

function Dashboard({ summary, inverters, onUnlock }) {
  const solarInverters = inverters.filter(inv => inv.type === 'solar');
  const batteryInverters = inverters.filter(inv => inv.type === 'battery');
  const [unlockingId, setUnlockingId] = useState(null);

  const handleUnlock = async (inverterId) => {
    if (!onUnlock) return;
    setUnlockingId(inverterId);
    try {
      await onUnlock(inverterId);
    } catch (err) {
      alert(`解锁失败: ${err.message}`);
    } finally {
      setUnlockingId(null);
    }
  };

  return (
    <div className="dashboard">
      <section className="stats-section">
        <StatCard
          title="总发电功率"
          value={summary.totalSolarPower}
          unit="kW"
          icon="☀️"
          color="solar"
          decimals={2}
        />
        <StatCard
          title="总蓄电量"
          value={summary.totalStoredEnergy}
          unit="kWh"
          icon="🔋"
          color="battery"
          decimals={1}
          subtext={`总容量: ${summary.totalBatteryCapacity} kWh`}
          percentage={(summary.totalStoredEnergy / summary.totalBatteryCapacity) * 100}
        />
        <StatCard
          title="平均SOC"
          value={summary.avgSoc}
          unit="%"
          icon="📊"
          color={summary.avgSoc < (summary.lowSocThreshold || 20) ? 'warning' : 'info'}
          decimals={1}
          subtext={`阈值: ${summary.lowSocThreshold || 20}%`}
        />
        <StatCard
          title="在线设备"
          value={inverters.length}
          unit="台"
          icon="📡"
          color={summary.lockedCount > 0 ? 'warning' : 'info'}
          decimals={0}
          subtext={`光伏 ${solarInverters.length} / 储能 ${batteryInverters.length}${summary.lockedCount > 0 ? ` / 🔒 ${summary.lockedCount}台锁定` : ''}`}
        />
      </section>

      <section className="inverters-section">
        <div className="section-header">
          <h2>设备列表</h2>
          {summary.lockedCount > 0 && (
            <span className="locked-badge">
              🔒 {summary.lockedCount} 台设备已锁定
            </span>
          )}
        </div>
        <InverterList
          inverters={inverters}
          onUnlock={handleUnlock}
          unlockingId={unlockingId}
          lowSocThreshold={summary.lowSocThreshold || 20}
        />
      </section>
    </div>
  );
}

export default Dashboard;
