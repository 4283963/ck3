import { useState } from 'react';
import './IslandSelector.css';

function IslandSelector({ islands, selectedIsland, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedIslandData = islands.find(i => i.id === selectedIsland);

  const handleSelect = (islandId) => {
    onSelect(islandId);
    setIsOpen(false);
  };

  return (
    <div className={`island-selector ${isOpen ? 'island-selector--open' : ''}`}>
      <button
        type="button"
        className="island-selector__trigger"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
      >
        <span className="island-selector__label">📍</span>
        <span className="island-selector__value">
          {selectedIslandData ? selectedIslandData.name : '选择海岛'}
        </span>
        <span className={`island-selector__arrow ${isOpen ? 'island-selector__arrow--open' : ''}`}>
          ▾
        </span>
      </button>
      {isOpen && (
        <ul className="island-selector__dropdown">
          {islands.map(island => (
            <li key={island.id}>
              <button
                type="button"
                className={`island-selector__option ${
                  island.id === selectedIsland ? 'island-selector__option--selected' : ''
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(island.id);
                }}
              >
                <span className="island-selector__option-icon">🏝️</span>
                <span className="island-selector__option-name">{island.name}</span>
                {island.id === selectedIsland && (
                  <span className="island-selector__option-check">✓</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default IslandSelector;
