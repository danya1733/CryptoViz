const formatInteger = (value) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value || 0);

const formatAmount = (value) =>
  new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 4,
  }).format(value || 0);

const formatPercent = (value) =>
  new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format((value || 0) * 100);

const shortenAddress = (value) => {
  if (!value) {
    return '-';
  }

  const address = String(value);
  if (address.length <= 18) {
    return address;
  }

  return `${address.slice(0, 8)}...${address.slice(-6)}`;
};

const getMetricLabel = (metric, walletLabels = {}) => {
  if (!metric) {
    return '-';
  }

  return walletLabels[metric.id] || metric.label || metric.id;
};

const getAddressLabel = (address, walletLabels = {}) => walletLabels[address] || shortenAddress(address);

const formatVolumes = (volumes) => {
  if (!volumes || volumes.length === 0) {
    return '0';
  }

  return volumes
    .slice(0, 2)
    .map(({ asset, amount }) => `${formatAmount(amount)} ${asset}`)
    .join(', ');
};

const Stat = ({ label, value }) => (
  <div className="analysis-stat">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const SignalBadge = ({ signal }) => (
  <div className={`analysis-signal analysis-signal-${signal?.type || 'none'}`}>
    <span>{signal?.title || 'Без устойчивого признака'}</span>
    {signal?.confidence && <small>{signal.confidence}</small>}
  </div>
);

const SecondarySignals = ({ signals }) => {
  if (!signals || signals.length === 0) {
    return null;
  }

  return (
    <div className="analysis-secondary-signals">
      <span>Дополнительно</span>
      {signals.map((signal) => (
        <small key={signal.type}>{signal.title}</small>
      ))}
    </div>
  );
};

const GraphAnalysisPanel = ({ analysis, selectedNode, walletLabels }) => {
  const summary = analysis?.summary;
  const selectedMetric = analysis?.selectedMetric;

  return (
    <div className="graph-analysis-overlay" aria-label="Аналитика графа">
      <section className="analysis-card analysis-card-left">
        <div className="analysis-card-header">
          <p>Анализ графа</p>
          <span>видимый фрагмент</span>
        </div>

        <div className="analysis-stats-grid">
          <Stat label="Вершин" value={formatInteger(summary?.visibleNodeCount)} />
          <Stat label="Адресов" value={formatInteger(summary?.visibleAddressCount)} />
          <Stat label="Служебных узлов" value={formatInteger(summary?.visibleTransactionNodeCount)} />
          <Stat label="Переводов" value={formatInteger(summary?.visibleEdgeCount)} />
          <Stat label="Компонент" value={formatInteger(summary?.componentCount)} />
        </div>

        <div className="analysis-details">
          <div>
            <span>Общий объем</span>
            <strong>{formatVolumes(summary?.totalVolumeByAsset)}</strong>
          </div>
          <div>
            <span>Основной получатель</span>
            <strong title={summary?.topReceiver?.id || ''}>
              {summary?.topReceiver ? getMetricLabel(summary.topReceiver, walletLabels) : '-'}
            </strong>
          </div>
          <div>
            <span>Основная связка</span>
            <strong title={summary?.topLink?.label || ''}>
              {summary?.topLink ? `${shortenAddress(summary.topLink.label)} (${formatAmount(summary.topLink.amount)})` : '-'}
            </strong>
          </div>
        </div>
      </section>

      <section className="analysis-card analysis-card-right">
        <div className="analysis-card-header">
          <p>Выбранная вершина</p>
          <span>{selectedNode ? 'с учетом фильтров' : 'нет выбора'}</span>
        </div>

        {!selectedNode && <p className="analysis-empty">Нажмите на адрес в графе, чтобы увидеть свойства вершины.</p>}

        {selectedNode && !selectedMetric && (
          <p className="analysis-empty">Выбранная вершина скрыта текущими фильтрами или отсутствует в видимом фрагменте.</p>
        )}

        {selectedMetric && (
          <>
            <div className="analysis-node-title" title={selectedMetric.id}>
              {selectedMetric.nodeType === 'transaction'
                ? 'Служебный узел BTC-транзакции'
                : getMetricLabel(selectedMetric, walletLabels)}
            </div>

            <SignalBadge signal={selectedMetric.signal} />
            <SecondarySignals signals={selectedMetric.secondarySignals} />

            {selectedMetric.nodeType !== 'transaction' && (
              <>
                <div className="analysis-stats-grid">
                  <Stat label="Входящих" value={formatInteger(selectedMetric.incomingCount)} />
                  <Stat label="Исходящих" value={formatInteger(selectedMetric.outgoingCount)} />
                  <Stat label="Отправителей" value={formatInteger(selectedMetric.uniqueSenderCount)} />
                  <Stat label="Получателей" value={formatInteger(selectedMetric.uniqueRecipientCount)} />
                </div>

                <div className="analysis-details">
                  <div>
                    <span>Входящий объем</span>
                    <strong>{formatAmount(selectedMetric.incomingVolume)}</strong>
                  </div>
                  <div>
                    <span>Исходящий объем</span>
                    <strong>{formatAmount(selectedMetric.outgoingVolume)}</strong>
                  </div>
                  <div>
                    <span>Основной получатель</span>
                    <strong title={selectedMetric.mainRecipient || ''}>
                      {getAddressLabel(selectedMetric.mainRecipient, walletLabels)}
                    </strong>
                  </div>
                  <div>
                    <span>Доля направления</span>
                    <strong>{formatPercent(selectedMetric.mainRecipientVolumeShare)}%</strong>
                  </div>
                </div>
              </>
            )}

            {selectedMetric.signal?.reason && <p className="analysis-reason">{selectedMetric.signal.reason}</p>}
            {selectedMetric.signal?.description && <p className="analysis-description">{selectedMetric.signal.description}</p>}
          </>
        )}
      </section>
    </div>
  );
};

export default GraphAnalysisPanel;
