const EMPTY_SIGNAL = {
  type: 'ordinary',
  title: 'Обычный адрес',
  description: 'По видимому фрагменту адрес не показывает массовую активность и не проходит условия депозитного или сервисного паттерна.',
  confidence: 'Базовый признак',
};

const SERVICE_SIGNAL = {
  type: 'service',
  title: 'Возможный сервисный адрес биржи или обменника',
  description:
    'Адрес показывает массовую активность по числу переводов, операциям аккаунта или массовым связям в видимом графе.',
};

const DEPOSIT_SIGNAL = {
  type: 'deposit',
  title: 'Возможный депозитный адрес сервиса',
  description:
    'Адрес принимает переводы от разных отправителей и почти всегда направляет средства одному основному получателю.',
};

const BRIDGE_SIGNAL = {
  type: 'bridge',
  title: 'Связующий адрес между группами',
  description: 'Адрес соединяет части видимого графа и важен по своему положению в структуре цепочки.',
  confidence: 'Структурный признак',
};

const SERVICE_ACTIVITY_LIMITS = {
  minExternalRangeTotal: 10000,
  minExternalTransactions: 10000,
  minLocalSameDirectionCounterpartCount: 100,
  minLocalSameDirectionTransferCount: 1000,
  maxDepositUniqueSenderCount: 20,
};

const toNumber = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const parseEdgeAmount = (edge) => {
  if (Number.isFinite(Number(edge.amount))) {
    return Number(edge.amount);
  }

  const [amount] = String(edge.label || '').split(' ');
  const parsed = Number.parseFloat(amount.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseEdgeAsset = (edge) => {
  if (edge.asset) {
    return edge.asset;
  }

  const [, asset] = String(edge.label || '').split(' ');
  return asset || '';
};

const createEmptyNodeMetric = (node) => ({
  id: node.id,
  label: node.label || node.id,
  nodeType: node.nodeType || 'address',
  externalActivity: null,
  incomingCount: 0,
  outgoingCount: 0,
  incomingVolume: 0,
  outgoingVolume: 0,
  uniqueSenders: new Set(),
  uniqueRecipients: new Set(),
  senderVolumes: new Map(),
  senderCounts: new Map(),
  recipientVolumes: new Map(),
  recipientCounts: new Map(),
  mainSender: null,
  mainSenderVolume: 0,
  mainSenderCount: 0,
  mainRecipient: null,
  mainRecipientVolume: 0,
  mainRecipientCount: 0,
  mainRecipientVolumeShare: 0,
  mainRecipientTransferShare: 0,
  signal: EMPTY_SIGNAL,
});

const getVisibleGraph = (nodes, edges) => {
  const visibleNodes = nodes.filter((node) => node.hidden !== true);
  const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
  const visibleEdges = edges.filter(
    (edge) => edge.hidden !== true && visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to),
  );

  return { visibleNodes, visibleEdges, visibleNodeIds };
};

const getComponents = (nodeIds, edges) => {
  const adjacency = new Map();
  nodeIds.forEach((nodeId) => adjacency.set(nodeId, new Set()));

  edges.forEach((edge) => {
    if (!adjacency.has(edge.from) || !adjacency.has(edge.to)) {
      return;
    }

    adjacency.get(edge.from).add(edge.to);
    adjacency.get(edge.to).add(edge.from);
  });

  const visited = new Set();
  let count = 0;

  nodeIds.forEach((startNodeId) => {
    if (visited.has(startNodeId)) {
      return;
    }

    count += 1;
    const stack = [startNodeId];
    visited.add(startNodeId);

    while (stack.length > 0) {
      const currentNodeId = stack.pop();
      adjacency.get(currentNodeId).forEach((nextNodeId) => {
        if (!visited.has(nextNodeId)) {
          visited.add(nextNodeId);
          stack.push(nextNodeId);
        }
      });
    }
  });

  return count;
};

const getArticulationPoints = (nodeIds, edges) => {
  const adjacency = new Map();
  nodeIds.forEach((nodeId) => adjacency.set(nodeId, new Set()));

  edges.forEach((edge) => {
    if (!adjacency.has(edge.from) || !adjacency.has(edge.to)) {
      return;
    }

    adjacency.get(edge.from).add(edge.to);
    adjacency.get(edge.to).add(edge.from);
  });

  const visited = new Set();
  const discovery = new Map();
  const low = new Map();
  const parent = new Map();
  const articulationPoints = new Set();
  let time = 0;

  const visit = (nodeId) => {
    visited.add(nodeId);
    discovery.set(nodeId, time);
    low.set(nodeId, time);
    time += 1;

    let childCount = 0;

    adjacency.get(nodeId).forEach((nextNodeId) => {
      if (!visited.has(nextNodeId)) {
        childCount += 1;
        parent.set(nextNodeId, nodeId);
        visit(nextNodeId);

        low.set(nodeId, Math.min(low.get(nodeId), low.get(nextNodeId)));

        if (!parent.has(nodeId) && childCount > 1) {
          articulationPoints.add(nodeId);
        }

        if (parent.has(nodeId) && low.get(nextNodeId) >= discovery.get(nodeId)) {
          articulationPoints.add(nodeId);
        }
      } else if (nextNodeId !== parent.get(nodeId)) {
        low.set(nodeId, Math.min(low.get(nodeId), discovery.get(nextNodeId)));
      }
    });
  };

  nodeIds.forEach((nodeId) => {
    if (!visited.has(nodeId)) {
      visit(nodeId);
    }
  });

  return articulationPoints;
};

const findLargestMapEntry = (map) => {
  let bestKey = null;
  let bestValue = 0;

  map.forEach((value, key) => {
    if (value > bestValue) {
      bestKey = key;
      bestValue = value;
    }
  });

  return { key: bestKey, value: bestValue };
};

const getTopMapKeys = (map, limit = 3) =>
  Array.from(map.entries())
    .sort(([, firstValue], [, secondValue]) => secondValue - firstValue)
    .slice(0, limit)
    .map(([key]) => key);

const getExternalActivity = (externalActivityById, address) => {
  if (!address || !externalActivityById) {
    return null;
  }

  return externalActivityById[address] || null;
};

const isDepositPattern = (metric) =>
  metric.uniqueSenderCount >= 3 &&
  metric.uniqueSenderCount <= SERVICE_ACTIVITY_LIMITS.maxDepositUniqueSenderCount &&
  metric.outgoingCount > 0 &&
  metric.uniqueRecipientCount <= 2 &&
  metric.mainRecipientVolumeShare >= 0.8;

const hasMassiveExternalActivity = (activity) => {
  if (!activity || activity.error) {
    return false;
  }

  const transactionCount = Math.max(
    toNumber(activity.transactions),
    toNumber(activity.totalTransactionCount),
  );
  const rangeTotal = Math.max(toNumber(activity.rangeTotal), toNumber(activity.total));

  return (
    rangeTotal >= SERVICE_ACTIVITY_LIMITS.minExternalRangeTotal ||
    transactionCount >= SERVICE_ACTIVITY_LIMITS.minExternalTransactions
  );
};

const hasMassiveLocalActivity = (metric) => {
  const totalTransferCount = metric.incomingCount + metric.outgoingCount;
  const totalCounterpartCount = metric.uniqueSenderCount + metric.uniqueRecipientCount;
  const hasMassiveOutgoingFanOut =
    metric.outgoingCount >= SERVICE_ACTIVITY_LIMITS.minLocalSameDirectionTransferCount &&
    metric.uniqueRecipientCount >= SERVICE_ACTIVITY_LIMITS.minLocalSameDirectionCounterpartCount;
  const hasMixedMassiveActivity =
    totalTransferCount >= SERVICE_ACTIVITY_LIMITS.minLocalSameDirectionTransferCount &&
    totalCounterpartCount >= SERVICE_ACTIVITY_LIMITS.minLocalSameDirectionCounterpartCount &&
    metric.uniqueRecipientCount > 2 &&
    metric.uniqueSenderCount > 2;

  return hasMassiveOutgoingFanOut || hasMixedMassiveActivity;
};

const formatExternalActivityReason = (activity) => {
  if (!activity || activity.error) {
    return '';
  }

  const rangeTotal = Math.max(toNumber(activity.rangeTotal), toNumber(activity.total));
  const transactionCount = Math.max(
    toNumber(activity.transactions),
    toNumber(activity.totalTransactionCount),
  );
  const sampleCounterpartCount = Math.max(
    toNumber(activity.sampleUniqueSenderCount),
    toNumber(activity.sampleUniqueRecipientCount),
  );

  const details = [];
  if (rangeTotal > 0) {
    details.push(`${rangeTotal.toLocaleString('ru-RU')} переводов в истории`);
  }
  if (transactionCount > 0) {
    details.push(`${transactionCount.toLocaleString('ru-RU')} операций аккаунта`);
  }
  if (sampleCounterpartCount > 0) {
    details.push(`${sampleCounterpartCount.toLocaleString('ru-RU')} контрагентов в проверочной выборке`);
  }

  return details.join(', ');
};

const getPrimarySignal = ({
  metric,
  depositRecipientCounts,
}) => {
  if (metric.nodeType === 'transaction') {
    return {
      type: 'transaction',
      title: 'Служебный узел BTC-транзакции',
      description: 'Узел используется для отображения входов и выходов сложной Bitcoin-транзакции.',
      confidence: 'Служебный элемент',
    };
  }

  const depositLinksToAddress = depositRecipientCounts.get(metric.id) || 0;
  const hasExternalServicePattern = hasMassiveExternalActivity(metric.externalActivity);
  const hasDepositPattern = isDepositPattern(metric);
  const hasLocalServicePattern = hasMassiveLocalActivity(metric);
  const hasServicePattern =
    hasExternalServicePattern ||
    hasLocalServicePattern;

  if (hasServicePattern) {
    const externalReason = formatExternalActivityReason(metric.externalActivity);
    let reason = `${metric.uniqueSenderCount} уникальных отправителей, ${metric.uniqueRecipientCount} уникальных получателей, ${metric.incomingCount} входящих и ${metric.outgoingCount} исходящих переводов.`;

    if (depositLinksToAddress >= 1) {
      reason = `${depositLinksToAddress} адрес с депозитным паттерном направляет средства на этот адрес.`;
    }

    if (externalReason) {
      reason = `${reason} Дополнительная проверка показала массовую активность: ${externalReason}.`;
    }

    return {
      ...SERVICE_SIGNAL,
      confidence: hasExternalServicePattern ? 'Усиленный признак' : 'Предварительный признак',
      reason,
    };
  }

  if (hasDepositPattern) {
    const mainRecipientActivity = getExternalActivity(
      metric.externalActivityByRecipient,
      metric.mainRecipient,
    );
    const hasMassiveMainRecipient = hasMassiveExternalActivity(mainRecipientActivity);
    const externalReason = formatExternalActivityReason(mainRecipientActivity);

    return {
      ...DEPOSIT_SIGNAL,
      confidence: hasMassiveMainRecipient ? 'Усиленный признак' : 'Предварительный признак',
      reason: hasMassiveMainRecipient && externalReason
        ? `${metric.uniqueSenderCount} уникальных отправителей, ${metric.uniqueRecipientCount} получатель, ${Math.round(
            metric.mainRecipientVolumeShare * 100,
          )}% исходящего объема направлено одному адресу; дополнительная проверка получателя показала массовую активность: ${externalReason}.`
        : `${metric.uniqueSenderCount} уникальных отправителей, ${metric.uniqueRecipientCount} получатель, основной получатель забирает ${Math.round(
            metric.mainRecipientVolumeShare * 100,
          )}% исходящего объема.`,
    };
  }

  return EMPTY_SIGNAL;
};

const getBridgeSecondarySignals = (metric, articulationPoints) => {
  if (
    metric.nodeType !== 'transaction' &&
    articulationPoints.has(metric.id) &&
    metric.incomingCount + metric.outgoingCount > 1
  ) {
    return [BRIDGE_SIGNAL];
  }

  return [];
};

export const calculateGraphAnalysis = (
  nodes = [],
  edges = [],
  selectedNodeId = null,
  externalActivityById = {},
) => {
  const { visibleNodes, visibleEdges } = getVisibleGraph(nodes, edges);
  const nodeById = new Map(visibleNodes.map((node) => [node.id, node]));
  const addressNodes = visibleNodes.filter((node) => node.nodeType !== 'transaction');
  const transactionNodes = visibleNodes.filter((node) => node.nodeType === 'transaction');
  const addressNodeIds = new Set(addressNodes.map((node) => node.id));
  const allVisibleNodeIds = visibleNodes.map((node) => node.id);
  const metricsById = new Map(addressNodes.map((node) => [node.id, createEmptyNodeMetric(node)]));
  const totalVolumeByAsset = new Map();
  const linkVolumes = new Map();

  visibleEdges.forEach((edge) => {
    const amount = parseEdgeAmount(edge);
    const asset = parseEdgeAsset(edge);

    if (asset) {
      totalVolumeByAsset.set(asset, toNumber(totalVolumeByAsset.get(asset)) + amount);
    }

    const linkKey = `${edge.from} -> ${edge.to}`;
    linkVolumes.set(linkKey, toNumber(linkVolumes.get(linkKey)) + amount);

    if (metricsById.has(edge.to)) {
      const targetMetric = metricsById.get(edge.to);
      targetMetric.incomingCount += 1;
      targetMetric.incomingVolume += amount;
      if (addressNodeIds.has(edge.from)) {
        targetMetric.uniqueSenders.add(edge.from);
        targetMetric.senderVolumes.set(edge.from, toNumber(targetMetric.senderVolumes.get(edge.from)) + amount);
        targetMetric.senderCounts.set(edge.from, toNumber(targetMetric.senderCounts.get(edge.from)) + 1);
      }
    }

    if (metricsById.has(edge.from)) {
      const sourceMetric = metricsById.get(edge.from);
      sourceMetric.outgoingCount += 1;
      sourceMetric.outgoingVolume += amount;
      if (addressNodeIds.has(edge.to)) {
        sourceMetric.uniqueRecipients.add(edge.to);
      }
      sourceMetric.recipientVolumes.set(edge.to, toNumber(sourceMetric.recipientVolumes.get(edge.to)) + amount);
      sourceMetric.recipientCounts.set(edge.to, toNumber(sourceMetric.recipientCounts.get(edge.to)) + 1);
    }
  });

  const summary = {
    totalNodeCount: nodes.length,
    totalEdgeCount: edges.length,
    visibleNodeCount: visibleNodes.length,
    visibleAddressCount: addressNodes.length,
    visibleTransactionNodeCount: transactionNodes.length,
    visibleEdgeCount: visibleEdges.length,
    componentCount: getComponents(allVisibleNodeIds, visibleEdges),
    totalVolumeByAsset: Array.from(totalVolumeByAsset.entries()).map(([asset, amount]) => ({
      asset,
      amount,
    })),
    topReceiver: null,
    topSender: null,
    topLink: null,
  };

  const articulationPoints = getArticulationPoints(allVisibleNodeIds, visibleEdges);
  const depositCandidates = [];

  metricsById.forEach((metric) => {
    metric.uniqueSenderCount = metric.uniqueSenders.size;
    metric.uniqueRecipientCount = metric.uniqueRecipients.size;
    metric.externalActivity = getExternalActivity(externalActivityById, metric.id);
    metric.externalActivityByRecipient = externalActivityById;

    const mainRecipientByVolume = findLargestMapEntry(metric.recipientVolumes);
    const mainSenderByVolume = findLargestMapEntry(metric.senderVolumes);
    metric.mainSender = mainSenderByVolume.key;
    metric.mainSenderVolume = mainSenderByVolume.value;
    metric.mainSenderCount = toNumber(metric.senderCounts.get(metric.mainSender));
    metric.mainRecipient = mainRecipientByVolume.key;
    metric.mainRecipientVolume = mainRecipientByVolume.value;
    metric.mainRecipientCount = toNumber(metric.recipientCounts.get(metric.mainRecipient));
    metric.mainRecipientVolumeShare =
      metric.outgoingVolume > 0 ? metric.mainRecipientVolume / metric.outgoingVolume : 0;
    metric.mainRecipientTransferShare =
      metric.outgoingCount > 0 ? metric.mainRecipientCount / metric.outgoingCount : 0;

    if (isDepositPattern(metric)) {
      depositCandidates.push(metric);
    }
  });

  const depositRecipientCounts = new Map();
  depositCandidates.forEach((metric) => {
    if (metric.mainRecipient) {
      depositRecipientCounts.set(metric.mainRecipient, toNumber(depositRecipientCounts.get(metric.mainRecipient)) + 1);
    }
  });

  metricsById.forEach((metric) => {
    metric.signal = getPrimarySignal({
      metric,
      depositRecipientCounts,
    });
    metric.secondarySignals = getBridgeSecondarySignals(metric, articulationPoints);
  });

  const metrics = Array.from(metricsById.values()).map((metric) => ({
    ...metric,
    uniqueSenders: Array.from(metric.uniqueSenders),
    uniqueRecipients: Array.from(metric.uniqueRecipients),
    externalActivityByRecipient: undefined,
    senderVolumes: undefined,
    senderCounts: undefined,
    recipientVolumes: undefined,
    recipientCounts: undefined,
  }));

  summary.topReceiver =
    metrics.reduce((best, metric) => (metric.incomingVolume > toNumber(best?.incomingVolume) ? metric : best), null) ||
    null;
  summary.topSender =
    metrics.reduce((best, metric) => (metric.outgoingVolume > toNumber(best?.outgoingVolume) ? metric : best), null) ||
    null;

  const topLinkByVolume = findLargestMapEntry(linkVolumes);
  summary.topLink = topLinkByVolume.key
    ? {
        label: topLinkByVolume.key,
        amount: topLinkByVolume.value,
      }
    : null;

  const selectedNode = selectedNodeId ? nodeById.get(selectedNodeId) || nodes.find((node) => node.id === selectedNodeId) : null;
  const selectedMetric =
    selectedNode && selectedNode.nodeType === 'transaction'
      ? {
          id: selectedNode.id,
          label: selectedNode.label || selectedNode.id,
          nodeType: 'transaction',
          signal: getPrimarySignal({
            metric: createEmptyNodeMetric(selectedNode),
            depositRecipientCounts,
          }),
          secondarySignals: [],
        }
      : metrics.find((metric) => metric.id === selectedNodeId) || null;

  const probeAddresses = Array.from(
    new Set(
      depositCandidates
        .flatMap((metric) => [
          metric.mainRecipient,
          ...getTopMapKeys(metric.senderVolumes, 4),
        ])
        .filter((address) => address && !externalActivityById[address]),
    ),
  ).slice(0, 5);

  return {
    summary,
    metrics,
    selectedMetric,
    probeAddresses,
    signals: metrics
      .filter((metric) => (
        metric.signal.type === 'service' ||
        metric.signal.type === 'deposit' ||
        metric.secondarySignals?.length > 0
      ))
      .slice(0, 8),
  };
};
