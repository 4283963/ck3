import './InverterList.css';

function InverterList({ inverters }) {
  const solarInverters = inverters.filter(inv => inv.type === 'solar');
  const batteryInverters = inverters.filter(inv => inv.type === 'battery');

  const InverterCard = ({ inv }) => (
    <div className={`inverter-card inverter-card--${inv.type} inverter-card--${inv.status}`}>
      <div className="inverter-card__header">
        <span className="inverter-card__type-icon">
          {inv.type === 'solar' ? '☀️' : '🔋'}
        </span>
        <div className="inverter-card__info">
          <h4 className="inverter-card__name">{inv.name}</h4>
          <span className="inverter-card__id">{inv.inverterId}</span>
        </div>
        <span className={`inverter-card__status inverter-card__status--${inv.status}`}>
          {inv.status === 'normal' ? '正常' : inv.status === 'warning' ? '警告' : '异常'}
        </span>
      </div>

      <div className="inverter-card__metrics">
        <div className="metric">
          <span className="metric__label">功率</span>
          <span className="metric__value">{inv.power.toFixed(1)} kW</span>
        </div>
        <div className="metric">
          <span className="metric__label">电压</span>
          <span className="metric__value">{inv.voltage.toFixed(1)} V</span>
        </div>
        <div className="metric">
          <span className="metric__label">电流</span>
          <span className="metric__value">{inv.current.toFixed(2)} A</span>
        </div>
        <div className="metric">
          <span className="metric__label">温度</span>
          <span className="metric__value">{inv.temperature.toFixed(1)} °C</span>
        </div>
      </div>

      {inv.type === 'battery' && (
        <div className="inverter-card__soc">
          <div className="soc-header">
            <span className="soc-label">剩余电量 (SOC)</span>
            <span className={`soc-value ${inv.soc < 20 ? 'soc-value--low' : ''}`}>
              {inv.soc.toFixed(1)}%
            </span>
          </div>
          <div className="soc-bar">
            <div
              className={`soc-bar__fill ${
                inv.soc < 20 ? 'soc-bar__fill--low' : inv.soc < 50 ? 'soc-bar__fill--medium' : 'soc-bar__fill--high'
              }`}
              style={{ width: `${inv.soc}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="inverter-list">
      <div className="inverter-group">
        <h3 className="inverter-group__title">
          <span>☀️</span> 光伏逆变器
          <span className="inverter-group__count">{solarInverters.length} 台</span>
        </h3>
        <div className="inverter-cards">
          {solarInverters.map(inv => (
            <InverterCard key={inv.inverterId} inv={inv} />
          ))}
        </div>
      </div>

      <div className="inverter-group">
        <h3 className="inverter-group__title">
          <span>🔋</span> 储能逆变器
          <span className="inverter-group__count">{batteryInverters.length} 台</span>
        </h3>
        <div className="inverter-cards">
          {batteryInverters.map(inv => (
            <InverterCard key={inv.inverterId} inv={inv} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default InverterList;
