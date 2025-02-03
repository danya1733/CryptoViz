import React, { useEffect, useRef } from 'react';
const WalletList = ({
  addedWallets,
  walletLabels,
  setWalletLabels,
  nodes,
  setNodes,
  removeWallet,
  selectedCrypto,
}) => {
  const debounceTimers = useRef({});

  useEffect(() => {
    return () => {
      // Очистка всех таймеров debounce при размонтировании компонента
      Object.values(debounceTimers.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const handleLabelChange = (walletAddress, event) => {
    const label = event.target.value;
    updateWalletLabel(walletAddress, label);

    // Очистка предыдущего таймера debounce для этого кошелька
    clearTimeout(debounceTimers.current[walletAddress]);

    // Установка нового таймера debounce для отправки запроса на сервер
    debounceTimers.current[walletAddress] = setTimeout(() => {
      if (label) {
        saveWalletLabel(walletAddress, label);
      } else {
        deleteWalletLabel(walletAddress);
      }
    }, 500); // Задержка в 500 мс перед отправкой запроса
  };

  const updateWalletLabel = (walletAddress, label) => {
    setWalletLabels((prevLabels) => ({
      ...prevLabels,
      [walletAddress]: label,
    }));

    // Обновляем метку узла в графе
    if (nodes.get(walletAddress)) {
      nodes.update({
        id: walletAddress,
        label: label || walletAddress, // Если метка пустая, используем адрес кошелька
      });
      setNodes(nodes);
    }
  };

  const saveWalletLabel = async (walletAddress, label) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await fetch('http://localhost:5000/api/wallets/label', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token,
          },
          body: JSON.stringify({ walletAddress, label, cryptoType: selectedCrypto }),
        });

        if (!response.ok) {
          throw new Error('Failed to save wallet label');
        }
      } catch (error) {
        console.error('Error saving wallet label:', error);
      }
    }
  };

  const deleteWalletLabel = async (walletAddress) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await fetch(
          `http://localhost:5000/api/wallets/label?walletAddress=${walletAddress}&cryptoType=${selectedCrypto}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: token,
            },
          },
        );

        if (!response.ok) {
          throw new Error('Failed to delete wallet label');
        }
      } catch (error) {
        console.error('Error deleting wallet label:', error);
      }
    }
  };

  return (
    <div id="wallet-list-container">
      <h3>Added Wallets:</h3>
      <ul id="walletList">
        {addedWallets.map((wallet) => (
          <li key={wallet}>
            <div className="wallet-info">
              <span className="wallet-address">{wallet}</span>
              <input
                type="text"
                placeholder="Ваша заметка здесь"
                className="wallet-label-input"
                value={walletLabels[wallet] || ''}
                onChange={(e) => handleLabelChange(wallet, e)}
              />
            </div>
            <div className="remove-wallet" onClick={() => removeWallet(wallet, selectedCrypto)}>
              <svg
                width="23"
                height="24"
                viewBox="0 0 23 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M19.1122 10.4187V21.4857C19.1122 21.8759 18.8082 22.1921 18.433 22.1921H3.94323C3.56812 22.1921 3.26402 21.8759 3.26402 21.4857V10.4187"
                  stroke="#8F8F8F"
                  strokeWidth="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M8.9241 17.4827V10.4187"
                  stroke="#8F8F8F"
                  strokeWidth="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M13.4522 17.4827V10.4187"
                  stroke="#8F8F8F"
                  strokeWidth="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M21.3763 5.70936H15.7162M15.7162 5.70936V1.7064C15.7162 1.31627 15.4121 1 15.037 1H7.33929C6.96417 1 6.66008 1.31627 6.66008 1.7064V5.70936M15.7162 5.70936H6.66008M1 5.70936H6.66008"
                  stroke="#8F8F8F"
                  strokeWidth="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WalletList;
