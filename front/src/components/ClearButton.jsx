import React from 'react';

const ClearButton = ({ nodes, edges }) => {
  const clearGraph = () => {
    nodes.clear();
    edges.clear();
  };

  return (
    <div>
      <button className="tools-icon" onClick={clearGraph}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M1 1L24 24.9209"
            stroke="white"
            strokeWidth="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M10.5833 11.2025C10.1857 11.671 9.94446 12.2865 9.94446 12.9606C9.94446 14.4284 11.0886 15.6184 12.5 15.6184C13.1481 15.6184 13.7398 15.3675 14.1904 14.954"
            stroke="white"
            strokeWidth="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M6.57347 7.0614C4.42447 8.62766 2.6342 10.8591 1 12.9604C3.41316 16.9353 7.74884 20.9341 12.5 20.9341C14.4804 20.9341 16.3888 20.2393 18.1157 19.1411"
            stroke="white"
            strokeWidth="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M12.5 4.98682C17.6218 4.98682 21.063 9.18387 24 12.9604C23.593 13.6306 23.1315 14.3016 22.6226 14.9539"
            stroke="white"
            strokeWidth="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
  );
};

export default ClearButton;
