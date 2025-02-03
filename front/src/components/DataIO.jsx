import React from 'react';

const DataIO = ({
  addedWallets,
  setAddedWallets,
  walletLabels,
  setWalletLabels,
  selectedDate,
  setSelectedDate,
  nodeImages,
  setNodeImages,
  updateNodeColorsAndImages,
  selectedCrypto,
}) => {
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

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const token = localStorage.getItem('token');

        if (data.addedWallets) {
          setAddedWallets(data.addedWallets);
          // Сохранение добавленных кошельков в базу данных
          for (const walletAddress of data.addedWallets) {
            await fetch('http://localhost:5000/api/wallets/add', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: token,
              },
              body: JSON.stringify({
                userId: localStorage.getItem('userId'),
                walletAddress,
                cryptoType: selectedCrypto, // Замените на нужный тип криптовалюты
              }),
            });
          }
        }

        if (data.walletLabels) {
          setWalletLabels(data.walletLabels);
          // Сохранение меток кошельков в базу данных
          for (const [walletAddress, label] of Object.entries(data.walletLabels)) {
            await fetch('http://localhost:5000/api/wallets/label', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: token,
              },
              body: JSON.stringify({ walletAddress, label }),
            });
          }
        }

        if (data.selectedDate) {
          setSelectedDate(data.selectedDate);
        }

        if (data.nodeImages) {
          setNodeImages(data.nodeImages);
          // Сохранение измененных картинок узлов в базу данных
          for (const [walletAddress, imageType] of Object.entries(data.nodeImages)) {
            await fetch('http://localhost:5000/api/wallets/image', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: token,
              },
              body: JSON.stringify({ walletAddress, imageType }),
            });
          }
        }

        updateNodeColorsAndImages();
      } catch (error) {
        console.error('Ошибка при чтении файла: ', error);
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  return (
    <div>
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
      <input type="file" id="importInput" style={{ display: 'none' }} onChange={handleFileUpload} />
      <label htmlFor="importInput" className="tools-icon">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M1 10.262V18.8423C1 20.4219 2.23122 21.7024 3.75 21.7024H20.25C21.7688 21.7024 23 20.4219 23 18.8423V10.262"
            stroke="white"
            strokeWidth="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M12 1.04004V18.2007M12 18.2007L7.1875 13.1955M12 18.2007L16.8125 13.1955"
            stroke="white"
            strokeWidth="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </label>
    </div>
  );
};

export default DataIO;
