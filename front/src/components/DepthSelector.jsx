import React from 'react';

const DepthSelector = ({ selectedDepth, setSelectedDepth }) => {
  return (
    <div>
      <label>
        Глубина отобраения смежных вершин
        <select value={selectedDepth} onChange={e => setSelectedDepth(parseInt(e.target.value))}>
          {[1, 2, 3, 4, 5].map(depth => (
            <option key={depth} value={depth}>{depth}</option>
          ))}
        </select>
      </label>
    </div>
  );
};

export default DepthSelector;