import React from 'react';

const ExportData = ({ addedWallets, walletLabels, selectedDate, nodeImages }) => {
  const exportData = () => {
    const data = { addedWallets, walletLabels, selectedDate, nodeImages };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', 'exported_data.json');
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <button className="tools-icon" onClick={exportData}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M23 12.6189L23 4.03857C23 2.45894 21.7688 1.17847 20.25 1.17847L3.75 1.17847C2.23117 1.17847 0.999999 2.45894 0.999999 4.03857L0.999999 12.6189"
          stroke="white"
          strokeWidth="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M12 21.8408L12 4.68018M12 4.68018L16.8125 9.68537M12 4.68018L7.18748 9.68537"
          stroke="white"
          strokeWidth="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  );
};

export default ExportData;
