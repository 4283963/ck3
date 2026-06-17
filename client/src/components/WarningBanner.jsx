import './Dashboard.css';

function WarningBanner({ lowBatteryCount }) {
  return (
    <div className="warning-banner">
      <div className="warning-icon">⚠️</div>
      <div className="warning-content">
        <h3>蓄电池低电量警告</h3>
        <p>
          当前有 <strong>{lowBatteryCount}</strong> 组蓄电池电量低于 20%，
          请注意用电管理，及时补充电力！
        </p>
      </div>
      <div className="warning-pulse"></div>
    </div>
  );
}

export default WarningBanner;
