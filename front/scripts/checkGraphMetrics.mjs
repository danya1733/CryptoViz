import assert from 'node:assert/strict';
import { calculateGraphAnalysis } from '../src/utils/graphMetrics.js';

const USER = 'TXbQB84orivPv2GMpYsA8n8JQvScCFSpJP';
const SERVICE_RECIPIENT = 'TU4vEruvZwLLkSfV9bNw12EJTPvNr7Pvaa';
const SERVICE_SENDER = 'TM1zzNDZD2DPASbKcgdVoTYhfmYgtfwx9R';
const ORDINARY = 'TGuiHpMN8GSWPgdFsai1wrAwuqyR3FQhY4';
const ORDINARY_CLIENT = 'TTSAUTNeYLbewkbJJwo2bMpJj2jAmQpNQF';
const ORDINARY_MODERATE_FIRST = 'TUGr4Af9SrrnKu34Stj2UWNvtr1WJQCUX6';
const ORDINARY_MODERATE_SECOND = 'TPAXGTUAzxz7G9aefnw99RpKMoEDgX9KTf';

const node = (id) => ({ id, label: id });
const edge = (id, from, to, amount = 100) => ({ id, from, to, amount, asset: 'USDT' });
const metricOf = (analysis, id) => analysis.metrics.find((metric) => metric.id === id);

const massiveRecipientActivity = {
  rangeTotal: 86841033,
  transactions: 103179113,
  totalTransactionCount: 73266207,
  sampleUniqueRecipientCount: 50,
};

const massiveSenderActivity = {
  rangeTotal: 96597799,
  transactions: 108794101,
  totalTransactionCount: 92124663,
  sampleUniqueSenderCount: 37,
};

const smallActivity = {
  rangeTotal: 47,
  transactions: 110,
  totalTransactionCount: 85,
  sampleUniqueSenderCount: 5,
  sampleUniqueRecipientCount: 5,
};

const tinyClientActivity = {
  rangeTotal: 17,
  transactions: 24,
  totalTransactionCount: 24,
  sampleUniqueSenderCount: 4,
  sampleUniqueRecipientCount: 3,
  maxTokenTransferCount: 3431931987,
};

const moderateFirstActivity = {
  rangeTotal: 234,
  transactions: 589,
  totalTransactionCount: 589,
  sampleUniqueSenderCount: 37,
  sampleUniqueRecipientCount: 1,
};

const moderateSecondActivity = {
  rangeTotal: 167,
  transactions: 464,
  totalTransactionCount: 464,
  sampleUniqueSenderCount: 27,
  sampleUniqueRecipientCount: 1,
};

const buildUserDepositGraph = () => {
  const senders = [SERVICE_SENDER, 'sender2', 'sender3', 'sender4', 'sender5', 'sender6'];
  const nodes = [USER, SERVICE_RECIPIENT, ...senders].map(node);
  const edges = [];

  for (let index = 0; index < 20; index += 1) {
    edges.push(edge(`service-sender-to-user-${index}`, SERVICE_SENDER, USER, 300));
  }

  for (let index = 0; index < 7; index += 1) {
    edges.push(edge(`sender-to-user-${index}`, senders[(index % 5) + 1], USER, 80));
  }

  for (let index = 0; index < 7; index += 1) {
    edges.push(edge(`user-to-service-recipient-${index}`, USER, SERVICE_RECIPIENT, 940));
  }

  return { nodes, edges };
};

const testUserGraphBeforeExternalChecks = () => {
  const { nodes, edges } = buildUserDepositGraph();
  const analysis = calculateGraphAnalysis(nodes, edges, USER, {});

  assert.equal(metricOf(analysis, USER).signal.type, 'deposit');
  assert.equal(metricOf(analysis, USER).signal.confidence, 'Предварительный признак');
  assert.equal(metricOf(analysis, SERVICE_RECIPIENT).signal.type, 'ordinary');
  assert.equal(metricOf(analysis, SERVICE_SENDER).signal.type, 'ordinary');
  assert.ok(analysis.probeAddresses.includes(SERVICE_RECIPIENT));
  assert.ok(analysis.probeAddresses.includes(SERVICE_SENDER));
};

const testUserGraphAfterExternalChecks = () => {
  const { nodes, edges } = buildUserDepositGraph();
  const analysis = calculateGraphAnalysis(nodes, edges, USER, {
    [SERVICE_RECIPIENT]: massiveRecipientActivity,
    [SERVICE_SENDER]: massiveSenderActivity,
  });

  assert.equal(metricOf(analysis, USER).signal.type, 'deposit');
  assert.equal(metricOf(analysis, USER).signal.confidence, 'Усиленный признак');
  assert.equal(metricOf(analysis, SERVICE_RECIPIENT).signal.type, 'service');
  assert.equal(metricOf(analysis, SERVICE_RECIPIENT).signal.confidence, 'Усиленный признак');
  assert.equal(metricOf(analysis, SERVICE_SENDER).signal.type, 'service');
  assert.equal(metricOf(analysis, SERVICE_SENDER).signal.confidence, 'Усиленный признак');
};

const testUserGraphKeepsModerateSendersOrdinary = () => {
  const otherSenders = ['sender-a', 'sender-b'];
  const nodes = [
    USER,
    SERVICE_RECIPIENT,
    SERVICE_SENDER,
    ORDINARY_CLIENT,
    ORDINARY_MODERATE_FIRST,
    ORDINARY_MODERATE_SECOND,
    ...otherSenders,
  ].map(node);
  const edges = [];

  for (let index = 0; index < 12; index += 1) {
    edges.push(edge(`service-sender-user-scenario-${index}`, SERVICE_SENDER, USER, 300));
  }

  for (let index = 0; index < 2; index += 1) {
    edges.push(edge(`ordinary-client-user-scenario-${index}`, ORDINARY_CLIENT, USER, 50));
  }

  edges.push(edge('moderate-first-user-scenario', ORDINARY_MODERATE_FIRST, USER, 75));

  for (let index = 0; index < 4; index += 1) {
    edges.push(edge(`moderate-second-user-scenario-${index}`, ORDINARY_MODERATE_SECOND, USER, 65));
  }

  otherSenders.forEach((sender, index) => {
    edges.push(edge(`other-sender-user-scenario-${index}`, sender, USER, 40));
  });

  for (let index = 0; index < 7; index += 1) {
    edges.push(edge(`user-service-recipient-scenario-${index}`, USER, SERVICE_RECIPIENT, 940));
  }

  const analysis = calculateGraphAnalysis(nodes, edges, USER, {
    [SERVICE_RECIPIENT]: massiveRecipientActivity,
    [SERVICE_SENDER]: massiveSenderActivity,
    [ORDINARY_CLIENT]: tinyClientActivity,
    [ORDINARY_MODERATE_FIRST]: moderateFirstActivity,
    [ORDINARY_MODERATE_SECOND]: moderateSecondActivity,
  });

  assert.equal(metricOf(analysis, USER).signal.type, 'deposit');
  assert.equal(metricOf(analysis, SERVICE_RECIPIENT).signal.type, 'service');
  assert.equal(metricOf(analysis, SERVICE_SENDER).signal.type, 'service');
  assert.equal(metricOf(analysis, ORDINARY_CLIENT).signal.type, 'ordinary');
  assert.equal(metricOf(analysis, ORDINARY_MODERATE_FIRST).signal.type, 'ordinary');
  assert.equal(metricOf(analysis, ORDINARY_MODERATE_SECOND).signal.type, 'ordinary');
};

const testMassiveAddressDoesNotBecomeDeposit = () => {
  const senders = Array.from({ length: 37 }, (_, index) => `service-sender-extra-${index + 1}`);
  const nodes = [SERVICE_SENDER, USER, ...senders].map(node);
  const edges = [
    ...senders.map((sender, index) => edge(`sender-to-service-sender-${index}`, sender, SERVICE_SENDER, 25)),
    edge('service-sender-to-user', SERVICE_SENDER, USER, 1200),
  ];
  const analysis = calculateGraphAnalysis(nodes, edges, SERVICE_SENDER, {
    [SERVICE_SENDER]: massiveSenderActivity,
  });

  assert.equal(metricOf(analysis, SERVICE_SENDER).signal.type, 'service');
};

const testCombinedUserAndServiceGraph = () => {
  const base = buildUserDepositGraph();
  const serviceSenders = Array.from({ length: 37 }, (_, index) => `service-sender-combined-${index + 1}`);
  const serviceRecipients = Array.from({ length: 50 }, (_, index) => `service-recipient-combined-${index + 1}`);
  const nodes = [
    ...base.nodes,
    ...serviceSenders.map(node),
    ...serviceRecipients.map(node),
  ].filter((currentNode, index, allNodes) => (
    allNodes.findIndex((candidate) => candidate.id === currentNode.id) === index
  ));
  const edges = [
    ...base.edges,
    ...serviceSenders.map((sender, index) => edge(`combined-sender-to-service-sender-${index}`, sender, SERVICE_SENDER, 25)),
    ...serviceRecipients.map((recipient, index) => edge(`service-recipient-to-extra-recipient-${index}`, SERVICE_RECIPIENT, recipient, 100)),
  ];
  const analysis = calculateGraphAnalysis(nodes, edges, USER, {
    [SERVICE_RECIPIENT]: massiveRecipientActivity,
    [SERVICE_SENDER]: massiveSenderActivity,
  });

  assert.equal(metricOf(analysis, USER).signal.type, 'deposit');
  assert.equal(metricOf(analysis, USER).signal.confidence, 'Усиленный признак');
  assert.equal(metricOf(analysis, SERVICE_RECIPIENT).signal.type, 'service');
  assert.equal(metricOf(analysis, SERVICE_SENDER).signal.type, 'service');
};

const testMassiveOutgoingFanOut = () => {
  const recipients = Array.from({ length: 1000 }, (_, index) => `recipient-${index + 1}`);
  const nodes = [SERVICE_RECIPIENT, ...recipients].map(node);
  const edges = recipients.map((recipient, index) => edge(`service-recipient-to-recipient-${index}`, SERVICE_RECIPIENT, recipient, 100));
  const analysis = calculateGraphAnalysis(nodes, edges, SERVICE_RECIPIENT, {});

  assert.equal(metricOf(analysis, SERVICE_RECIPIENT).signal.type, 'service');
  assert.equal(metricOf(analysis, SERVICE_RECIPIENT).signal.confidence, 'Предварительный признак');
};

const testSmallDepositRecipientDoesNotBecomeService = () => {
  const depositLikeAddress = 'deposit-like-address';
  const depositSenders = Array.from({ length: 4 }, (_, index) => `deposit-sender-${index + 1}`);
  const clientSenders = Array.from({ length: 4 }, (_, index) => `client-sender-${index + 1}`);
  const clientRecipients = Array.from({ length: 3 }, (_, index) => `client-recipient-${index + 1}`);
  const nodes = [
    depositLikeAddress,
    ORDINARY_CLIENT,
    ...depositSenders,
    ...clientSenders,
    ...clientRecipients,
  ].map(node);
  const edges = [
    ...depositSenders.map((sender, index) => edge(`deposit-sender-to-deposit-${index}`, sender, depositLikeAddress, 40)),
    edge('deposit-to-client', depositLikeAddress, ORDINARY_CLIENT, 160),
  ];

  for (let index = 0; index < 9; index += 1) {
    edges.push(edge(`client-in-${index}`, clientSenders[index % clientSenders.length], ORDINARY_CLIENT, 25));
  }

  for (let index = 0; index < 7; index += 1) {
    edges.push(edge(`client-out-${index}`, ORDINARY_CLIENT, clientRecipients[index % clientRecipients.length], 20));
  }

  const analysis = calculateGraphAnalysis(nodes, edges, ORDINARY_CLIENT, {
    [ORDINARY_CLIENT]: tinyClientActivity,
  });

  assert.equal(metricOf(analysis, ORDINARY_CLIENT).signal.type, 'ordinary');
};

const testModerateCheckedAddressesDoNotBecomeService = () => {
  [
    {
      address: ORDINARY_MODERATE_FIRST,
      activity: moderateFirstActivity,
      outgoingCount: 1,
    },
    {
      address: ORDINARY_MODERATE_SECOND,
      activity: moderateSecondActivity,
      outgoingCount: 4,
    },
  ].forEach(({ address, activity, outgoingCount }) => {
    const recipient = `${address}-recipient`;
    const nodes = [address, recipient].map(node);
    const edges = Array.from({ length: outgoingCount }, (_, index) =>
      edge(`${address}-out-${index}`, address, recipient, 35),
    );
    const analysis = calculateGraphAnalysis(nodes, edges, address, {
      [address]: activity,
    });

    assert.equal(metricOf(analysis, address).signal.type, 'ordinary');
  });
};

const testOrdinaryAddress = () => {
  const senders = Array.from({ length: 5 }, (_, index) => `friend-sender-${index + 1}`);
  const recipients = Array.from({ length: 5 }, (_, index) => `friend-recipient-${index + 1}`);
  const nodes = [ORDINARY, ...senders, ...recipients].map(node);
  const edges = [];

  for (let index = 0; index < 25; index += 1) {
    edges.push(edge(`sender-to-friend-${index}`, senders[index % senders.length], ORDINARY, 40));
  }

  for (let index = 0; index < 22; index += 1) {
    edges.push(edge(`friend-to-recipient-${index}`, ORDINARY, recipients[index % recipients.length], 45));
  }

  const analysis = calculateGraphAnalysis(nodes, edges, ORDINARY, {
    [ORDINARY]: smallActivity,
  });

  assert.equal(metricOf(analysis, ORDINARY).signal.type, 'ordinary');
};

testUserGraphBeforeExternalChecks();
testUserGraphAfterExternalChecks();
testUserGraphKeepsModerateSendersOrdinary();
testMassiveAddressDoesNotBecomeDeposit();
testCombinedUserAndServiceGraph();
testMassiveOutgoingFanOut();
testSmallDepositRecipientDoesNotBecomeService();
testModerateCheckedAddressesDoNotBecomeService();
testOrdinaryAddress();

console.log('Graph metric checks passed.');
