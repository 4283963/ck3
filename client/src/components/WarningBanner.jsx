import './Dashboard.css';

function WarningBanner({ lowBatteryCount, threshold = 20 }) {
  return (
    <div className="warning-banner">
      <div className="warning-icon">⚠️</div>
      <div className="warning-content">
        <h3>蓄电池低电量警告</h3>
        <p>
          当前有 <strong>{lowBatteryCount}</strong> 组蓄电池电量低于 <strong>{threshold}%</strong>，
          已自动锁定放电开关！请注意用电管理，及时补充电力。
        </p>
      </div>
      <div className="warning-pulse"></div>
    </div>
  );
}

export default WarningBanner;
