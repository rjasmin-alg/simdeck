// SPDX-License-Identifier: AGPL-3.0-or-later
// Domain catalog: the services you can pin on a node, and the device types
// you can drop on the canvas. This file is the one you edit when a lecture
// needs a box or a role that isn't here yet.
//
// simdeck copy: every label is in strings.js (grp.<id>, svc.<id>, cat.<id>, dev.<id>, link.<id>, zone.<id>) and
// read through getters, so it follows the page language. Badge codes stay here: they are codes, not words.

import { t } from './i18n.js';

export const SERVICE_GROUPS = {
  identity: { color: '#6366f1' },
  naming: { color: '#0284c7' },
  files: { color: '#b45309' },
  security: { color: '#dc2626' },
  app: { color: '#7c3aed' },
  comms: { color: '#059669' },
  ops: { color: '#475569' },
  virt: { color: '#0891b2' },
};

// [id, short, group]; short = what gets drawn on the badge. Keep it <= 6 characters.
const SERVICE_LIST = [
  // identity
  ['adds', 'AD DS', 'identity'],
  ['rodc', 'RODC', 'identity'],
  ['ldap', 'LDAP', 'identity'],
  ['kerberos', 'KDC', 'identity'],
  ['adfs', 'ADFS', 'identity'],
  ['entra', 'IDaaS', 'identity'],
  ['sso', 'SSO', 'identity'],
  ['mfa', 'MFA', 'identity'],
  ['gpo', 'GPO', 'identity'],

  // naming & addressing
  ['dns', 'DNS', 'naming'],
  ['dnssec', 'DNSSEC', 'naming'],
  ['dhcp', 'DHCP', 'naming'],
  ['gateway', 'GW', 'naming'],
  ['nat', 'NAT', 'naming'],
  ['ntp', 'NTP', 'naming'],
  ['ipam', 'IPAM', 'naming'],
  ['pxe', 'PXE', 'naming'],
  ['routing', 'RTG', 'naming'],

  // files & storage
  ['smb', 'SMB', 'files'],
  ['nfs', 'NFS', 'files'],
  ['dfs', 'DFS', 'files'],
  ['iscsi', 'iSCSI', 'files'],
  ['ftp', 'FTP', 'files'],
  ['objstore', 'OBJ', 'files'],
  ['backup', 'BKP', 'files'],
  ['snapshot', 'SNAP', 'files'],

  // security
  ['firewall', 'FW', 'security'],
  ['ips', 'IPS', 'security'],
  ['ids', 'IDS', 'security'],
  ['waf', 'WAF', 'security'],
  ['proxy', 'PROXY', 'security'],
  ['revproxy', 'RPROXY', 'security'],
  ['vpn', 'VPN', 'security'],
  ['ipsec', 'IPSEC', 'security'],
  ['sslvpn', 'SSLVPN', 'security'],
  ['pki', 'CA', 'security'],
  ['radius', 'RADIUS', 'security'],
  ['nac', 'NAC', 'security'],
  ['siem', 'SIEM', 'security'],
  ['av', 'AV', 'security'],
  ['dlp', 'DLP', 'security'],
  ['spam', 'SPAM', 'security'],

  // apps & web
  ['web', 'HTTP', 'app'],
  ['db', 'SQL', 'app'],
  ['api', 'API', 'app'],
  ['app', 'APP', 'app'],
  ['print', 'PRINT', 'app'],
  ['lb', 'LB', 'app'],

  // communications
  ['mail', 'SMTP', 'comms'],
  ['imap', 'IMAP', 'comms'],
  ['sip', 'SIP', 'comms'],
  ['pbx', 'PBX', 'comms'],
  ['mqtt', 'MQTT', 'comms'],

  // ops & management
  ['ssh', 'SSH', 'ops'],
  ['rdp', 'RDP', 'ops'],
  ['winrm', 'WINRM', 'ops'],
  ['snmp', 'SNMP', 'ops'],
  ['syslog', 'SYSLOG', 'ops'],
  ['monitor', 'MON', 'ops'],
  ['patch', 'PATCH', 'ops'],
  ['config', 'CFG', 'ops'],
  ['netflow', 'FLOW', 'ops'],
  ['tacacs', 'TACACS', 'ops'],

  // virtualisation
  ['esxi', 'HV', 'virt'],
  ['hyperv', 'HYPERV', 'virt'],
  ['proxmox', 'VIRT', 'virt'],
  ['docker', 'CTR', 'virt'],
  ['k8s', 'ORCH', 'virt'],
  ['vdi', 'VDI', 'virt'],
];

export const SERVICES = {};
for (const [gid, g] of Object.entries(SERVICE_GROUPS)) {
  Object.defineProperty(g, 'label', { get: () => t(`grp.${gid}`), enumerable: true });
}

for (const [id, short, group] of SERVICE_LIST) {
  SERVICES[id] = {
    id, short, group, color: SERVICE_GROUPS[group].color,
    get label() { return t(`svc.${id}`); },
  };
}

export const DEVICE_CATEGORIES = [
  { id: 'network' },
  { id: 'security' },
  { id: 'servers' },
  { id: 'storage' },
  { id: 'endpoints' },
  { id: 'wan' },
  { id: 'misc' },
];

// [id, category, iconKey, accent, defaultServices]
const DEVICE_LIST = [
  // ---- network ----
  ['router', 'network', 'router',      '#0ea5e9', ['gateway', 'nat', 'routing']],
  ['switch-l2', 'network', 'switch',      '#0f766e', []],
  ['switch-l3', 'network', 'switchL3',    '#0f766e', ['gateway', 'routing']],
  ['switch-core', 'network', 'switchCore',  '#155e75', ['gateway', 'routing']],
  ['switch-poe', 'network', 'switchPoe',   '#0f766e', []],
  ['hub', 'network', 'hub',         '#78716c', []],
  ['ap', 'network', 'ap',          '#0891b2', []],
  ['wlc', 'network', 'wlc',         '#0891b2', ['radius']],
  ['loadbalancer', 'network', 'lb',          '#7c3aed', ['lb', 'revproxy']],
  ['modem', 'network', 'modem',       '#64748b', []],
  ['patchpanel', 'network', 'patch',       '#94a3b8', []],

  // ---- security ----
  ['firewall', 'security', 'firewall',   '#dc2626', ['firewall', 'nat']],
  ['ngfw', 'security', 'ngfw',       '#b91c1c', ['firewall', 'ips', 'proxy']],
  ['fw-oss', 'security', 'firewallOss','#dc2626', ['firewall', 'nat', 'dhcp']],
  ['ids', 'security', 'ids',        '#dc2626', ['ids', 'ips']],
  ['waf', 'security', 'waf',        '#dc2626', ['waf', 'revproxy']],
  ['proxy', 'security', 'proxy',      '#dc2626', ['proxy', 'av']],
  ['vpn-gw', 'security', 'vpn',        '#7c3aed', ['vpn', 'ipsec', 'sslvpn']],
  ['siem', 'security', 'siem',       '#dc2626', ['siem', 'syslog']],
  ['nac', 'security', 'nac',        '#dc2626', ['nac', 'radius']],
  ['ca', 'security','ca',         '#dc2626', ['pki']],
  ['bastion', 'security', 'bastion',    '#dc2626', ['ssh', 'rdp', 'mfa']],

  // ---- servers & roles ----
  ['server', 'servers', 'server',      '#475569', []],
  ['win-server', 'servers', 'winServer',   '#2563eb', ['winrm']],
  ['linux-server', 'servers', 'linuxServer', '#111827', ['ssh']],
  ['dc', 'servers', 'dc',          '#4f46e5', ['adds', 'ldap', 'kerberos', 'gpo']],
  ['rodc', 'servers', 'rodc',        '#4f46e5', ['rodc', 'dns', 'ldap']],
  ['dns-server', 'servers', 'dns',         '#0284c7', ['dns']],
  ['dhcp-server', 'servers', 'dhcp',        '#0284c7', ['dhcp']],
  ['file-server', 'servers', 'fileServer',  '#b45309', ['smb', 'nfs', 'ssh']],
  ['file-server-w', 'servers','fileServerWin','#b45309',['smb', 'dfs']],
  ['web-server', 'servers', 'web',         '#7c3aed', ['web']],
  ['db-server', 'servers', 'db',          '#7c3aed', ['db']],
  ['mail-server', 'servers', 'mail',        '#059669', ['mail', 'imap', 'spam']],
  ['app-server', 'servers', 'app',         '#7c3aed', ['app', 'api']],
  ['print-server', 'servers', 'printServer', '#7c3aed', ['print']],
  ['backup-server', 'servers', 'backup',      '#b45309', ['backup']],
  ['monitoring', 'servers', 'monitor',     '#475569', ['monitor', 'snmp', 'syslog']],
  ['update-server', 'servers','update',      '#475569', ['patch']],
  ['radius-server', 'servers', 'radius',      '#dc2626', ['radius']],
  ['hypervisor', 'servers', 'hypervisor',  '#0891b2', ['esxi']],
  ['container', 'servers', 'container',   '#0891b2', ['docker']],
  ['k8s', 'servers', 'k8s',         '#0891b2', ['k8s', 'api']],
  ['pbx', 'servers', 'pbx',         '#059669', ['sip', 'pbx']],
  ['rack', 'servers', 'rack',        '#475569', []],

  // ---- storage ----
  ['nas', 'storage', 'nas',         '#b45309', ['smb', 'nfs']],
  ['san', 'storage', 'san',         '#b45309', ['iscsi']],
  ['tape', 'storage', 'tape',        '#b45309', ['backup']],

  // ---- endpoints ----
  ['pc', 'endpoints', 'pc',        '#334155', []],
  ['laptop', 'endpoints', 'laptop',    '#334155', []],
  ['thinclient', 'endpoints', 'thin',      '#334155', ['vdi']],
  ['mobile', 'endpoints', 'mobile',    '#334155', []],
  ['ipphone', 'endpoints', 'ipphone',   '#059669', ['sip']],
  ['printer', 'endpoints', 'printer',   '#334155', []],
  ['camera', 'endpoints', 'camera',    '#334155', []],
  ['iot', 'endpoints', 'iot',       '#334155', ['mqtt']],
  ['user', 'endpoints', 'user',      '#334155', []],

  // ---- internet & cloud ----
  ['internet', 'wan', 'internet',        '#0ea5e9', []],
  ['cloud', 'wan', 'cloud',           '#0ea5e9', []],
  ['isp', 'wan', 'isp',             '#0ea5e9', []],
  ['mpls', 'wan', 'mpls',            '#0ea5e9', ['routing']],
  ['saas', 'wan', 'saas',            '#7c3aed', ['web', 'sso']],
  ['publiccloud', 'wan', 'publicCloud',     '#2563eb', ['api']],
  ['lte', 'wan', 'lte',             '#0ea5e9', []],
  ['satellite', 'wan', 'satellite',       '#0ea5e9', []],

  // ---- other ----
  ['generic', 'misc', 'box',            '#64748b', []],
  ['ups', 'misc', 'ups',            '#64748b', []],
];

export const DEVICES = {};
for (const c of DEVICE_CATEGORIES) {
  Object.defineProperty(c, 'label', { get: () => t(`cat.${c.id}`), enumerable: true });
}

for (const [id, category, icon, accent, services] of DEVICE_LIST) {
  DEVICES[id] = {
    id, category, icon, accent, services,
    get label() { return t(`dev.${id}`); },
  };
}

export const LINK_KINDS = {
  lan:      { id: 'lan',      color: '#475569', width: 2,   dash: null },
  trunk:    { id: 'trunk',    color: '#1e293b', width: 3.4, dash: null },
  fiber:    { id: 'fiber',    color: '#f59e0b', width: 2.6, dash: null },
  wan:      { id: 'wan',      color: '#0ea5e9', width: 3,   dash: null },
  wireless: { id: 'wireless', color: '#0891b2', width: 2,   dash: '2 5' },
  vpn:      { id: 'vpn',      color: '#7c3aed', width: 2.6, dash: '9 5' },
  serial:   { id: 'serial',   color: '#78716c', width: 2,   dash: '10 4 2 4' },
  logical:  { id: 'logical',  color: '#94a3b8', width: 1.6, dash: '3 4' },
};

export const ZONE_COLORS = [
  { id: 'slate',    color: '#64748b' },
  { id: 'blue',     color: '#2563eb' },
  { id: 'green',    color: '#059669' },
  { id: 'amber',    color: '#d97706' },
  { id: 'red',      color: '#dc2626' },
  { id: 'violet',   color: '#7c3aed' },
];

for (const k of Object.values(LINK_KINDS)) {
  Object.defineProperty(k, 'label', { get: () => t(`link.${k.id}`), enumerable: true });
}
for (const z of ZONE_COLORS) {
  Object.defineProperty(z, 'label', { get: () => t(`zone.${z.id}`), enumerable: true });
}

/** Every label a device type has in any language (the inspector keeps a typed name on a type change). */
export function isDefaultLabel(label) {
  return ['hr', 'en'].some((l) => Object.keys(DEVICES).some((id) => globalThis.SimStrings?.[l]?.[`dev.${id}`] === label));
}

export function deviceOrDefault(type) {
  return DEVICES[type] || DEVICES.generic;
}
