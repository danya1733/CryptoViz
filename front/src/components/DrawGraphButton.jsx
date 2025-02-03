import React from 'react';

const DrawGraphButton = ({
  addedWallets,
  getTRC20Transfers,
  getBTCTransfers,
  getETHTransfers,
  getERC20Transfers,
  updateNodeColorsAndImages,
  selectedCrypto,
  updateGraphLabels,
}) => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const drawGraph = async () => {
    for (const walletAddress of addedWallets) {
      if (selectedCrypto === 'usdt') {
        await getTRC20Transfers(walletAddress);
        updateNodeColorsAndImages();
      } else if (selectedCrypto === 'btc') {
        await getBTCTransfers(walletAddress);
        updateNodeColorsAndImages();
      } else if (selectedCrypto === 'eth') {
        await getETHTransfers(walletAddress);
        updateNodeColorsAndImages();
      } else if (selectedCrypto === 'erc20_usdt') {
        await getERC20Transfers(walletAddress, 'USDT');
        updateNodeColorsAndImages();
      } else if (selectedCrypto === 'erc20_usdc') {
        await getERC20Transfers(walletAddress, 'USDC');
        updateNodeColorsAndImages();
      }
      await sleep(1000); // Пауза между запросами в 1 секунду
    }
    updateNodeColorsAndImages();
    updateGraphLabels();
  };

  return (
    <div>
      <button className="tools-icon" onClick={drawGraph}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 25 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12.7362 6.71586C14.1477 6.71586 15.2918 7.90579 15.2918 9.37374C15.2918 10.8417 14.1477 12.0316 12.7362 12.0316C11.3248 12.0316 10.1807 10.8417 10.1807 9.37374C10.1807 7.90579 11.3248 6.71586 12.7362 6.71586Z"
            stroke="white"
            strokeWidth="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M24 9.74707C21.5868 5.77221 17.2512 1.77344 12.5 1.77344C7.74884 1.77344 3.41316 5.77221 1 9.74707C3.93704 13.5236 7.37819 17.7207 12.5 17.7207C17.6218 17.7207 21.063 13.5236 24 9.74707Z"
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

export default DrawGraphButton;
