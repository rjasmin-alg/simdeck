/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for vlan: two switches, each with a host in VLAN 10 (accounting) and one in VLAN 20 (sales), joined by one
   cable (URM book, ch. 7, Primjer 5). Two frames cross: Ra1 to Ra2 in VLAN 10, then Pr1 to Pr2 in VLAN 20. Each frame
   takes three steps: it enters SW1 untagged on an access port, which puts it in that port's VLAN (membership); it
   reaches the link between the switches, where a trunk port tags it with its VLAN ID and an access port carries it
   untagged only when the link is in the frame's own VLAN (otherwise the frame never leaves SW1); and SW2 reads the
   VLAN (from the tag on a trunk, from its own port on an access link), removes the tag and delivers the frame,
   untagged, to the host of that VLAN.
   Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON. parseLink, carries, tagOnLink, arrivalVlan
   and cross are pure functions over plain data with no strings, so they can move to models/ unchanged when
   net-vlan-trunk (catalogue §5.9, "extends urm-vlan") reuses them. */
(function (root) {
  'use strict';

  var VLANS = [10, 20];
  var LINKS = ['trunk', 'access-10', 'access-20'];
  /** The hosts: two per switch, one per VLAN (Ra = accounting, Pr = sales, as in the fragment). */
  var HOSTS = [
    { id: 'Ra1', sw: 1, vlan: 10 }, { id: 'Pr1', sw: 1, vlan: 20 },
    { id: 'Ra2', sw: 2, vlan: 10 }, { id: 'Pr2', sw: 2, vlan: 20 }
  ];
  var FRAMES = [{ src: 'Ra1', dst: 'Ra2', vlan: 10 }, { src: 'Pr1', dst: 'Pr2', vlan: 20 }];
  var PER_FRAME = 3;
  var STEPS = PER_FRAME * FRAMES.length;

  /** 'trunk' → { mode: 'trunk' }; 'access-10' → { mode: 'access', vlan: 10 }. The same setting on both ends. */
  function parseLink(link) {
    if (link === 'trunk') return { mode: 'trunk', vlan: null };
    var m = /^access-(\d+)$/.exec(link);
    if (!m) throw new Error('unknown link ' + link);
    return { mode: 'access', vlan: Number(m[1]) };
  }

  /** Can a frame of `vlan` leave on this link? A trunk carries every VLAN; an access port only the one it is in. */
  function carries(link, vlan) {
    var l = parseLink(link);
    return l.mode === 'trunk' || l.vlan === vlan;
  }

  /** The VLAN ID in the tag the frame wears on the link: its VLAN on a trunk, none (untagged) on an access port. */
  function tagOnLink(link, vlan) {
    return parseLink(link).mode === 'trunk' ? vlan : null;
  }

  /** The VLAN the receiving switch puts an arriving frame in: the tag's on a trunk, its own port's on an access link
      (an access port never looks for a tag). */
  function arrivalVlan(link, tag) {
    var l = parseLink(link);
    return l.mode === 'trunk' ? tag : l.vlan;
  }

  /** The whole crossing of one frame of `vlan`: whether it leaves SW1, its tag on the wire, and the VLAN it is in on
      SW2 (null when it never arrived). */
  function cross(link, vlan) {
    if (!carries(link, vlan)) return { crosses: false, tag: null, vlanOnSw2: null };
    var tag = tagOnLink(link, vlan);
    return { crosses: true, tag: tag, vlanOnSw2: arrivalVlan(link, tag) };
  }

  /** The host on switch `sw` that is in `vlan`, or null. */
  function hostIn(sw, vlan) {
    for (var i = 0; i < HOSTS.length; i++) if (HOSTS[i].sw === sw && HOSTS[i].vlan === vlan) return HOSTS[i].id;
    return null;
  }

  var logic = {
    /** The book's numbers: URM ch. 7, Primjer 5 (b): the cable is set by mistake as an access port in VLAN 10. */
    defaults: { link: 'access-10' },
    vlans: VLANS,
    links: LINKS,
    hosts: HOSTS,
    frames: FRAMES,
    perFrame: PER_FRAME,
    steps: STEPS,

    /** Step 0: nothing sent yet, no outcome known. */
    initial: function () {
      return { frame: 0, phase: 'idle', src: null, dst: null, vlan: null, at: null, tag: null, tagChange: null,
        delivered: null, results: { 10: null, 20: null } };
    },

    /** Steps 1, 4: the frame enters SW1. Steps 2, 5: it reaches the link. Steps 3, 6: SW2 delivers it (or nothing
        arrives). */
    step: function (s, n, p) {
      var k = Math.ceil(n / PER_FRAME);
      var f = FRAMES[k - 1];
      var phase = ['enter', 'link', 'exit'][(n - 1) % PER_FRAME];
      var c = cross(p.link, f.vlan);
      var out = { frame: k, phase: phase, src: f.src, dst: f.dst, vlan: f.vlan, at: null, tag: null, tagChange: null,
        delivered: null, results: { 10: s.results[10], 20: s.results[20] } };
      if (phase === 'enter') out.at = 'sw1';
      else if (phase === 'link') {
        if (c.crosses) { out.at = 'link'; out.tag = c.tag; out.tagChange = c.tag === null ? null : 'added'; }
        else out.at = 'held';
      } else {
        if (c.crosses) {
          out.at = 'host';
          out.delivered = hostIn(2, c.vlanOnSw2);
          out.tagChange = s.tag === null ? null : 'removed';
        } else out.at = 'held';
        out.results[f.vlan] = out.delivered === f.dst ? 'ok' : 'cut';
      }
      return out;
    },

    parseLink: parseLink,
    carries: carries,
    tagOnLink: tagOnLink,
    arrivalVlan: arrivalVlan,
    cross: cross,
    hostIn: hostIn
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
