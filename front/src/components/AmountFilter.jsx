import React from 'react';

const AmountFilter = ({ minAmount, setMinAmount, maxAmount, setMaxAmount }) => {
  const handleMinAmountChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setMinAmount(value);
    }
  };

  const handleMaxAmountChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setMaxAmount(value);
    }
  };

  return (
    <div className='amount-filter-container'>
      <div className="amount-block">
        <label>
          Min Amount:
          <input
            type="range"
            min="0"
            max={maxAmount}
            value={minAmount}
            onChange={(e) => setMinAmount(parseFloat(e.target.value))}
          />
          <input
            type="number"
            min="0"
            max={maxAmount}
            value={minAmount}
            onChange={handleMinAmountChange}
          />
        </label>
      </div>
      <div className="amount-block">
        <label>
          Max Amount:
          <input
            type="range"
            min={minAmount}
            max="100000"
            value={maxAmount}
            onChange={(e) => setMaxAmount(parseFloat(e.target.value))}
          />
          <input
            type="number"
            min={minAmount}
            max="100000"
            value={maxAmount}
            onChange={handleMaxAmountChange}
          />
        </label>
      </div>

    </div>
  );
};

export default AmountFilter;