/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for "where the kernel and the hypervisor sit": four layer stacks (bare metal, hosted, kernel-based, containers)
   as trees rooted at the hardware, the kernel count of each, which kernel serves each layer, what `uname -r` prints
   there, what isolates it, and the compare choice that dims all but two stacks. A reference page: no steps; the state
   is derived from the params. Rules, numbers and tie-breaks: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** Stacks in screen order (SPEC.md §1). */
  var STACK_IDS = ['type1', 'type2', 'kernel', 'containers'];

  /** Compare modes: the two stacks kept bright, or null for all (SPEC.md rule 11). */
  var COMPARE = {
    'all': null,
    'vm-vs-container': ['kernel', 'containers'],
    'type1-vs-type2': ['type1', 'type2'],
    'kernel': ['type2', 'kernel']
  };
  var COMPARE_IDS = Object.keys(COMPARE);

  /** Kinds of layer. kernel: counted as a kernel (rule 7); hv: a hypervisor (rule 1); serves: lights what stands on
      it when selected (rule 10). */
  var KINDS = {
    hw: { kernel: false, hv: false, serves: false },
    hv: { kernel: false, hv: true, serves: true },
    hostk: { kernel: true, hv: false, serves: true },
    kvmk: { kernel: true, hv: true, serves: true },
    ctrk: { kernel: true, hv: false, serves: true },
    hostapp: { kernel: false, hv: false, serves: false },
    dhv: { kernel: false, hv: true, serves: true },
    emu: { kernel: false, hv: false, serves: false },
    gk: { kernel: true, hv: false, serves: true },
    app: { kernel: false, hv: false, serves: false },
    ctr: { kernel: false, hv: false, serves: false }
  };

  /** What isolates a layer from its neighbour (rule 6), one code per kind; the page words it. */
  var BOUNDARY = {
    hw: 'none', hv: 'hv-is', hostk: 'host-kernel', kvmk: 'kvm-is', ctrk: 'ns-cgroups-owner', hostapp: 'process',
    dhv: 'process-hv', emu: 'process-emu', gk: 'hypervisor', app: 'guest-kernel', ctr: 'ns-cgroups'
  };

  /** `uname -r` versions (rule 9): illustrative, each guest's different from the host's. */
  var HOST_VERSION = '6.12.0';
  var GUEST_VERSIONS = ['6.1.0', '5.14.0', '6.6.0'];

  var MIN_GUESTS = 1, MAX_GUESTS = 3;

  /** The laptop of UL ch02 Primjer 4 (rule 12): 8 GB in all, 2 GB per guest. */
  var LAPTOP = { total: 8, perGuest: 2 };

  function own(table, key) { return typeof key === 'string' && Object.prototype.hasOwnProperty.call(table, key); }

  function guestsOf(p) {
    var g = typeof p.guests === 'number' && Number.isFinite(p.guests) ? p.guests : 2; // the kit hands ranges over as numbers
    return Math.max(MIN_GUESTS, Math.min(MAX_GUESTS, Math.round(g)));
  }

  // ── rules 1–5: the stacks as trees ──

  /** One stack's layers in tree order (bottom first, then left to right, depth first). */
  function layersOf(stack, g, win) {
    var out = [];
    function add(kind, on, guest) {
      var id = guest ? kind + guest : kind;
      // the emulator process is a host process: no guest OS of its own (SPEC.md rule 4)
      var os = guest && kind !== 'emu' ? (win && guest === g ? 'windows' : 'linux') : null;
      out.push({ id: id, kind: kind, on: on, guest: guest || null, os: os, rejected: kind === 'ctr' && os === 'windows' });
      return id;
    }
    var hw = add('hw', null, 0);
    var i;
    if (stack === 'type1') {
      var hv = add('hv', hw, 0);
      for (i = 1; i <= g; i++) add('app', add('gk', hv, i), i);
    } else if (stack === 'type2') {
      var hostk = add('hostk', hw, 0);
      add('hostapp', hostk, 0);
      var dhv = add('dhv', hostk, 0);
      for (i = 1; i <= g; i++) add('app', add('gk', dhv, i), i);
    } else if (stack === 'kernel') {
      var kvmk = add('kvmk', hw, 0);
      for (i = 1; i <= g; i++) add('app', add('gk', add('emu', kvmk, i), i), i);
    } else if (stack === 'containers') {
      var ctrk = add('ctrk', hw, 0);
      for (i = 1; i <= g; i++) add('ctr', ctrk, i);
    }
    return out;
  }

  function byId(layers, id) { return layers.filter(function (l) { return l.id === id; })[0] || null; }

  // ── rule 7: kernel count ──

  function kernelCount(layers) {
    return layers.filter(function (l) { return KINDS[l.kind].kernel && !l.rejected; }).length;
  }

  // ── rules 8–9: which kernel serves a layer, and uname -r ──

  /** The id of the kernel layer that serves this layer, or null (rule 8). */
  function servingKernel(stack, layer) {
    if (layer.rejected) return null;
    switch (layer.kind) {
      case 'hw': case 'hv': return null;
      case 'hostk': case 'kvmk': case 'ctrk': case 'gk': return layer.id;
      case 'hostapp': case 'dhv': return 'hostk';
      case 'emu': return 'kvmk';
      case 'ctr': return 'ctrk';
      case 'app': return 'gk' + layer.guest;
    }
    return null;
  }

  /** What the card says about the kernel here: none | hv | host | guest (rule 8). */
  function kernelHere(stack, layer) {
    if (layer.kind === 'hv') return 'hv';
    var k = servingKernel(stack, layer);
    if (k === null) return 'none';
    return k.indexOf('gk') === 0 ? 'guest' : 'host';
  }

  /** `uname -r` at this position: { version, why } (rule 9). */
  function unameAt(stack, layer) {
    if (layer.rejected) return { version: null, why: 'rejected' };
    var here = kernelHere(stack, layer);
    if (here === 'none' || here === 'hv') return { version: null, why: 'no-app' };
    if (here === 'host') return { version: HOST_VERSION, why: null };
    if (layer.os === 'windows') return { version: null, why: 'windows' };
    return { version: GUEST_VERSIONS[layer.guest - 1], why: null };
  }

  // ── rule 10: linked layers ──

  function litOf(layers, layer, stack) {
    if (KINDS[layer.kind].serves) {
      return layers.filter(function (l) { return l.on === layer.id && !l.rejected; }).map(function (l) { return l.id; });
    }
    var k = servingKernel(stack, layer);
    return k === null ? [] : [k];
  }

  // ── tie-break 1: the selection ──

  /** The selected { stack, layer } if sel names a layer of the current stacks, else null. */
  function selectionOf(sel, g, win) {
    if (typeof sel !== 'string') return null;
    var parts = sel.split(':');
    if (parts.length !== 2 || STACK_IDS.indexOf(parts[0]) < 0) return null;
    var layer = byId(layersOf(parts[0], g, win), parts[1]);
    return layer ? { stack: parts[0], layer: layer.id } : null;
  }

  /** Every selectable sel at the largest guest count, for the page's hidden param. */
  function allSel() {
    var out = [''];
    STACK_IDS.forEach(function (s) {
      layersOf(s, MAX_GUESTS, false).forEach(function (l) { out.push(s + ':' + l.id); });
    });
    return out;
  }

  /** The card of the selected layer: language-free codes and data; the page words it. */
  function infoOf(stack, layer, layers) {
    var u = unameAt(stack, layer);
    var k = servingKernel(stack, layer);
    var running = layers.filter(function (l) { return (l.kind === 'ctr' || l.kind === 'gk') && !l.rejected; }).length;
    return {
      stack: stack, layer: layer.id, kind: layer.kind, guest: layer.guest, os: layer.os, rejected: layer.rejected,
      kernel: kernelHere(stack, layer), kernelGuest: k && k.indexOf('gk') === 0 ? layer.guest : null,
      uname: u.version, unameWhy: u.why, boundary: layer.rejected ? 'rejected' : BOUNDARY[layer.kind],
      // rule 6: who shares the kernel that serves this layer (containers: all running ones; a guest kernel: own).
      risk: layer.kind === 'ctrk' || (layer.kind === 'ctr' && !layer.rejected) ? 'shared'
        : layer.kind === 'gk' || layer.kind === 'app' ? 'own' : null,
      sharedBy: layer.kind === 'ctrk' || layer.kind === 'ctr' ? running : null,
      // rule 4: ps on the kernel-based host lists one emulator process per guest.
      ps: stack === 'kernel' && (layer.kind === 'kvmk' || layer.kind === 'emu')
        ? layers.filter(function (l) { return l.kind === 'emu'; }).map(function (l) { return l.guest; }) : null,
      extra: stack === 'type1' && layer.kind === 'hv' ? 1 : 0
    };
  }

  var logic = {
    STACK_IDS: STACK_IDS, COMPARE: COMPARE, COMPARE_IDS: COMPARE_IDS, KINDS: KINDS, BOUNDARY: BOUNDARY,
    HOST_VERSION: HOST_VERSION, GUEST_VERSIONS: GUEST_VERSIONS, LAPTOP: LAPTOP, MIN_GUESTS: MIN_GUESTS, MAX_GUESTS: MAX_GUESTS,

    defaults: { compare: 'all', guests: 2, win: false, sel: '', view: 'none' },

    /** A reference page: no steps. */
    steps: 0,

    /** The whole page as plain data, derived from the params. */
    initial: function (p) {
      var g = guestsOf(p);
      var win = p.win === true;
      var mode = own(COMPARE, p.compare) ? p.compare : 'all';
      var keep = COMPARE[mode];
      var selected = selectionOf(p.sel, g, win);
      var info = null, lit = [];
      var stacks = STACK_IDS.map(function (s) {
        var layers = layersOf(s, g, win);
        if (selected && selected.stack === s) {
          var layer = byId(layers, selected.layer);
          info = infoOf(s, layer, layers);
          lit = litOf(layers, layer, s);
        }
        return {
          id: s,
          dim: keep !== null && keep.indexOf(s) < 0,
          kernels: kernelCount(layers),
          extra: s === 'type1' ? 1 : 0,
          running: layers.filter(function (l) { return (l.kind === 'gk' || l.kind === 'ctr') && !l.rejected; }).length,
          layers: layers
        };
      });
      stacks.forEach(function (st) {
        st.layers.forEach(function (l) {
          l.sel = !!selected && selected.stack === st.id && selected.layer === l.id;
          l.lit = !!selected && selected.stack === st.id && lit.indexOf(l.id) >= 0;
        });
      });
      var book = p.view === 'book';
      return {
        compare: keep ? keep.slice() : null,
        mode: mode,
        guests: g,
        win: win,
        view: book ? 'book' : 'none',
        selected: selected,
        lit: selected ? lit.map(function (id) { return selected.stack + ':' + id; }) : [],
        info: info,
        laptop: book ? { total: LAPTOP.total, perGuest: LAPTOP.perGuest, host: LAPTOP.total - LAPTOP.perGuest * g } : null,
        stacks: stacks
      };
    },

    step: function (s) { return s; },

    guestsOf: guestsOf, layersOf: layersOf, kernelCount: kernelCount, servingKernel: servingKernel, kernelHere: kernelHere,
    unameAt: unameAt, litOf: litOf, selectionOf: selectionOf, allSel: allSel
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
