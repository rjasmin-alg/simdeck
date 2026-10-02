// SPDX-License-Identifier: AGPL-3.0-or-later
// One row per thing you can drop on the canvas. Add here, nowhere else.
// simdeck copy: labels and notes are getters on strings.js (cat.*), so every module that reads `.label` follows
// the page's language unchanged. Ids, codes (MON, HDD) and Ceph keywords stay as they are.

import { t } from './i18n.js';

export const DEVICE_CLASSES = {
  hdd:  { id: 'hdd',  label: 'HDD',  colour: '#6b8cae', defaultSize: 8,  hue: 210 },
  ssd:  { id: 'ssd',  label: 'SSD',  colour: '#5aa87a', defaultSize: 2,  hue: 150 },
  nvme: { id: 'nvme', label: 'NVMe', colour: '#b07fc7', defaultSize: 4,  hue: 285 },
};
export const classOrDefault = (c) => DEVICE_CLASSES[c] || DEVICE_CLASSES.hdd;

// Daemons a host can run. Ceph's availability story is mostly about these.
export const DAEMONS = {
  mon: { id: 'mon', label: 'MON', short: 'M', colour: '#e0a54a',
         get note() { return t('cat.monNote'); } },
  mgr: { id: 'mgr', label: 'MGR', short: 'G', colour: '#4a9ee0',
         get note() { return t('cat.mgrNote'); } },
  mds: { id: 'mds', label: 'MDS', short: 'D', colour: '#e0704a',
         get note() { return t('cat.mdsNote'); } },
  rgw: { id: 'rgw', label: 'RGW', short: 'S', colour: '#7ac07a',
         get note() { return t('cat.rgwNote'); } },
};

// Chassis presets: a host and its disks in one drop.
export const CHASSIS = {
  'hci-4':    { id: 'hci-4',    get label() { return t('cat.hci-4'); },
                osds: [{ n: 4, size: 4, cls: 'ssd' }], daemons: ['mon', 'mgr'] },
  'store-12': { id: 'store-12', get label() { return t('cat.store-12'); },
                osds: [{ n: 12, size: 8, cls: 'hdd' }], daemons: [] },
  'store-24': { id: 'store-24', get label() { return t('cat.store-24'); },
                osds: [{ n: 24, size: 16, cls: 'hdd' }], daemons: [] },
  'mixed-12': { id: 'mixed-12', get label() { return t('cat.mixed-12'); },
                osds: [{ n: 10, size: 8, cls: 'hdd' }, { n: 2, size: 2, cls: 'nvme' }],
                daemons: [] },
  'nvme-10':  { id: 'nvme-10',  get label() { return t('cat.nvme-10'); },
                osds: [{ n: 10, size: 4, cls: 'nvme' }], daemons: [] },
  'mon-only': { id: 'mon-only', get label() { return t('cat.mon-only'); },
                osds: [], daemons: ['mon', 'mgr'] },
  'empty':    { id: 'empty',    get label() { return t('cat.empty'); }, osds: [], daemons: [] },
};

export const SWITCHES = {
  'tor-25':  { id: 'tor-25',  get label() { return t('cat.tor-25'); }, speed: 25,  ports: 48 },
  'tor-100': { id: 'tor-100', get label() { return t('cat.tor-100'); },     speed: 100, ports: 32 },
  'tor-10':  { id: 'tor-10',  get label() { return t('cat.tor-10'); }, speed: 10,  ports: 48 },
};

export const NIC_SPEEDS = [1, 10, 25, 40, 100];

// Ceph splits client traffic from replication traffic. Drawing them apart is
// the point: a cluster-network outage is invisible to clients right up until
// recovery stops working.
export const NETS = {
  public:  { id: 'public',  get label() { return t('cat.netPublic'); },  colour: '#4a9ee0', dash: null },
  cluster: { id: 'cluster', get label() { return t('cat.netCluster'); }, colour: '#e0a54a', dash: '7 4' },
};

/** Bucket types the CRUSH tree may use, coarse first. */
export const BUCKET_TYPES = [
  { id: 'root', get label() { return t('cat.root'); } },
  { id: 'region', get label() { return t('cat.region'); } },
  { id: 'zone', get label() { return t('cat.zone'); } },
  { id: 'datacenter', get label() { return t('cat.datacenter'); } },
  { id: 'room', get label() { return t('cat.room'); } },
  { id: 'pod', get label() { return t('cat.pod'); } },
  { id: 'rack', get label() { return t('cat.rack'); } },
];

/** Failure domains a rule may choose. `osd` is offered because people do it. */
export const FAILURE_DOMAINS = ['osd', 'host', 'chassis', 'rack', 'room', 'datacenter', 'zone', 'region'];

/** Common EC profiles, with the failure domain each one actually needs. */
const ec = (k, m) => ({
  k, m, get label() { return t('cat.ec', { k, m, w: k + m, pct: Math.round((k / (k + m)) * 100) }); },
});
export const EC_PROFILES = [
  ec(2, 1),
  ec(2, 2),
  ec(4, 2),
  ec(6, 3),
  ec(8, 3),
  ec(8, 4),
];
