import StatCard from './StatCard.jsx';
import InverterList from './InverterList.jsx';
import './Dashboard.css';

function Dashboard({ summary, inverters }) {
  const solarInverters = inverters.filter(inv => inv.type === 'solar');
  const batteryInverters = inverters.filter(inv => inv.type === 'battery');

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
          color={summary.avgSoc < 20 ? 'warning' : 'info'}
          decimals={1}
        />
        <StatCard
          title="在线设备"
          value={inverters.length}
          unit="台"
          icon="📡"
          color="info"
          subtext={`光伏 ${solarInverters.length} / 储能 ${batteryInverters.length}`}
        />
      </section>

      <section className="inverters-section">
        <div className="section-header">
          <h2>设备列表</h2>
        </div>
        <InverterList inverters={inverters} />
      </section>
    </div>
  );
}

export default Dashboard;
