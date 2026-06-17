import { useState, useEffect } from 'react';
import './ThresholdSetter.css';

function ThresholdSetter({ currentThreshold, onSave, saving }) {
  const [value, setValue] = useState(currentThreshold.toString());
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setValue(currentThreshold.toString());
  }, [currentThreshold]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (/^\d*\.?\d*$/.test(val)) {
      setValue(val);
      setError(null);
    }
  };

  const handleSliderChange = (e) => {
    setValue(e.target.value);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numValue = parseFloat(value);

    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
      setError('请输入 0-100 之间的数字');
      return;
    }

    try {
      await onSave(numValue);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      setError(err.message || '保存失败');
    }
  };

  const percentage = parseFloat(value) || 0;

  return (
    <div className="threshold-setter">
      <div className="threshold-setter__header">
        <h3 className="threshold-setter__title">
          ⚙️ 低电量阈值设置
        </h3>
        <span className="threshold-setter__current">
          当前: <strong>{currentThreshold}%</strong>
        </span>
      </div>

      <form onSubmit={handleSubmit} className="threshold-setter__form">
        <div className="threshold-setter__slider-container">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={percentage}
            onChange={handleSliderChange}
            className="threshold-setter__slider"
            disabled={saving}
          />
          <div className="threshold-setter__slider-labels">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="threshold-setter__input-group">
          <label className="threshold-setter__label">
            自定义阈值:
          </label>
          <div className="threshold-setter__input-wrapper">
            <input
              type="text"
              value={value}
              onChange={handleInputChange}
              placeholder="输入 0-100"
              className="threshold-setter__input"
              disabled={saving}
            />
            <span className="threshold-setter__suffix">%</span>
          </div>
          <button
            type="submit"
            className="threshold-setter__button"
            disabled={saving || !value}
          >
            {saving ? (
              <>
                <span className="threshold-setter__spinner"></span>
                保存中...
              </>
            ) : (
              '保存'
            )}
          </button>
        </div>

        {error && (
          <div className="threshold-setter__error">
            ❌ {error}
          </div>
        )}

        {showSuccess && (
          <div className="threshold-setter__success">
            ✅ 阈值已更新为 {currentThreshold}%
          </div>
        )}
      </form>

      <div className="threshold-setter__description">
        当蓄电池 SOC 低于此阈值时，系统将：
        <ul>
          <li>⚠️ 前端显示黄色警告</li>
          <li>🔒 后端自动锁定该逆变器的放电开关</li>
          <li>🔋 只允许充电，禁止对外放电</li>
        </ul>
      </div>
    </div>
  );
}

export default ThresholdSetter;
