/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-ad-recycle-bin: two OUs and their 65 users are deleted on day 0, then recovered. Without the Recycle
   Bin a deleted object is a tombstone (SID, objectGUID and name only) for tombstoneLifetime days; with it, a deleted
   object that keeps everything for msDS-deletedObjectLifetime, then a recycled object for tombstoneLifetime more.
   Garbage collection removes an object at its first run after its lifetime. Turning the Recycle Bin on afterwards
   turns every tombstone into a recycled object. Reanimation brings a tombstone back without attributes, memberships
   and password; the Recycle Bin brings a deleted object back whole; both need the parent OU first. An authoritative
   restore brings everything back as of a backup no older than the tombstone lifetime.
   Rules and numbers: SPEC.md (rule numbers below). Mostly a new model; win-ad-replication is only referenced for
   rule 7's version raise (win-ad-backup-restore holds that mechanism).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var TSL = 180;            // tombstoneLifetime (estate forest.txt)
  var DOL = 180;            // msDS-deletedObjectLifetime: not set, so = tombstoneLifetime
  var OUS = [
    { id: 'HQ', users: 21 },
    { id: 'Brackenridge', users: 44 }
  ];
  var FIELDS = ['sid', 'guid', 'name', 'attrs', 'groups', 'password'];

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function clampInt(v, lo, hi, dflt, step) {
    var n = Number(v);
    if (!isFinite(n)) n = dflt;
    n = Math.round(n / step) * step;
    return Math.max(lo, Math.min(hi, n));
  }
  function keepsAll(on) {
    var k = {};
    FIELDS.forEach(function (f) { k[f] = on; });
    return k;
  }
  /** Rule 1: what a tombstone (or a recycled object) keeps. */
  function keepsStripped() {
    return { sid: true, guid: true, name: true, attrs: false, groups: false, password: false };
  }

  /** The params the model acts on (SPEC.md "Params"). */
  function eff(p) {
    var mode = p.recycleBin === 'before' || p.recycleBin === 'after' ? p.recycleBin : 'off';
    var age = Number(p.backupAgeDays);
    return {
      recycleBin: mode === 'before',
      enableAfter: mode === 'after',
      daysSince: clampInt(p.daysSince, 0, 400, 0, 10),
      backupAgeDays: age === 80 ? 80 : 0,
      usersFirst: !!p.usersFirst
    };
  }

  /** The state every deleted object would be in on day d (since its deletion on day 0), with no restore in between:
      rules 1, 2, 4, 6. Used to plan; the steps apply the same lifetimes. */
  function fateOn(e, d) {
    if (e.recycleBin) {
      if (d <= DOL) return 'deleted';
      if (d <= DOL + TSL) return 'recycled';
      return 'gone';
    }
    if (d > TSL) return 'gone';
    return e.enableAfter ? 'recycled' : 'tombstone';
  }

  /** Rule 7: how old the backup is at the restore, and whether it is still usable. */
  function backupLife(s) {
    return s.recycleBin ? Math.min(s.tsl, s.dol) : s.tsl;
  }
  function backupUsable(s) {
    if (!s.backup) return { ok: false, why: 'none' };
    var age = s.day - s.backup.day;
    return age <= backupLife(s) ? { ok: true, age: age } : { ok: false, why: 'too-old', age: age };
  }

  /** The event of each step (SPEC.md "Steps"). */
  function plan(p) {
    var e = eff(p);
    var out = [{ kind: 'delete' }];
    if (e.daysSince > 0) out.push({ kind: 'wait', to: e.daysSince });
    if (e.enableAfter) out.push({ kind: 'enable' });
    var fate = fateOn(e, e.daysSince);
    if (fate === 'deleted' || fate === 'tombstone') {
      var method = fate === 'deleted' ? 'bin' : 'reanimate';
      if (e.usersFirst) out.push({ kind: 'restore', what: 'users', method: method });
      out.push({ kind: 'restore', what: 'ous', method: method });
      out.push({ kind: 'restore', what: 'users', method: method });
    } else {
      out.push({ kind: 'attempt', method: e.recycleBin || e.enableAfter ? 'bin' : 'reanimate' });
      if (e.backupAgeDays) out.push({ kind: 'auth' });
    }
    out.push({ kind: 'outcome' });
    return out;
  }

  function steps(p) { return plan(p).length; }

  /** Rules 2, 4, 6: move every deleted object on to day d; garbage collection removes what is past its lifetime. */
  function advance(s, d) {
    var moved = { recycled: 0, gone: 0 };
    s.objects.forEach(function (o) {
      // a deleted object past its lifetime becomes recycled, with a new lifetime of tsl (rule 4)
      if (o.state === 'deleted' && d > o.until) {
        o.state = 'recycled';
        o.keeps = keepsStripped();
        o.until = o.until + s.tsl;
        moved.recycled++;
      }
      if ((o.state === 'tombstone' || o.state === 'recycled') && d > o.until) {
        o.state = 'gone';
        o.keeps = keepsAll(false);
        o.until = null;
        moved.gone++;
      }
    });
    s.day = d;
    return moved;
  }

  function byId(s, id) {
    for (var i = 0; i < s.objects.length; i++) if (s.objects[i].id === id) return s.objects[i];
    return null;
  }

  /** Rules 1, 4: the deletion. */
  function del(s) {
    s.objects.forEach(function (o) {
      o.deletedOn = s.day;
      o.restoredOn = null;
      o.by = null;
      o.asOf = null;
      if (s.recycleBin) {
        o.state = 'deleted';
        o.until = s.day + s.dol;
      } else {
        o.state = 'tombstone';
        o.keeps = keepsStripped();
        o.until = s.day + s.tsl;
      }
    });
    s.last = { kind: 'delete', ous: OUS.length, users: count(s, 'user'), state: s.recycleBin ? 'deleted' : 'tombstone' };
  }

  /** Rule 6: the Recycle Bin is turned on; every tombstone becomes a recycled object (keeping its clock). */
  function enable(s) {
    var n = 0;
    s.recycleBin = true;
    s.enabledOn = s.day;
    s.objects.forEach(function (o) {
      if (o.state === 'tombstone') { o.state = 'recycled'; n++; }
    });
    s.last = { kind: 'enable', recycled: n };
  }

  /** Rules 3, 5, 8: restore the OUs or the users, from the Recycle Bin or by reanimation. */
  function restore(s, ev) {
    var from = ev.method === 'bin' ? 'deleted' : 'tombstone';
    var e = { kind: 'restore', what: ev.what, method: ev.method, ok: 0, failed: 0, why: null };
    s.objects.forEach(function (o) {
      if ((ev.what === 'ous') !== (o.kind === 'ou')) return;
      if (o.state !== from) { e.failed++; e.why = e.why || o.state; return; }
      if (o.parent && byId(s, o.parent) && byId(s, o.parent).state !== 'live') {
        e.failed++;
        e.why = 'parent';
        return;
      }
      o.state = 'live';
      o.until = null;
      o.by = ev.method;
      o.restoredOn = s.day;
      o.keeps = ev.method === 'bin' ? keepsAll(true) : keepsStripped();
      e.ok++;
    });
    s.last = e;
  }

  /** No online way back (recycled or gone): the attempt fails. */
  function attempt(s, ev) {
    var states = {};
    s.objects.forEach(function (o) { states[o.state] = (states[o.state] || 0) + 1; });
    s.last = { kind: 'attempt', method: ev.method, ok: 0, why: states.gone === s.objects.length ? 'gone' : 'recycled',
      recycled: states.recycled || 0, gone: states.gone || 0 };
  }

  /** Rule 7: the authoritative restore of the subtree from the backup (parents first inside it). */
  function auth(s) {
    var u = backupUsable(s);
    var e = { kind: 'auth', ok: 0, age: u.age, life: backupLife(s), why: u.ok ? null : u.why };
    if (u.ok) {
      s.objects.forEach(function (o) {
        o.state = 'live';
        o.until = null;
        o.by = 'auth';
        o.restoredOn = s.day;
        o.asOf = s.backup.day;
        o.keeps = keepsAll(true);
        e.ok++;
      });
    }
    s.last = e;
  }

  function count(s, kind, pred) {
    return s.objects.filter(function (o) { return o.kind === kind && (!pred || pred(o)); }).length;
  }

  /** Rule 9: what a user can do after the recovery. */
  function verdict(o) {
    var live = o.state === 'live';
    return {
      logon: !live ? 'no' : o.keeps.password ? 'yes' : 'reset',
      files: live && o.keeps.sid,
      groups: live && o.keeps.groups
    };
  }

  /** What each restore action could do now (the page's restore panel). */
  function options(s) {
    var st = {};
    s.objects.forEach(function (o) { st[o.state] = (st[o.state] || 0) + 1; });
    var n = s.objects.length;
    var re = st.tombstone ? { ok: true, n: st.tombstone }
      : { ok: false, why: st.live === n ? 'live' : st.recycled ? 'recycled' : st.gone ? 'gone' : st.deleted ? 'bin-on' : 'none' };
    var bin = st.deleted ? { ok: true, n: st.deleted }
      : { ok: false, why: st.live === n ? 'live' : !s.recycleBin ? 'off' : st.recycled ? 'recycled' : st.gone ? 'gone' : 'none' };
    var u = backupUsable(s);
    var au = st.live === n ? { ok: false, why: 'live' } : u.ok ? { ok: true, age: u.age } : { ok: false, why: u.why, age: u.age };
    return { reanimate: re, bin: bin, auth: au };
  }

  /** The life of one object on the time axis (SPEC.md "Scene"): [{ from, to, state, by }] from its deletion to day
      `end`, projected past today with the lifetimes (rules 2, 4, 6), cut where it was restored. Before the deletion:
      []. */
  function lane(s, o, end) {
    if (o.deletedOn === null) return [];
    var d0 = o.deletedOn;
    var binAtDelete = s.recycleBin && s.enabledOn === null;
    var segs = [];
    if (binAtDelete) {
      segs.push({ from: d0, to: d0 + s.dol, state: 'deleted' });
      segs.push({ from: d0 + s.dol, to: d0 + s.dol + s.tsl, state: 'recycled' });
      segs.push({ from: d0 + s.dol + s.tsl, to: end, state: 'gone' });
    } else {
      var e = s.enabledOn === null ? Infinity : s.enabledOn;
      segs.push({ from: d0, to: Math.min(e, d0 + s.tsl), state: 'tombstone' });
      if (e < d0 + s.tsl) segs.push({ from: e, to: d0 + s.tsl, state: 'recycled' });
      segs.push({ from: d0 + s.tsl, to: end, state: 'gone' });
    }
    var r = o.restoredOn;
    var out = [];
    segs.forEach(function (g) {
      var to = Math.min(g.to, end, r === null ? Infinity : r);
      if (to > g.from) out.push({ from: g.from, to: to, state: g.state });
    });
    if (r !== null && r < end) out.push({ from: r, to: end, state: 'live', by: o.by });
    return out;
  }

  var logic = {
    OUS: OUS,
    FIELDS: FIELDS,
    TSL: TSL,
    DOL: DOL,

    defaults: { recycleBin: 'off', daysSince: 0, backupAgeDays: 0, usersFirst: false },

    steps: steps,

    initial: function (p) {
      var e = eff(p || {});
      var objects = [];
      OUS.forEach(function (ou) {
        objects.push({ id: 'OU-' + ou.id, kind: 'ou', parent: null, ou: ou.id, state: 'live', deletedOn: null, until: null,
          keeps: keepsAll(true), by: null, asOf: null, restoredOn: null });
        for (var k = 1; k <= ou.users; k++) {
          objects.push({ id: ou.id + '-' + k, kind: 'user', parent: 'OU-' + ou.id, ou: ou.id, state: 'live', deletedOn: null,
            until: null, keeps: keepsAll(true), by: null, asOf: null, restoredOn: null });
        }
      });
      return { day: 0, recycleBin: e.recycleBin, enabledOn: null, tsl: TSL, dol: DOL,
        backup: e.backupAgeDays ? { day: -e.backupAgeDays } : null, objects: objects, log: [], last: null };
    },

    step: function (prev, n, p) {
      var s = clone(prev);
      var ev = plan(p)[n - 1];
      if (!ev) return s;
      if (ev.kind === 'delete') del(s);
      else if (ev.kind === 'wait') {
        var from = s.day;
        var moved = advance(s, ev.to);
        s.last = { kind: 'wait', from: from, to: ev.to, gc: (ev.to - from) * 2, recycled: moved.recycled, gone: moved.gone };
      }
      else if (ev.kind === 'enable') enable(s);
      else if (ev.kind === 'restore') restore(s, ev);
      else if (ev.kind === 'attempt') attempt(s, ev);
      else if (ev.kind === 'auth') auth(s);
      else s.last = { kind: 'outcome' };
      s.log.push(ev.kind);
      return s;
    },

    // exported for tests and the page
    eff: eff,
    plan: plan,
    fateOn: fateOn,
    advance: advance,
    backupUsable: backupUsable,
    options: options,
    verdict: verdict,
    lane: lane,
    count: count
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
