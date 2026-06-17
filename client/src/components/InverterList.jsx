import './InverterList.css';

function InverterList({ inverters, onUnlock, unlockingId, lowSocThreshold = 20 }) {
  const solarInverters = inverters.filter(inv => inv.type === 'solar');
  const batteryInverters = inverters.filter(inv => inv.type === 'battery');

  const InverterCard = ({ inv }) => {
    const isLocked = inv.locked;
    const isUnlocking = unlockingId === inv.inverterId;

    return (
      <div className={`inverter-card inverter-card--${inv.type} inverter-card--${inv.status} ${isLocked ? 'inverter-card--locked' : ''}`}>
        <div className="inverter-card__header">
          <span className="inverter-card__type-icon">
            {inv.type === 'solar' ? '☀️' : '🔋'}
          </span>
          <div className="inverter-card__info">
            <h4 className="inverter-card__name">
              {inv.name}
              {isLocked && <span className="lock-icon" title="已锁定放电">🔒</span>}
            </h4>
            <span className="inverter-card__id">{inv.inverterId}</span>
          </div>
          <div className="inverter-card__status-container">
            <span className={`inverter-card__status inverter-card__status--${inv.status}`}>
              {inv.status === 'normal' ? '正常' : inv.status === 'warning' ? '警告' : '异常'}
            </span>
            {isLocked && (
              <span className="inverter-card__lock-status">
                放电已锁定
              </span>
            )}
          </div>
        </div>

        <div className="inverter-card__metrics">
          <div className="metric">
            <span className="metric__label">功率</span>
            <span className={`metric__value ${isLocked && inv.power === 0 ? 'metric__value--zero' : ''}`}>
              {inv.power.toFixed(1)} kW
            </span>
          </div>
          <div className="metric">
            <span className="metric__label">电压</span>
            <span className="metric__value">{inv.voltage.toFixed(1)} V</span>
          </div>
          <div className="metric">
            <span className="metric__label">电流</span>
            <span className={`metric__value ${isLocked && inv.current === 0 ? 'metric__value--zero' : ''}`}>
              {inv.current.toFixed(2)} A
            </span>
          </div>
          <div className="metric">
            <span className="metric__label">温度</span>
            <span className="metric__value">{inv.temperature.toFixed(1)} °C</span>
          </div>
        </div>

        {inv.type === 'battery' && (
          <>
            <div className="inverter-card__soc">
              <div className="soc-header">
                <span className="soc-label">剩余电量 (SOC)</span>
                <span className={`soc-value ${inv.soc < lowSocThreshold ? 'soc-value--low' : ''}`}>
                  {inv.soc.toFixed(1)}%
                </span>
              </div>
              <div className="soc-bar">
                <div
                  className={`soc-bar__fill ${
                    inv.soc < lowSocThreshold ? 'soc-bar__fill--low' : inv.soc < 50 ? 'soc-bar__fill--medium' : 'soc-bar__fill--high'
                  }`}
                  style={{ width: `${inv.soc}%` }}
                ></div>
              </div>
              <div className="soc-threshold-line" style={{ left: `${lowSocThreshold}%` }} title={`阈值: ${lowSocThreshold}%`}></div>
            </div>

            {isLocked && (
              <div className="inverter-card__lock-info">
                <div className="lock-info__text">
                  ⚠️ {inv.lockReason || '低于阈值自动锁定'}
                </div>
                {onUnlock && (
                  <button
                    className="unlock-button"
                    onClick={() => onUnlock(inv.inverterId)}
                    disabled={isUnlocking}
                  >
                    {isUnlocking ? (
                      <>
                        <span className="unlock-spinner"></span>
                        解锁中...
                      </>
                    ) : (
                      '🔓 手动解锁'
                    )}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

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
