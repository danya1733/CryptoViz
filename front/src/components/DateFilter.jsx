import React from 'react';
import DatePicker,{registerLocale } from 'react-datepicker';
import ru from "date-fns/locale/ru";

registerLocale("ru", ru);
const DateFilter = ({ selectedDate, setSelectedDate, nodes, edges, addedWallets, updateNodeColorsAndImages, updateGraphLabels, getTRC20Transfers, getBTCTransfers, getETHTransfers, getERC20Transfers, selectedCrypto }) => {

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const drawGraph = async () => {
    nodes.clear();
    edges.clear();
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
  };
  const handleDateChange = async (date) => {
    const formattedDate = date ? date.toISOString().split('T')[0] : '';
    setSelectedDate(formattedDate);
    await drawGraph();
  };
  return (
    <div id="date-filter-container">
      <DatePicker
        selected={selectedDate ? new Date(selectedDate) : null}
        onChange={handleDateChange}
        wrapperClassName='date-picker'
        locale="ru"
        value={selectedDate || ''} // Добавьте эту строку
        customInput={<input type="date" className="custom-date-input" />}
      />

    </div>
  );
};

export default DateFilter;