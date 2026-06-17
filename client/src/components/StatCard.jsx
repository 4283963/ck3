import './StatCard.css';

function StatCard({ title, value, unit, icon, color, decimals = 0, subtext, percentage }) {
  const displayValue = typeof value === 'number' ? value.toFixed(decimals) : value;

  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__content">
        <h3 className="stat-card__title">{title}</h3>
        <div className="stat-card__value">
          <span className="stat-card__number">{displayValue}</span>
          <span className="stat-card__unit">{unit}</span>
        </div>
        {subtext && <p className="stat-card__subtext">{subtext}</p>}
        {percentage !== undefined && (
          <div className="stat-card__progress">
            <div
              className={`stat-card__progress-bar stat-card__progress-bar--${color}`}
              style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;
