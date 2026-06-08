import React from 'react';
import ClearButton from './ClearButton';
import DrawGraphButton from './DrawGraphButton';
import ExportData from './ExportData';
import ImportData from './ImportData';
const Tools = ({
    nodes,
    edges,
    addedWallets,
    getTRC20Transfers,
    getBTCTransfers,
    getETHTransfers,
    getERC20Transfers,
    updateNodeColorsAndImages,
    selectedCrypto,
    updateGraphLabels,
    nodeImages,
    walletLabels,
    setAddedWallets,
    setWalletLabels,
    selectedDate,
    setSelectedDate,
    setNodeImages
}) => {
    return (
        <div className='tools'>
            <ClearButton nodes={nodes} edges={edges} />
            <DrawGraphButton
                addedWallets={addedWallets}
                getTRC20Transfers={getTRC20Transfers}
                getBTCTransfers={getBTCTransfers}
                getETHTransfers={getETHTransfers}
                getERC20Transfers={getERC20Transfers}
                updateNodeColorsAndImages={updateNodeColorsAndImages}
                selectedCrypto={selectedCrypto}
                updateGraphLabels={updateGraphLabels}
                nodes={nodes}
                nodeImages={nodeImages}
                walletLabels={walletLabels}
            />
            <ExportData
                addedWallets={addedWallets}
                walletLabels={walletLabels}
                selectedDate={selectedDate}
                nodeImages={nodeImages}
            />
            <ImportData
                setAddedWallets={setAddedWallets}
                setWalletLabels={setWalletLabels}
                setSelectedDate={setSelectedDate}
                setNodeImages={setNodeImages}
                updateNodeColorsAndImages={updateNodeColorsAndImages}
                selectedCrypto={selectedCrypto}
            />
        </div>
    );
};

export default Tools;