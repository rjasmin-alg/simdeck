// SPDX-License-Identifier: AGPL-3.0-or-later
// Ready-made topologies. These double as the fastest way to start a lecture:
// load one, rename the boxes, delete what you don't need.
// simdeck copy: the words are in strings.js (s.<sample>.*); host names, addresses and VLAN numbers are data.

import { DOC_VERSION } from './state.js';
import { deviceOrDefault } from './catalog.js';
import { t } from './i18n.js';

/** Tiny DSL so the diagrams below read like the picture they draw. */
function build(title, fn) {
  const doc = { version: DOC_VERSION, title, nodes: [], links: [], zones: [], notes: [] };
  const keys = new Map();
  let seq = 0;
  const next = (p) => `${p}${(seq += 1).toString(36)}`;

  const api = {
    node(key, type, x, y, label, sublabel = '', services = null, step = 0) {
      const id = next('n');
      keys.set(key, id);
      doc.nodes.push({
        id, type, x, y, label, sublabel, step, notes: '',
        services: services || [...deviceOrDefault(type).services],
      });
      return id;
    },
    link(a, b, kind = 'lan', opts = {}) {
      doc.links.push({
        id: next('l'), from: keys.get(a), to: keys.get(b), kind,
        label: '', fromLabel: '', toLabel: '', directed: false, offset: 0, step: 0, ...opts,
      });
    },
    zone(x, y, w, h, label, color = 'slate', step = 0) {
      doc.zones.push({ id: next('z'), x, y, w, h, label, color, step });
    },
    note(x, y, text, size = 14, color = '#334155', step = 0) {
      doc.notes.push({ id: next('t'), x, y, w: 320, text, size, color, step });
    },
  };
  fn(api);
  return doc;
}

// ---------------------------------------------------------------------------
const twoSites = () => build(t('s.twoSites.label'), (d) => {
  d.note(40, 90, t('s.twoSites.heading'), 24, '#0f172a');
  d.note(40, 120, t('s.twoSites.lead'), 13, '#64748b');

  d.zone(40, 170, 680, 500, t('s.twoSites.hq'), 'blue');
  d.zone(1080, 170, 600, 500, t('s.twoSites.branch'), 'green');

  d.node('inet', 'internet', 900, 190, t('dev.internet'), t('s.twoSites.untrusted'));

  // --- head office ---
  d.node('fw', 'ngfw', 350, 250, t('s.twoSites.edgeFw'), '203.0.113.10');
  d.node('core', 'switch-core', 350, 390, t('s.twoSites.core'), 'VLAN 10 / 20 / 30');
  d.node('dc', 'dc', 110, 560, 'DC01', '10.10.0.10');
  d.node('fs', 'file-server-w', 280, 560, 'FS01', '10.10.0.20 — \\\\FS01\\share');
  d.node('lin', 'file-server', 450, 560, 'files01', '10.10.0.30 — SMB + NFS');
  d.node('acc', 'switch-l2', 620, 390, t('s.twoSites.access'), '');
  d.node('pcs', 'pc', 620, 560, t('s.twoSites.pcs'), t('s.twoSites.pcsSub'));

  d.link('fw', 'core', 'fiber', { fromLabel: 'LAN', toLabel: 'Te1/0/1' });
  d.link('core', 'acc', 'trunk', { label: '802.1Q' });
  d.link('core', 'dc');
  d.link('core', 'fs');
  d.link('core', 'lin');
  d.link('acc', 'pcs');

  // --- branch ---
  d.node('bfw', 'fw-oss', 1370, 250, t('s.twoSites.branchFw'), '198.51.100.7');
  d.node('bsw', 'switch-l2', 1370, 390, t('s.twoSites.branchSw'), '');
  d.node('rodc', 'rodc', 1200, 560, 'RODC01', t('s.twoSites.rodcSub'));
  d.node('nas', 'nas', 1370, 560, 'NAS01', t('s.twoSites.nasSub'));
  d.node('bpc', 'pc', 1540, 560, t('s.twoSites.branchPcs'), t('s.twoSites.branchPcsSub'));

  d.link('bfw', 'bsw');
  d.link('bsw', 'rodc');
  d.link('bsw', 'nas');
  d.link('bsw', 'bpc');

  // --- between the sites ---
  d.link('fw', 'inet', 'wan', { label: t('s.twoSites.fibre') });
  d.link('inet', 'bfw', 'wan', { label: '200/50 Mb' });
  d.link('fw', 'bfw', 'vpn', { label: t('s.twoSites.tunnel'), offset: 24 });

  d.note(760, 700,
    t('s.twoSites.talk'), 13, '#475569');
});

// ---------------------------------------------------------------------------
const dmz = () => build(t('s.dmz.label'), (d) => {
  d.note(140, 70, t('s.dmz.heading'), 24, '#0f172a');
  d.note(140, 100, t('s.dmz.lead'), 13, '#64748b');

  d.node('inet', 'internet', 420, 190, t('dev.internet'), '');
  d.node('fw', 'ngfw', 420, 330, t('s.dmz.perimeterFw'), t('s.dmz.perimeterSub'));
  d.link('inet', 'fw', 'wan');

  // The DMZ hangs off its own switch — a firewall leg per server would put
  // cables straight through the neighbouring boxes.
  d.zone(640, 250, 680, 430, t('s.dmz.zone'), 'amber', 1);
  // Centred over the three servers so every drop routes vertically and
  // nothing is cabled through its neighbour.
  d.node('dmzsw', 'switch-l2', 940, 330, t('s.dmz.switch'), '', null, 1);
  d.node('web', 'web-server', 760, 520, 'www01', '198.51.100.20', null, 1);
  d.node('mail', 'mail-server', 940, 520, 'mx01', '198.51.100.21', null, 1);
  d.node('rp', 'waf', 1120, 520, t('s.dmz.revProxy'), t('s.dmz.revProxySub'), null, 1);
  d.link('fw', 'dmzsw', 'lan', { label: t('s.dmz.leg'), step: 1 });
  d.link('dmzsw', 'web', 'lan', { step: 1 });
  d.link('dmzsw', 'mail', 'lan', { step: 1 });
  d.link('dmzsw', 'rp', 'lan', { step: 1 });

  d.node('ifw', 'firewall', 420, 540, t('s.dmz.internalFw'), t('s.dmz.internalSub'), null, 2);
  d.link('fw', 'ifw', 'lan', { label: t('s.dmz.insideLeg'), directed: true, step: 2 });

  d.zone(140, 650, 700, 380, t('s.dmz.lan'), 'green', 2);
  d.node('core', 'switch-l3', 420, 730, t('s.dmz.core'), t('s.dmz.coreSub'), null, 2);
  d.node('dc', 'dc', 250, 900, 'DC01', '10.0.0.10', null, 2);
  d.node('fs', 'file-server', 420, 900, 'files01', '10.0.0.20 — SMB', null, 2);
  d.node('pcs', 'pc', 620, 900, t('s.dmz.workstations'), 'VLAN 20', null, 2);
  d.link('ifw', 'core', 'lan', { step: 2 });
  d.link('core', 'dc', 'lan', { step: 2 });
  d.link('core', 'fs', 'lan', { step: 2 });
  d.link('core', 'pcs', 'trunk', { step: 2 });

  d.note(1400, 300,
    t('s.dmz.talk'), 13, '#475569', 2);
});

// ---------------------------------------------------------------------------
const campus = () => build(t('s.campus.title'), (d) => {
  d.note(180, 70, t('s.campus.heading'), 24, '#0f172a');

  d.node('rtr', 'router', 560, 170, t('s.campus.edge'), t('s.campus.edgeSub'));
  d.node('core1', 'switch-core', 400, 320, 'Core-1', '');
  d.node('core2', 'switch-core', 720, 320, 'Core-2', '');
  d.node('wlc', 'wlc', 1010, 320, 'WLC', t('s.campus.wlcSub'));

  d.node('dist1', 'switch-l3', 290, 490, 'Dist-A', t('s.campus.buildingA'));
  d.node('dist2', 'switch-l3', 830, 490, 'Dist-B', t('s.campus.buildingB'));

  d.node('acc1', 'switch-poe', 170, 660, t('s.campus.accA1'), '');
  d.node('acc2', 'switch-l2', 400, 660, t('s.campus.accA2'), '');
  d.node('acc3', 'switch-l2', 720, 660, t('s.campus.accB1'), '');
  d.node('acc4', 'switch-poe', 950, 660, t('s.campus.accB2'), '');

  d.node('ap', 'ap', 170, 830, t('s.campus.aps'), t('s.campus.apsSub'));
  d.node('pcs', 'pc', 400, 830, t('s.campus.labs'), '×60');
  d.node('voip', 'ipphone', 720, 830, t('s.campus.phones'), t('s.campus.phonesSub'));
  d.node('cam', 'camera', 950, 830, t('s.campus.cameras'), 'PoE+');

  d.link('rtr', 'core1', 'fiber');
  d.link('rtr', 'core2', 'fiber');
  d.link('core1', 'core2', 'trunk', { label: 'MEC / stack' });
  d.link('core1', 'dist1', 'fiber');
  d.link('core2', 'dist1', 'fiber', { offset: 16 });
  d.link('core1', 'dist2', 'fiber', { offset: -16 });
  d.link('core2', 'dist2', 'fiber');
  d.link('core2', 'wlc');
  d.link('dist1', 'acc1', 'trunk');
  d.link('dist1', 'acc2', 'trunk');
  d.link('dist2', 'acc3', 'trunk');
  d.link('dist2', 'acc4', 'trunk');
  d.link('acc1', 'ap', 'lan');
  d.link('acc2', 'pcs');
  d.link('acc3', 'voip');
  d.link('acc4', 'cam');

  d.note(1130, 620,
    t('s.campus.talk'), 13, '#475569');
});

// Each id is also a simdeck preset entry (sim.json `entries`: ?sample=<id>&present=1).
const sample = (id, key, make) => ({
  id, make, get label() { return t(`s.${key}.label`); }, get hint() { return t(`s.${key}.hint`); },
});
export const SAMPLES = [
  sample('two-sites', 'twoSites', twoSites),
  sample('dmz', 'dmz', dmz),
  sample('campus', 'campus', campus),
];

export function makeSample(id) {
  return SAMPLES.find((s) => s.id === id)?.make() || null;
}
