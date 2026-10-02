// One row per thing you can drop on the canvas. Add here, nowhere else.

export const DEVICE_CLASSES = {
  hdd:  { id: 'hdd',  label: 'HDD',  colour: '#6b8cae', defaultSize: 8,  hue: 210 },
  ssd:  { id: 'ssd',  label: 'SSD',  colour: '#5aa87a', defaultSize: 2,  hue: 150 },
  nvme: { id: 'nvme', label: 'NVMe', colour: '#b07fc7', defaultSize: 4,  hue: 285 },
};
export const classOrDefault = (c) => DEVICE_CLASSES[c] || DEVICE_CLASSES.hdd;

// Daemons a host can run. Ceph's availability story is mostly about these.
export const DAEMONS = {
  mon: { id: 'mon', label: 'MON', short: 'M', colour: '#e0a54a',
         note: 'Monitor — needs a majority quorum or the cluster stops.' },
  mgr: { id: 'mgr', label: 'MGR', short: 'G', colour: '#4a9ee0',
         note: 'Manager — active/standby. Losing all of them loses stats and the balancer.' },
  mds: { id: 'mds', label: 'MDS', short: 'D', colour: '#e0704a',
         note: 'Metadata server — CephFS only. Losing every rank takes the filesystem down.' },
  rgw: { id: 'rgw', label: 'RGW', short: 'S', colour: '#7ac07a',
         note: 'Object gateway — stateless, so losing one only loses that endpoint.' },
};

// Chassis presets: a host and its disks in one drop.
export const CHASSIS = {
  'hci-4':    { id: 'hci-4',    label: 'Hyperconverged 4-bay',
                osds: [{ n: 4, size: 4, cls: 'ssd' }], daemons: ['mon', 'mgr'] },
  'store-12': { id: 'store-12', label: '2U 12-bay HDD',
                osds: [{ n: 12, size: 8, cls: 'hdd' }], daemons: [] },
  'store-24': { id: 'store-24', label: '4U 24-bay HDD',
                osds: [{ n: 24, size: 16, cls: 'hdd' }], daemons: [] },
  'mixed-12': { id: 'mixed-12', label: '2U 10 HDD + 2 NVMe',
                osds: [{ n: 10, size: 8, cls: 'hdd' }, { n: 2, size: 2, cls: 'nvme' }],
                daemons: [] },
  'nvme-10':  { id: 'nvme-10',  label: '1U 10-bay NVMe',
                osds: [{ n: 10, size: 4, cls: 'nvme' }], daemons: [] },
  'mon-only': { id: 'mon-only', label: 'Monitor node (no OSDs)',
                osds: [], daemons: ['mon', 'mgr'] },
  'empty':    { id: 'empty',    label: 'Empty host', osds: [], daemons: [] },
};

export const SWITCHES = {
  'tor-25':  { id: 'tor-25',  label: 'ToR switch 25G', speed: 25,  ports: 48 },
  'tor-100': { id: 'tor-100', label: 'Spine 100G',     speed: 100, ports: 32 },
  'tor-10':  { id: 'tor-10',  label: 'ToR switch 10G', speed: 10,  ports: 48 },
};

export const NIC_SPEEDS = [1, 10, 25, 40, 100];

// Ceph splits client traffic from replication traffic. Drawing them apart is
// the point: a cluster-network outage is invisible to clients right up until
// recovery stops working.
export const NETS = {
  public:  { id: 'public',  label: 'Public',  colour: '#4a9ee0', dash: null },
  cluster: { id: 'cluster', label: 'Cluster', colour: '#e0a54a', dash: '7 4' },
};

/** Bucket types the CRUSH tree may use, coarse first. */
export const BUCKET_TYPES = [
  { id: 'root', label: 'Root' },
  { id: 'region', label: 'Region' },
  { id: 'zone', label: 'Zone' },
  { id: 'datacenter', label: 'Datacenter' },
  { id: 'room', label: 'Room' },
  { id: 'pod', label: 'Pod' },
  { id: 'rack', label: 'Rack' },
];

/** Failure domains a rule may choose. `osd` is offered because people do it. */
export const FAILURE_DOMAINS = ['osd', 'host', 'chassis', 'rack', 'room', 'datacenter', 'zone', 'region'];

/** Common EC profiles, with the failure domain each one actually needs. */
export const EC_PROFILES = [
  { k: 2, m: 1, label: 'k=2 m=1  (3 domains, 67% usable)' },
  { k: 2, m: 2, label: 'k=2 m=2  (4 domains, 50% usable)' },
  { k: 4, m: 2, label: 'k=4 m=2  (6 domains, 67% usable)' },
  { k: 6, m: 3, label: 'k=6 m=3  (9 domains, 67% usable)' },
  { k: 8, m: 3, label: 'k=8 m=3  (11 domains, 73% usable)' },
  { k: 8, m: 4, label: 'k=8 m=4  (12 domains, 67% usable)' },
];
