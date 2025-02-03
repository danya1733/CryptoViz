import React from 'react';
import salaryImage from '../images/salary.png';
import generalImage from '../images/general.png';
import homeImage from '../images/home.png';
import exchangeImage from '../images/exchange.png';
import transactionImage from '../images/transaction.png';
const ContextMenu = ({
  visible,
  position,
  nodeId,
  walletLabels,
  setWalletLabels,
  nodes,
  setNodes,
  nodeImages,
  setNodeImages,
  addedWallets,
  selectedCrypto
}) => {
  const setImage = (nodeId, imageType) => {
    let imageSrc;
    switch (imageType) {
      case 'salary':
        imageSrc = salaryImage;
        break;
      case 'general':
        imageSrc = generalImage;
        break;
      case 'home':
        imageSrc = homeImage;
        break;
      case 'exchange':
        imageSrc = exchangeImage;
        break;
      default:
        imageSrc = generalImage;
    }

    // Обновление узла с новой картинкой
    nodes.update({
      id: nodeId,
      shape: 'image',
      image: imageSrc
    });

    // Сохранение выбранной картинки в состояние
    const updatedNodeImages = { ...nodeImages, [nodeId]: imageType };
    setNodeImages(updatedNodeImages);

    // Отправка информации о замененном изображении на сервер
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:5000/api/wallets/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ walletAddress: nodeId, imageType, cryptoType: selectedCrypto })
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to update wallet image');
          }
        })
        .catch(error => {
          console.error('Error updating wallet image:', error);
        });
    }
  };

  const deleteImage = (nodeId) => {
    // Удаление информации о замененном изображении из состояния nodeImages
    const updatedNodeImages = { ...nodeImages };
    delete updatedNodeImages[nodeId];
    setNodeImages(updatedNodeImages);
  
    // Получаем узел по nodeId
    const node = nodes.get(nodeId);
  
    // Проверяем, является ли узел транзакцией
    const isTransaction = node && node.nodeType === 'transaction';
  
    // Устанавливаем изображение по умолчанию в зависимости от типа узла
    const defaultImage = isTransaction ? transactionImage : (addedWallets.includes(nodeId) ? salaryImage : generalImage);
  
    nodes.update({
      id: nodeId,
      shape: 'image',
      image: defaultImage
    });
  
    // Отправка запроса на сервер для удаления информации о замененном изображении из базы данных
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`http://localhost:5000/api/wallets/image?walletAddress=${nodeId}&cryptoType=${selectedCrypto}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to delete wallet image');
          }
        })
        .catch(error => {
          console.error('Error deleting wallet image:', error);
        });
    }
  };


  const addLabel = (nodeId) => {
    const newLabel = prompt("Enter new label for the wallet:");
    if (newLabel) {
      updateWalletLabel(nodeId, newLabel);
    }
  };

  const editLabel = (nodeId) => {
    const currentLabel = walletLabels[nodeId] || '';
    const newLabel = prompt("Edit label:", currentLabel);
    if (newLabel !== null) {
      updateWalletLabel(nodeId, newLabel);
    }
  };

  const deleteLabel = (nodeId) => {
    // Отправка запроса на сервер для удаления подписи из базы данных
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`http://localhost:5000/api/wallets/label?walletAddress=${nodeId}&cryptoType=${selectedCrypto}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token
        }
      })
        .then(response => {
          if (response.ok) {
            setWalletLabels(prevLabels => {
              const updatedLabels = { ...prevLabels };
              delete updatedLabels[nodeId];
              return updatedLabels;
            });
  
            // Получаем узел по nodeId
            const node = nodes.get(nodeId);
  
            // Проверяем, является ли узел транзакцией
            const isTransaction = node && node.nodeType === 'transaction';
  
            // Устанавливаем подпись по умолчанию в зависимости от типа узла
            const defaultLabel = isTransaction ? `Transaction ${nodeId}` : nodeId;
  
            // Обновляем метку узла в графе
            if (nodes.get(nodeId)) {
              nodes.update({
                id: nodeId,
                label: defaultLabel
              });
              setNodes(nodes);
            }
          } else {
            throw new Error('Failed to delete wallet label');
          }
        })
        .catch(error => {
          console.error('Error deleting wallet label:', error);
        });
    }
  };

  const updateWalletLabel = (walletAddress, label) => {
    // Отправка информации о подписи кошелька на сервер
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:5000/api/wallets/label', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ walletAddress, label, cryptoType: selectedCrypto })
      })
        .then(response => {
          if (response.ok) {
            setWalletLabels(prevLabels => ({
              ...prevLabels,
              [walletAddress]: label
            }));

            // Обновляем метку узла в графе
            if (nodes.get(walletAddress)) {
              nodes.update({
                id: walletAddress,
                label: label || walletAddress
              });
              setNodes(nodes);
            }
          } else {
            throw new Error('Failed to update wallet label');
          }
        })
        .catch(error => {
          console.error('Error updating wallet label:', error);
        });
    }
  };
  return (
    visible && (
      <div
        className="context-menu"
        style={{
          position: "absolute",
          top: position.y,
          left: position.x,
          display: 'block',
        }}
      >
        <ul>
          {/* Пункт меню для установки изображения */}
          <li>Set Image
            <ul className="submenu">
              <li className="setImageOption" onClick={() => setImage(nodeId, 'general')}>General</li>
              <li className="setImageOption" onClick={() => setImage(nodeId, 'home')}>Home</li>
              <li className="setImageOption" onClick={() => setImage(nodeId, 'exchange')}>Exchange</li>
              <li className="setImageOption" onClick={() => setImage(nodeId, 'salary')}>Salary</li>
            </ul>
          </li>
          {/* Условие для отображения "Remove Image", так как это действие всегда доступно */}
          <li onClick={() => deleteImage(nodeId)}>Remove Image</li>
          {/* Условное отображение для "Add Label", "Edit Label", и "Delete Label" */}
          {walletLabels[nodeId] ? (
            <>
              <li onClick={() => editLabel(nodeId)}>Edit Label</li>
              <li onClick={() => deleteLabel(nodeId)}>Remove Label</li>
            </>
          ) : (
            <li onClick={() => addLabel(nodeId)}>Add Label</li>
          )}
        </ul>
      </div>
    )
  );
};

export default ContextMenu;