///components/WalletInput

import React, { useRef, useState, useEffect } from 'react';

const WalletInput = ({ walletInput, setWalletInput, addedWallets, setAddedWallets, getTRC20Transfers, getBTCTransfers, getETHTransfers, getERC20Transfers, updateNodeColorsAndImages, selectedCrypto, setSelectedCrypto, userApiKey, setUserApiKey }) => {
  const textareaRef = useRef(null);

  const handleInputChange = (event) => {
    setWalletInput(event.target.value);
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const addWallet = async () => {
    const walletAddresses = walletInput.split(/[\s\n\t]+/).filter(Boolean);
    const newAddedWallets = [...addedWallets];
    for (const walletAddress of walletAddresses) {
      if (!newAddedWallets.includes(walletAddress)) {
        try {
          const userId = localStorage.getItem('userId');
          const response = await fetch('http://localhost:5000/api/wallets/add', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, walletAddress, cryptoType: selectedCrypto }),
          });
          if (response.ok) {
            newAddedWallets.push(walletAddress);
            if (selectedCrypto === 'usdt') {
              await getTRC20Transfers(walletAddress);
              setAddedWallets(newAddedWallets);
              updateNodeColorsAndImages();
            } else if (selectedCrypto === 'btc') {
              await getBTCTransfers(walletAddress);
              setAddedWallets(newAddedWallets);
              updateNodeColorsAndImages();
            } else if (selectedCrypto === 'eth') {
              await getETHTransfers(walletAddress);
              setAddedWallets(newAddedWallets);
              updateNodeColorsAndImages();
            } else if (selectedCrypto === 'erc20_usdt') {
              await getERC20Transfers(walletAddress, 'USDT');
              setAddedWallets(newAddedWallets);
              updateNodeColorsAndImages();
            } else if (selectedCrypto === 'erc20_usdc') {
              await getERC20Transfers(walletAddress, 'USDC');
              setAddedWallets(newAddedWallets);
              updateNodeColorsAndImages();
            }
            await sleep(1000);
          } else {
            console.error('Failed to add wallet');
          }
        } catch (error) {
          console.error('Error adding wallet:', error);
        }
      }
    }
    setWalletInput('');

  };

  const debounceTimer = useRef(null);

  const saveApiKey = async (apiKey) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch('http://localhost:5000/api/wallets/apiKey', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          },
          body: JSON.stringify({ apiKey })
        });
        if (!response.ok) {
          throw new Error('Failed to save API key');
        }
      }
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  };

  const debounceSaveApiKey = (apiKey) => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      saveApiKey(apiKey);
    }, 3000);
  };

  const handleApiKeyChange = (e) => {
    const apiKey = e.target.value;
    setUserApiKey(apiKey);
    debounceSaveApiKey(apiKey);
  };

  const fetchApiKey = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch('http://localhost:5000/api/wallets/apiKey', {
          headers: {
            'Authorization': token
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUserApiKey(data.apiKey);
        } else {
          throw new Error('Failed to fetch API key');
        }
      }
    } catch (error) {
      console.error('Error fetching API key:', error);
    }
  };

  useEffect(() => {
    fetchApiKey();
  }, [selectedCrypto]);
  return (
    <div id="wallet-input-container">
      <select value={selectedCrypto} onChange={(e) => setSelectedCrypto(e.target.value)}>
        <option value="usdt">USDT(TRC20)</option>
        <option value="btc">BTC</option>
        <option value="eth">ETH</option>
        <option value="erc20_usdt">USDT(ERC20)</option>
        <option value="erc20_usdc">USDC(ERC20)</option>
      </select>
      <div className="textarea-wrapper">
        <p>Введите кошельки</p>
        <textarea
          ref={textareaRef}
          id="walletInput"
          value={walletInput}
          onChange={handleInputChange}
        ></textarea>
      </div>

      {['eth', 'erc20_usdt', 'erc20_usdc'].includes(selectedCrypto) && (
        <div>
          <label htmlFor="apiKeyInput">Etherscan API Key:</label>
          <input
            id="apiKeyInput"
            type="text"
            value={userApiKey}
            onChange={handleApiKeyChange}
          />
        </div>
      )}
      <button onClick={addWallet}>Add Wallet</button>
    </div>
  );
};

export default WalletInput;