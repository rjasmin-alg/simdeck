// Scenarios. Every one is a *design* failure rather than an operating error,
// and the two cloud ones are real, dated and sourced — because invented
// scenarios feel invented and students end up learning the tool instead of the
// trade.
//
// simdeck copy: every visible word comes from strings.js (t('s.*')), so a sample is built in the page's language.
// Ids, gates and hits are the same in both; names that are data (us-east-1, osd-1, etcd-1) are not translated.

import { t } from './i18n.js';

const dom = (id, name, kind, parent = null) => ({ id, name, kind, parent });
const comp = (id, name, role, domain, extra = {}) => ({ id, name, role, domain, up: true, ...extra });
const dep = (from, to, gate = 'all', extra = {}) => ({ id: `dep:${from}>${to}`, from, to, gate, ...extra });

// ---------------------------------------------------------------------------
// 1. Looks bulletproof. Three zones, quorum of three, replicas everywhere.
//    Every drawn cut is size 2 or more — and then the authorities land.
//    This is the spike scenario: the whole point is that the student believes
//    they are finished before the panel disagrees.
function threeZone() {
  return {
    version: 1,
    title: t('s.threeZone.title'),
    settings: { profile: 'aws', maxCutSize: 3 },
    domains: [
      dom('reg', 'us-east-1', 'region'),
      dom('az1', 'use1-az1', 'zone', 'reg'),
      dom('az2', 'use1-az2', 'zone', 'reg'),
      dom('az3', 'use1-az3', 'zone', 'reg'),
    ],
    components: [
      comp('svc', 'payments-api', 'service', 'reg'),
      comp('etcd1', 'etcd-1', 'member', 'az1'),
      comp('etcd2', 'etcd-2', 'member', 'az2'),
      comp('etcd3', 'etcd-3', 'member', 'az3'),
      comp('app1', 'app-1', 'replica', 'az1'),
      comp('app2', 'app-2', 'replica', 'az2'),
      comp('app3', 'app-3', 'replica', 'az3'),
    ],
    deps: [
      dep('svc', 'etcd1', 'quorum'), dep('svc', 'etcd2', 'quorum'), dep('svc', 'etcd3', 'quorum'),
      dep('svc', 'app1', 'any'), dep('svc', 'app2', 'any'), dep('svc', 'app3', 'any'),
    ],
    events: [],
  };
}

// ---------------------------------------------------------------------------
// 2. Three racks, three replicas, one power strip. The dashboard reads 3x
//    redundant. The cut list reads size 1.
function onePdu() {
  return {
    version: 1,
    title: t('s.onePdu.title'),
    settings: { profile: 'onprem', maxCutSize: 3 },
    domains: [
      dom('dc', t('s.serverRoom'), 'dc'),
      dom('r1', t('s.rack', { n: 1 }), 'rack', 'dc'),
      dom('r2', t('s.rack', { n: 2 }), 'rack', 'dc'),
      dom('r3', t('s.rack', { n: 3 }), 'rack', 'dc'),
    ],
    components: [
      comp('svc', t('s.onePdu.service'), 'service', 'dc'),
      comp('osd1', 'osd-1', 'replica', 'r1'),
      comp('osd2', 'osd-2', 'replica', 'r2'),
      comp('osd3', 'osd-3', 'replica', 'r3'),
    ],
    deps: [
      // size=3, min_size=2: the service needs two of the three copies.
      dep('svc', 'osd1', 'kofn', { n: 2 }),
      dep('svc', 'osd2', 'kofn', { n: 2 }),
      dep('svc', 'osd3', 'kofn', { n: 2 }),
    ],
    events: [
      {
        id: 'pdu-a',
        name: t('s.onePdu.event'),
        hits: ['r1', 'r2'],
        note: t('s.onePdu.note'),
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// 3. min_size=2 on a size=2 pool: the default you get by typing "2".
//    One disk loss does not degrade the pool, it stops it.
function sizeTwo() {
  return {
    version: 1,
    title: t('s.sizeTwo.title'),
    settings: { profile: 'ceph', maxCutSize: 2 },
    domains: [dom('dc', t('s.serverRoom'), 'dc'), dom('h1', 'host-1', 'host', 'dc'), dom('h2', 'host-2', 'host', 'dc')],
    components: [
      comp('svc', 'rbd pool', 'service', 'dc'),
      comp('osd1', 'osd-1', 'replica', 'h1'),
      comp('osd2', 'osd-2', 'replica', 'h2'),
    ],
    // min_size == size means every copy is required for I/O to continue.
    deps: [dep('svc', 'osd1', 'all'), dep('svc', 'osd2', 'all')],
    events: [],
  };
}

// ---------------------------------------------------------------------------
// 4. AWS us-east-1, 20 October 2025. A race condition in DynamoDB's internal
//    DNS automation degraded IAM, STS and CloudFormation *globally*, because
//    those control planes are homed in us-east-1. The workload in eu-west-1 was
//    healthy in every sense the customer could see and still could not serve.
//
//    Cut set: naming, and change. Both size 1. Neither is in eu-west-1.
function usEast1() {
  return {
    version: 1,
    title: t('s.usEast1.title'),
    settings: { profile: 'aws', maxCutSize: 2 },
    domains: [
      dom('aws', 'aws partition', 'partition'),
      dom('use1', 'us-east-1', 'region', 'aws'),
      dom('euw1', 'eu-west-1', 'region', 'aws'),
      dom('euw1a', 'euw1-az1', 'zone', 'euw1'),
      dom('euw1b', 'euw1-az2', 'zone', 'euw1'),
    ],
    components: [
      comp('svc', 'checkout', 'service', 'euw1'),
      comp('app1', 'app-1', 'replica', 'euw1a'),
      comp('app2', 'app-2', 'replica', 'euw1b'),
      // Drawn where they actually live, which is the entire lesson.
      comp('iam', 'IAM / STS', 'authority', 'use1', { authorityKind: 'identity' }),
      comp('r53', t('s.usEast1.r53'), 'authority', 'use1', { authorityKind: 'naming' }),
      comp('ddb', t('s.usEast1.ddb'), 'plane', 'use1'),
    ],
    deps: [
      dep('svc', 'app1', 'any'), dep('svc', 'app2', 'any'),
      dep('svc', 'iam', 'all'), dep('svc', 'r53', 'all'), dep('svc', 'ddb', 'all'),
      dep('app1', 'iam', 'all'), dep('app2', 'iam', 'all'),
    ],
    events: [
      {
        id: 'ddb-dns',
        name: t('s.usEast1.event'),
        hits: ['use1'],
        note: t('s.usEast1.note'),
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// 5. Azure Front Door, 29 October 2025. A configuration change to the global
//    edge fabric broke Entra ID token issuance in every region simultaneously.
//    Nine days after us-east-1, and again not a hardware failure: a config push.
//
//    Both marquee outages of 2025 were the `change` authority.
function frontDoor() {
  return {
    version: 1,
    title: t('s.frontDoor.title'),
    settings: { profile: 'azure', maxCutSize: 2 },
    domains: [
      dom('global', t('s.frontDoor.edge'), 'geo'),
      dom('weu', 'West Europe', 'region'),
      dom('neu', 'North Europe', 'region'),
      dom('weu1', t('s.zone', { n: 1 }), 'zone', 'weu'),
      dom('weu2', t('s.zone', { n: 2 }), 'zone', 'weu'),
      dom('neu1', t('s.zone', { n: 1 }), 'zone', 'neu'),
    ],
    components: [
      comp('svc', 'portal', 'service', 'global'),
      comp('vm1', 'vm-weu-1', 'replica', 'weu1'),
      comp('vm2', 'vm-weu-2', 'replica', 'weu2'),
      comp('vm3', 'vm-neu-1', 'replica', 'neu1'),
      comp('afd', 'Front Door', 'plane', 'global'),
      comp('entra', 'Entra ID', 'authority', 'global', { authorityKind: 'identity' }),
    ],
    deps: [
      dep('svc', 'vm1', 'any'), dep('svc', 'vm2', 'any'), dep('svc', 'vm3', 'any'),
      dep('svc', 'afd', 'all'),
      dep('svc', 'entra', 'all'),
      dep('entra', 'afd', 'all'), // token issuance rode the same edge fabric
    ],
    events: [
      {
        id: 'afd-config',
        name: t('s.frontDoor.event'),
        hits: ['afd'],
        note: t('s.frontDoor.note'),
      },
    ],
  };
}

// simdeck copy: the keys are quoted so the manifest check finds each entry's ?sample= key; labels are getters, so
// they follow the language.
export const SAMPLES = {
  'threeZone': { get label() { return t('s.threeZone.label'); }, make: threeZone },
  'onePdu':    { get label() { return t('s.onePdu.label'); }, make: onePdu },
  'sizeTwo':   { get label() { return t('s.sizeTwo.label'); }, make: sizeTwo },
  'usEast1':   { get label() { return t('s.usEast1.label'); }, make: usEast1 },
  'frontDoor': { get label() { return t('s.frontDoor.label'); }, make: frontDoor },
};

export const makeSample = (key) => (SAMPLES[key] ? SAMPLES[key].make() : null);
