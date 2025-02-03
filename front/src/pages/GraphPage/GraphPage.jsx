//pages/GraphPage/GraphPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { DataSet, Network } from 'vis-network/standalone/esm/vis-network';
import 'react-datepicker/dist/react-datepicker.css';
import './GraphPage.css';

import salaryImage from '../../images/salary.png';
import generalImage from '../../images/general.png';
import homeImage from '../../images/home.png';
import exchangeImage from '../../images/exchange.png';
import transactionImage from '../../images/transaction.png';

import ContextMenu from '../../components/ContextMenu';
import WalletList from '../../components/WalletList';
import DateFilter from '../../components/DateFilter';
import WalletInput from '../../components/WalletInput';
import DepthSelector from '../../components/DepthSelector';
import AmountFilter from '../../components/AmountFilter';
import Tools from '../../components/Tools';

function GraphPage() {
  const [userApiKey, setUserApiKey] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState('usdt');
  const [walletInput, setWalletInput] = useState('');
  const [walletLabels, setWalletLabels] = useState({});
  useEffect(() => {
    const fetchWalletLabels = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch(
            `http://localhost:5000/api/wallets/labels?cryptoType=${selectedCrypto}`,
            {
              headers: {
                Authorization: token,
              },
            },
          );
          if (response.ok) {
            const labels = await response.json();
            setWalletLabels(labels);
          } else {
            console.error('Failed to fetch wallet labels');
          }
        }
      } catch (error) {
        console.error('Error fetching wallet labels:', error);
      }
    };

    fetchWalletLabels();
  }, [selectedCrypto]);

  const [addedWallets, setAddedWallets] = useState([]);

  const fetchAddedWallets = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch(
          `http://localhost:5000/api/wallets/?cryptoType=${selectedCrypto}`,
          {
            headers: {
              Authorization: token,
            },
          },
        );
        if (response.ok) {
          const wallets = await response.json();
          setAddedWallets(wallets);
          updateNodeColorsAndImages();
        } else {
          console.error('Failed to fetch added wallets');
        }
      }
    } catch (error) {
      console.error('Error fetching added wallets:', error);
    }
  };

  useEffect(() => {
    nodes.clear();
    edges.clear();
    setWalletLabels({});
    setNodeImages({});
    setSelectedDate('');
    fetchAddedWallets();
  }, [selectedCrypto]);

  const [nodes, setNodes] = useState(new DataSet([]));
  const [edges, setEdges] = useState(new DataSet([]));
  const networkRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState('');

  const [nodeImages, setNodeImages] = useState({});

  useEffect(() => {
    const fetchWalletImages = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch(
            `http://localhost:5000/api/wallets/images?cryptoType=${selectedCrypto}`,
            {
              headers: {
                Authorization: token,
              },
            },
          );
          if (response.ok) {
            const walletImages = await response.json();
            setNodeImages(walletImages);
          } else {
            console.error('Failed to fetch wallet images');
          }
        }
      } catch (error) {
        console.error('Error fetching wallet images:', error);
      }
    };

    fetchWalletImages();
  }, [selectedCrypto]);

  const updateNodeColorsAndImages = () => {
    nodes.forEach((node) => {
      const nodeId = node.id;
      const isAddedWallet = addedWallets.includes(nodeId);

      // Проверяем, является ли узел виртуальной вершиной транзакции BTC
      const isBTCTransaction = node && node.nodeType === 'transaction';

      // Определяем картинку по умолчанию на основе статуса кошелька или типа узла
      let nodeImage;
      if (isBTCTransaction) {
        nodeImage = transactionImage;
      } else {
        nodeImage = isAddedWallet ? salaryImage : generalImage;
      }

      const nodeColor = isAddedWallet ? 'orange' : 'lightblue';

      // Проверяем, есть ли пользовательская картинка для этого узла
      if (nodeImages[nodeId]) {
        switch (nodeImages[nodeId]) {
          case 'salary':
            nodeImage = salaryImage;
            break;
          case 'general':
            nodeImage = generalImage;
            break;
          case 'home':
            nodeImage = homeImage;
            break;
          case 'exchange':
            nodeImage = exchangeImage;
            break;
          // Возможно, стоит добавить default для обработки неожиданных значений
        }
      }

      nodes.update({
        ...node,
        shape: 'image',
        image: nodeImage,
        color: { background: nodeColor, border: nodeColor },
        brokenImage: nodeColor, // Этот параметр используется для задания цвета, если изображение не загрузится
      });
    });
  };

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    position: { x: 0, y: 0 },
    nodeId: null,
  });

  useEffect(() => {
    // Инициализация графа только один раз при монтировании компонента
    const options = {
      nodes: {
        shape: 'dot',
        size: 30,
        font: { size: 14, color: '#ffffff' },
        borderWidth: 2,
        color: { border: '#222222', background: '#666666' },
        shadow: { enabled: true, color: 'rgba(0,0,0,0.5)', size: 10, x: 5, y: 5 },
      },
      edges: {
        width: 2,
        length: 300,
        color: '#131313',
        shadow: true,
        font: { size: 12, color: '#131313' },
        smooth: { type: 'dynamic' },
      },
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springLength: 100,
          springConstant: 0.08,
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        navigationButtons: true,
        selectable: true,
        selectConnectedEdges: true,
        multiselect: true,
      },
    };

    if (!networkRef.current.network) {
      networkRef.current.network = new Network(networkRef.current, { nodes, edges }, options);

      networkRef.current.network.on('click', (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          setSelectedNode(nodeId);
          navigator.clipboard
            .writeText(nodeId)
            .then(() => {
              console.log('Адрес кошелька скопирован в буфер обмена');
            })
            .catch((err) => {
              console.error('Ошибка при копировании в буфер обмена: ', err);
            });
        } else {
          setSelectedNode(null);
        }
      });

      networkRef.current.network.on('oncontext', (params) => {
        params.event.preventDefault();
        const nodeId = networkRef.current.network.getNodeAt(params.pointer.DOM);

        if (nodeId) {
          setContextMenu({
            visible: true,
            position: { x: params.event.pageX, y: params.event.pageY },
            nodeId: nodeId,
          });
        }
      });
    }

    updateNodeColorsAndImages();
  }, [addedWallets]);

  const getTRC20Transfers = async (address) => {
    const url = `https://apilist.tronscan.org/api/token_trc20/transfers?limit=10000000&start=&sort=-timestamp&count=true&relatedAddress=${address}`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      data.token_transfers.forEach((transfer) => {
        const transferDate = new Date(transfer.block_ts).getTime();
        // Преобразование выбранной даты из строки в миллисекунды для сравнения
        const selectedDateMs = new Date(selectedDate).getTime();

        if (!selectedDate || transferDate >= selectedDateMs) {
          if (
            transfer.tokenInfo.tokenAbbr === 'USDT' &&
            parseInt(transfer.quant, 10) / Math.pow(10, 6) > 2
          ) {
            const fromAddress = transfer.from_address;
            const toAddress = transfer.to_address;
            const quant = parseInt(transfer.quant, 10) / Math.pow(10, 6); // Количество USDT
            const edgeId = `from:${fromAddress}_to:${toAddress}_quant:${quant}`;

            // Определяем цвет для добавленных и не добавленных кошельков
            const fromColor = addedWallets.includes(fromAddress) ? 'orange' : 'lightblue';
            const toColor = addedWallets.includes(toAddress) ? 'orange' : 'lightblue';

            // Проверяем, существует ли уже такое ребро
            if (!edges.get(edgeId)) {
              // Добавляем или обновляем узлы с нужным цветом
              if (!nodes.get(fromAddress)) {
                nodes.add({
                  id: fromAddress,
                  label: fromAddress,
                  color: { background: fromColor },
                });
              } else {
                nodes.update({ id: fromAddress, color: { background: fromColor } });
              }

              if (!nodes.get(toAddress)) {
                nodes.add({ id: toAddress, label: toAddress, color: { background: toColor } });
              } else {
                nodes.update({ id: toAddress, color: { background: toColor } });
              }

              // Добавляем ребро
              edges.add({
                id: edgeId,
                from: fromAddress,
                to: toAddress,
                label: `${quant} USDT`,
                arrows: 'to',
              });
            }
          }
        }
      });
    } catch (error) {
      console.error('Ошибка при получении данных: ', error);
    }
  };

  const getBTCTransfers = async (address) => {
    const url = `https://api.blockchair.com/bitcoin/dashboards/address/${address}`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      if (data.data && data.data[address] && data.data[address].transactions) {
        const transactionHashes = data.data[address].transactions;
        const virtualNodes = {};

        for (const txHash of transactionHashes) {
          const txUrl = `https://api.blockchair.com/bitcoin/dashboards/transaction/${txHash}`;
          const txResponse = await fetch(txUrl);
          if (!txResponse.ok) throw new Error(`HTTP error! status: ${txResponse.status}`);
          const txData = await txResponse.json();

          if (txData.data && txData.data[txHash]) {
            const transaction = txData.data[txHash].transaction;
            const transferDate = new Date(transaction.time).getTime();
            const selectedDateMs = new Date(selectedDate).getTime();

            if (!selectedDate || transferDate >= selectedDateMs) {
              if (txData.data[txHash].inputs.length > 1 || txData.data[txHash].outputs.length > 1) {
                if (!nodes.get(txHash)) {
                  virtualNodes[txHash] = {
                    id: txHash,
                    label: `Transaction ${txHash}`,
                    color: { background: 'gray' },
                    shape: 'dot',
                    nodeType: 'transaction',
                  };
                }
              }

              txData.data[txHash].inputs.forEach((input) => {
                if (input.recipient) {
                  const fromAddress = input.recipient;
                  const edgeId = `from:${fromAddress}_to:${txHash}_quant:${input.value}`;
                  const fromColor = addedWallets.includes(fromAddress) ? 'orange' : 'lightblue';

                  if (!edges.get(edgeId)) {
                    if (!nodes.get(fromAddress)) {
                      nodes.add({
                        id: fromAddress,
                        label: fromAddress,
                        color: { background: fromColor },
                      });
                    } else {
                      nodes.update({ id: fromAddress, color: { background: fromColor } });
                    }

                    if (virtualNodes[txHash] || !nodes.get(txHash)) {
                      edges.add({
                        id: edgeId,
                        from: fromAddress,
                        to: txHash,
                        label: `${input.value / Math.pow(10, 8)} BTC`,
                        arrows: 'to',
                      });
                    }
                  }
                }
              });

              txData.data[txHash].outputs.forEach((output) => {
                const toAddress = output.recipient;
                const quant = output.value / Math.pow(10, 8);
                const edgeId = `from:${txHash}_to:${toAddress}_quant:${quant}`;
                const toColor = addedWallets.includes(toAddress) ? 'orange' : 'lightblue';

                if (quant > 0.00000000000000001) {
                  if (!edges.get(edgeId)) {
                    if (!nodes.get(toAddress)) {
                      nodes.add({
                        id: toAddress,
                        label: toAddress,
                        color: { background: toColor },
                      });
                    } else {
                      nodes.update({ id: toAddress, color: { background: toColor } });
                    }

                    if (virtualNodes[txHash] || !nodes.get(txHash)) {
                      edges.add({
                        id: edgeId,
                        from: txHash,
                        to: toAddress,
                        label: `${quant} BTC`,
                        arrows: 'to',
                      });
                    }
                  }
                }
              });
            }
          }
        }

        const newVirtualNodes = Object.values(virtualNodes).filter((node) => !nodes.get(node.id));
        nodes.add(newVirtualNodes);
      }
    } catch (error) {
      console.error('Error fetching data: ', error);
    }
  };

  const getETHTransfers = async (address) => {
    const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=30&sort=desc&apikey=${userApiKey}`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.status === '1') {
        data.result.forEach((transfer) => {
          const transferDate = new Date(transfer.timeStamp * 1000).getTime(); // Преобразование времени из секунд в миллисекунды
          const selectedDateMs = new Date(selectedDate).getTime();
          if (!selectedDate || transferDate >= selectedDateMs) {
            const toAddress = transfer.to;
            const quant = transfer.value / Math.pow(10, 18); // Количество ETH
            if (quant > 0.001) {
              // Фильтруем транзакции с количеством больше 0.001 ETH
              const fromAddress = transfer.from;
              const edgeId = `from:${fromAddress}_to:${toAddress}_quant:${quant}`;
              const fromColor = addedWallets.includes(fromAddress) ? 'orange' : 'lightblue';
              const toColor = addedWallets.includes(toAddress) ? 'orange' : 'lightblue';
              if (!edges.get(edgeId)) {
                if (!nodes.get(fromAddress)) {
                  nodes.add({
                    id: fromAddress,
                    label: fromAddress,
                    color: { background: fromColor },
                  });
                } else {
                  nodes.update({ id: fromAddress, color: { background: fromColor } });
                }
                if (!nodes.get(toAddress)) {
                  nodes.add({ id: toAddress, label: toAddress, color: { background: toColor } });
                } else {
                  nodes.update({ id: toAddress, color: { background: toColor } });
                }
                edges.add({
                  id: edgeId,
                  from: fromAddress,
                  to: toAddress,
                  label: `${quant} ETH`,
                  arrows: 'to',
                });
              }
            }
          }
        });
      } else {
        console.error('Ошибка при получении данных: ', data.message);
      }
    } catch (error) {
      console.error('Ошибка при получении данных: ', error);
    }
  };
  const getERC20Transfers = async (address, selectedToken) => {
    const url = `https://api.etherscan.io/api?module=account&action=tokentx&address=${address}&page=1&offset=100&startblock=0&endblock=27025780&sort=asc&apikey=${userApiKey}`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.status === '1') {
        data.result.forEach((transfer) => {
          if (transfer.tokenSymbol === selectedToken) {
            const transferDate = new Date(transfer.timeStamp * 1000).getTime();
            const selectedDateMs = new Date(selectedDate).getTime();
            if (!selectedDate || transferDate >= selectedDateMs) {
              const toAddress = transfer.to;
              const quant = transfer.value / Math.pow(10, transfer.tokenDecimal);
              if (quant > 0.001) {
                const fromAddress = transfer.from;
                const edgeId = `from:${fromAddress}_to:${toAddress}_quant:${quant}`;
                const fromColor = addedWallets.includes(fromAddress) ? 'orange' : 'lightblue';
                const toColor = addedWallets.includes(toAddress) ? 'orange' : 'lightblue';
                if (!edges.get(edgeId)) {
                  if (!nodes.get(fromAddress)) {
                    nodes.add({
                      id: fromAddress,
                      label: fromAddress,
                      color: { background: fromColor },
                    });
                  } else {
                    nodes.update({ id: fromAddress, color: { background: fromColor } });
                  }
                  if (!nodes.get(toAddress)) {
                    nodes.add({ id: toAddress, label: toAddress, color: { background: toColor } });
                  } else {
                    nodes.update({ id: toAddress, color: { background: toColor } });
                  }
                  edges.add({
                    id: edgeId,
                    from: fromAddress,
                    to: toAddress,
                    label: `${quant} ${transfer.tokenSymbol}`,
                    arrows: 'to',
                  });
                }
              }
            }
          }
        });
      } else {
        console.error('Ошибка при получении данных: ', data.message);
      }
    } catch (error) {
      console.error('Ошибка при получении данных: ', error);
    }
  };

  const removeWallet = async (walletToRemove) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch(
          `http://localhost:5000/api/wallets/${walletToRemove}?cryptoType=${selectedCrypto}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: token,
            },
          },
        );
        if (response.ok) {
          // Удаление записи о картинке, связанной с кошельком
          await fetch(
            `http://localhost:5000/api/wallets/image?walletAddress=${walletToRemove}&cryptoType=${selectedCrypto}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: token,
              },
            },
          );

          // Удаление записи о подписи, связанной с кошельком
          await fetch(
            `http://localhost:5000/api/wallets/label?walletAddress=${walletToRemove}&cryptoType=${selectedCrypto}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: token,
              },
            },
          );

          // Обновляем список добавленных кошельков
          const updatedAddedWallets = addedWallets.filter((wallet) => wallet !== walletToRemove);
          setAddedWallets(updatedAddedWallets);

          if (selectedCrypto === 'btc') {
            // Для Bitcoin изменяем логику удаления
            const findConnectedNodes = (nodeId, callback) => {
              edges.get().forEach((edge) => {
                if (edge.from === nodeId) {
                  callback(edge.to);
                } else if (edge.to === nodeId) {
                  callback(edge.from);
                }
              });
            };

            const transactionsToRemove = new Set();

            const processConnectedNode = (nodeId) => {
              if (nodes.get(nodeId) && nodes.get(nodeId).nodeType === 'transaction') {
                let hasOtherAddedWallet = false;
                findConnectedNodes(nodeId, (connectedNode) => {
                  if (updatedAddedWallets.includes(connectedNode)) {
                    hasOtherAddedWallet = true;
                  }
                });

                if (!hasOtherAddedWallet) {
                  transactionsToRemove.add(nodeId);
                  findConnectedNodes(nodeId, processConnectedNode);
                }
              }
            };

            findConnectedNodes(walletToRemove, processConnectedNode);

            const nodesToRemove = new Set();
            transactionsToRemove.forEach((transactionId) => {
              findConnectedNodes(transactionId, (connectedNode) => {
                if (
                  !updatedAddedWallets.includes(connectedNode) &&
                  connectedNode !== walletToRemove
                ) {
                  nodesToRemove.add(connectedNode);
                }
              });
            });

            const edgesToRemove = edges
              .get()
              .filter(
                (edge) =>
                  (transactionsToRemove.has(edge.from) && !updatedAddedWallets.includes(edge.to)) ||
                  (transactionsToRemove.has(edge.to) && !updatedAddedWallets.includes(edge.from)),
              )
              .map((edge) => edge.id);

            edges.remove(edgesToRemove);
            nodes.remove(Array.from(nodesToRemove));
            nodes.remove(Array.from(transactionsToRemove));

            // Проверяем, остались ли у удаляемого кошелька связанные транзакции
            let hasRemainingTransactions = false;
            findConnectedNodes(walletToRemove, (connectedNode) => {
              if (nodes.get(connectedNode) && nodes.get(connectedNode).nodeType === 'transaction') {
                hasRemainingTransactions = true;
              }
            });
            // Если у удаляемого кошелька не осталось связанных транзакций, удаляем его с графа
            if (!hasRemainingTransactions) {
              nodes.remove(walletToRemove);
            }

            // Обновляем картинки для оставшихся узлов
            updateNodeColorsAndImages();
            for (const nodeId of [...nodesToRemove, ...transactionsToRemove]) {
              if (walletLabels[nodeId]) {
                await fetch(
                  `http://localhost:5000/api/wallets/label?walletAddress=${nodeId}&cryptoType=${selectedCrypto}`,
                  {
                    method: 'DELETE',
                    headers: {
                      Authorization: token,
                    },
                  },
                );
              }
              if (nodeImages[nodeId]) {
                await fetch(
                  `http://localhost:5000/api/wallets/image?walletAddress=${nodeId}&cryptoType=${selectedCrypto}`,
                  {
                    method: 'DELETE',
                    headers: {
                      Authorization: token,
                    },
                  },
                );
              }
            }
            updateGraphLabels();
          } else {
            // Для других криптовалют используем предыдущую логику удаления
            // Собираем ID всех рёбер для удаления
            const edgesToRemove = edges
              .get()
              .filter(
                (edge) =>
                  (edge.from === walletToRemove && !updatedAddedWallets.includes(edge.to)) ||
                  (edge.to === walletToRemove && !updatedAddedWallets.includes(edge.from)),
              )
              .map((edge) => edge.id);

            // Удаляем рёбра
            edges.remove(edgesToRemove);

            // Получаем обновлённый список всех рёбер после удаления
            const remainingEdges = edges.get();

            // Определяем, какие узлы остались без рёбер после удаления и должны быть удалены
            const nodesWithEdges = new Set();
            remainingEdges.forEach((edge) => {
              nodesWithEdges.add(edge.from);
              nodesWithEdges.add(edge.to);
            });

            // Получаем все текущие узлы
            const allNodes = nodes.get();

            // Узлы для удаления — это те, которые не включены в nodesWithEdges
            const nodesToRemove = allNodes
              .filter((node) => !nodesWithEdges.has(node.id))
              .map((node) => node.id);

            // Удаляем узлы, которые больше не связаны ни с одним ребром
            nodes.remove(nodesToRemove);

            // Удаляем подписи и картинки для удаленных узлов
            for (const nodeId of nodesToRemove) {
              await fetch(
                `http://localhost:5000/api/wallets/label?walletAddress=${nodeId}&cryptoType=${selectedCrypto}`,
                {
                  method: 'DELETE',
                  headers: {
                    Authorization: token,
                  },
                },
              );
              await fetch(
                `http://localhost:5000/api/wallets/image?walletAddress=${nodeId}&cryptoType=${selectedCrypto}`,
                {
                  method: 'DELETE',
                  headers: {
                    Authorization: token,
                  },
                },
              );
            }
            for (const nodeId of nodesToRemove) {
              if (walletLabels[nodeId]) {
                await fetch(
                  `http://localhost:5000/api/wallets/label?walletAddress=${nodeId}&cryptoType=${selectedCrypto}`,
                  {
                    method: 'DELETE',
                    headers: {
                      Authorization: token,
                    },
                  },
                );
              }
              if (nodeImages[nodeId]) {
                await fetch(
                  `http://localhost:5000/api/wallets/image?walletAddress=${nodeId}&cryptoType=${selectedCrypto}`,
                  {
                    method: 'DELETE',
                    headers: {
                      Authorization: token,
                    },
                  },
                );
              }
            }
            updateGraphLabels();
          }

          // Удаляем подпись удаляемого кошелька из состояния walletLabels
          const updatedLabels = { ...walletLabels };
          delete updatedLabels[walletToRemove];
          setWalletLabels(updatedLabels);

          // Удаляем измененную картинку удаляемого кошелька из состояния nodeImages
          const updatedImages = { ...nodeImages };
          delete updatedImages[walletToRemove];
          setNodeImages(updatedImages);

          // Обновляем состояние для отображения изменений
          setNodes(nodes);
          setEdges(edges);
        } else {
          console.error('Failed to remove wallet');
        }
      }
    } catch (error) {
      console.error('Error removing wallet:', error);
    }
  };

  const updateGraphLabels = () => {
    nodes.forEach((node) => {
      const nodeId = node.id;
      const isTransaction = node.nodeType === 'transaction';

      if (!isTransaction) {
        const label = walletLabels[nodeId] || node.id;
        nodes.update({ id: nodeId, label: label });
      }
    });
  };
  useEffect(() => {
    // Функция для обработки клика вне контекстного меню
    const handleClickOutside = (event) => {
      if (contextMenu.visible && !event.target.closest('.context-menu')) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };

    // Добавление обработчика события клика к документу
    document.addEventListener('click', handleClickOutside);

    // Удаление обработчика события при размонтировании компонента
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu]);

  const saveDataToLocalStorage = () => {
    localStorage.setItem('selectedDate', selectedDate.toString());
  };

  useEffect(() => {
    saveDataToLocalStorage();
  }, [selectedDate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.location.href = '/login';
  };

  const [selectedDepth, setSelectedDepth] = useState(1);
  const [minAmount, setMinAmount] = useState(0);
  const [maxAmount, setMaxAmount] = useState(100000);
  const [selectedNode, setSelectedNode] = useState(null);

  const applyFilters = () => {
    // Сбрасываем скрытие для всех узлов и ребер
    nodes.update(
      nodes.map((node) => ({
        ...node,
        hidden: false,
      })),
    );

    edges.update(
      edges.map((edge) => ({
        ...edge,
        hidden: false,
      })),
    );

    // Применяем фильтрацию по сумме
    const filteredEdgesByAmount = edges.get().map((edge) => {
      const amount = parseFloat(edge.label.split(' ')[0]);
      return {
        ...edge,
        hidden: amount < minAmount || amount > maxAmount,
      };
    });

    const visibleNodeIdsByAmount = new Set();
    filteredEdgesByAmount.forEach((edge) => {
      if (!edge.hidden) {
        visibleNodeIdsByAmount.add(edge.from);
        visibleNodeIdsByAmount.add(edge.to);
      }
    });

    const filteredNodesByAmount = nodes.get().map((node) => ({
      ...node,
      hidden: !visibleNodeIdsByAmount.has(node.id),
    }));

    // Применяем фильтрацию по выбранной вершине и глубине
    if (selectedNode) {
      const connectedNodes = new Set();
      const visitedNodes = new Set();

      const traverseConnectedNodes = (nodeId, currentDepth) => {
        if (currentDepth > selectedDepth || visitedNodes.has(nodeId)) return;

        visitedNodes.add(nodeId);
        connectedNodes.add(nodeId);

        filteredEdgesByAmount.forEach((edge) => {
          if (!edge.hidden) {
            if (edge.from === nodeId) {
              traverseConnectedNodes(edge.to, currentDepth + 1);
            } else if (edge.to === nodeId) {
              traverseConnectedNodes(edge.from, currentDepth + 1);
            }
          }
        });
      };

      traverseConnectedNodes(selectedNode, 0);

      filteredNodesByAmount.forEach((node) => {
        if (!connectedNodes.has(node.id)) {
          node.hidden = true;
        }
      });

      filteredEdgesByAmount.forEach((edge) => {
        if (!connectedNodes.has(edge.from) || !connectedNodes.has(edge.to)) {
          edge.hidden = true;
        }
      });
    }

    // Применяем отфильтрованные узлы и ребра к графу
    nodes.update(filteredNodesByAmount);
    edges.update(filteredEdgesByAmount);
  };

  useEffect(() => {
    applyFilters();
  }, [selectedNode, selectedDepth, minAmount, maxAmount]);

  return (
    <div className="App">
      <div className="sidebarWrapper">
        <div className="sidebar">
          <div className="sidebar-content">
            <h1>USDT Transaction Graph</h1>
            <WalletInput
              walletInput={walletInput}
              setWalletInput={setWalletInput}
              addedWallets={addedWallets}
              setAddedWallets={setAddedWallets}
              getTRC20Transfers={getTRC20Transfers}
              getBTCTransfers={getBTCTransfers}
              getETHTransfers={getETHTransfers}
              getERC20Transfers={getERC20Transfers}
              updateNodeColorsAndImages={updateNodeColorsAndImages}
              selectedCrypto={selectedCrypto}
              setSelectedCrypto={setSelectedCrypto}
              userApiKey={userApiKey}
              setUserApiKey={setUserApiKey}
            />
            <DateFilter
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              nodes={nodes}
              edges={edges}
              addedWallets={addedWallets}
              updateNodeColorsAndImages={updateNodeColorsAndImages}
              updateGraphLabels={updateGraphLabels}
              getTRC20Transfers={getTRC20Transfers}
              getBTCTransfers={getBTCTransfers}
              getETHTransfers={getETHTransfers}
              getERC20Transfers={getERC20Transfers}
              selectedCrypto={selectedCrypto}
            />
            <DepthSelector selectedDepth={selectedDepth} setSelectedDepth={setSelectedDepth} />
            <AmountFilter
              minAmount={minAmount}
              setMinAmount={setMinAmount}
              maxAmount={maxAmount}
              setMaxAmount={setMaxAmount}
            />
            <Tools
              nodes={nodes}
              edges={edges}
              addedWallets={addedWallets}
              getTRC20Transfers={getTRC20Transfers}
              getBTCTransfers={getBTCTransfers}
              getETHTransfers={getETHTransfers}
              getERC20Transfers={getERC20Transfers}
              updateNodeColorsAndImages={updateNodeColorsAndImages}
              selectedCrypto={selectedCrypto}
              updateGraphLabels={updateGraphLabels}
              nodeImages={nodeImages}
              walletLabels={walletLabels}
              setAddedWallets={setAddedWallets}
              setWalletLabels={setWalletLabels}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              setNodeImages={setNodeImages}
            />
            <WalletList
              addedWallets={addedWallets}
              walletLabels={walletLabels}
              setWalletLabels={setWalletLabels}
              nodes={nodes}
              setNodes={setNodes}
              removeWallet={removeWallet}
              selectedCrypto={selectedCrypto}
            />
            <button onClick={handleLogout}>Выйти</button>
          </div>

        </div>
      </div>
      <div className="main-content">
        <div id="mynetwork" ref={networkRef} />
      </div>

      <ContextMenu
        visible={contextMenu.visible}
        position={contextMenu.position}
        nodeId={contextMenu.nodeId}
        walletLabels={walletLabels}
        setWalletLabels={setWalletLabels} // Передача setWalletLabels
        nodes={nodes}
        setNodes={setNodes}
        nodeImages={nodeImages}
        setNodeImages={setNodeImages}
        addedWallets={addedWallets}
        selectedCrypto={selectedCrypto}
      />
    </div>
  );
}

export default GraphPage;
