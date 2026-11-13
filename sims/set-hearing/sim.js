/* SPDX-License-Identifier: AGPL-3.0-or-later
   set-hearing: a crew member's shooting day built from exposures (a quiet dialogue scene, work near the generator, the
   wind machine, a scene with blank-firing weapons), each with its sound level; the daily dose adds the sound energy of
   every block, so every 3 dB more counts about twice and short loud events weigh heavily. Ear defenders cut the level
   at the ear only while worn (taking them off a few minutes an hour loses most of the cut); the generator's level falls
   by about 6 dB with every doubling of the distance. Two totals: without defenders (what the action values count) and
   at the ear (what the limit counts). The day's blocks come from day.js. An explorer: the state follows from the params.
   Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON. Rules: SPEC.md. */
(function (root) {
  'use strict';

  var day = typeof module === 'object' && module.exports
    ? require('./day.js')
    : root.SimdeckModels['set-day-blocks'];

  var REF_LEVEL = 85;        // dB(A): 8 h at this level is a dose of 100 % (the upper action value)
  var REF_MIN = 480;         // the nominal 8-hour day, minutes
  var LOWER = 80, UPPER = 85, LIMIT = 87;   // Directive 2003/10/EC art. 3(1), LEX,8h in dB(A)
  var ATT = 20;              // dB the ear defenders cut while worn (illustrative)
  var TAKE = 15;             // minutes per take in the blank-firing scene (illustrative)
  var SHOTS = 6;             // shots per take (illustrative)
  var SEL = 115;             // dB(A): each shot's sound energy at the crew position, as 1 s at this level (illustrative)
  var GEN_LEVEL = 91, GEN_REF = 5;          // the generator: 91 dB(A) at 5 m (illustrative)

  /** The kinds of block, in the fixed order the add buttons give them. level: dB(A) at the crew member's position
   *  (the blank-firing scene's level is its background between shots; the generator's is at GEN_REF m). */
  var KINDS = [
    { id: 'dialogue', level: 70 },
    { id: 'generator', level: GEN_LEVEL },
    { id: 'wind', level: 97 },
    { id: 'blanks', level: 75 }
  ];
  var KIND_IDS = KINDS.map(function (k) { return k.id; });
  var DISTANCES = [5, 10, 20, 40];          // metres from the generator
  var LIFTS = [0, 5, 15];                   // minutes an hour the defenders are off while "worn"

  var defaults = {
    dist: 5, lift: 0,
    k1: 'dialogue', t1: 120, e1: false,
    k2: 'generator', t2: 240, e2: false,
    k3: 'wind', t3: 30, e3: false,
    k4: 'blanks', t4: 30, e4: false,
    k5: 'dialogue', t5: 180, e5: false,
    k6: 'none', t6: 60, e6: false
  };

  function withDefaults(over) {
    var p = {};
    Object.keys(defaults).forEach(function (k) { p[k] = defaults[k]; });
    Object.keys(over || {}).forEach(function (k) { p[k] = over[k]; });
    return p;
  }
  function plus(a, b) { var o = {}; [a, b].forEach(function (x) { Object.keys(x).forEach(function (k) { o[k] = x[k]; }); }); return o; }

  var EARS = { e2: true, e3: true, e4: true };
  /** Presets (SPEC.md "Presets"): only what differs from the defaults. */
  var presets = [
    { id: 'noisy', params: {} },
    { id: 'blanks', params: day.write([
      { kind: 'dialogue', len: 240, flag: false }, { kind: 'blanks', len: 30, flag: false }, { kind: 'dialogue', len: 240, flag: false }
    ]) },
    { id: 'defenders', params: EARS },
    { id: 'lifted', params: plus(EARS, { lift: 5 }) },
    { id: 'far', params: { dist: 40 } },
    { id: 'practice', params: { dist: 40, e3: true, e4: true } }
  ].map(function (x) { return { id: x.id, params: withDefaults(x.params) }; });

  /** Rule 4: the dose (in % of 8 h at 85 dB(A)) of `min` minutes at `level` dB(A). */
  function dosePct(level, min) { return 100 * (min / REF_MIN) * Math.pow(10, (level - REF_LEVEL) / 10); }
  /** Rule 4: the level (dB(A)) that gives `dose` % in `min` minutes; null for no sound energy. */
  function levelOf(dose, min) { return dose > 0 && min > 0 ? REF_LEVEL + 10 * Math.log10((dose / 100) * (REF_MIN / min)) : null; }
  /** Rule 5: LEX,8h, the day's dose as a level over the nominal 8 h; null for an empty day. */
  function lexOf(dose) { return levelOf(dose, REF_MIN); }
  /** Rule 4: minutes at `level` that make a full dose (100 %): 3 dB more halves it (exactly 10·log10 2 ≈ 3.01 dB). */
  function allowedMin(level) { return REF_MIN * Math.pow(10, (REF_LEVEL - level) / 10); }
  /** Rule 6: the generator's level at `d` m (free field: the energy falls with the square of the distance). */
  function genLevel(d) { return GEN_LEVEL - 20 * Math.log10(d / GEN_REF); }
  /** Rule 7: the share of sound energy that reaches the ear: 1 without defenders; with them, the lifted minutes count
   *  in full and the rest cut by ATT dB. */
  function earFactor(worn, lift) {
    if (!worn) return 1;
    var off = lift / 60;
    return off + (1 - off) * Math.pow(10, -ATT / 10);
  }
  /** Rule 7: the cut the defenders really give, in dB, for a lift. */
  function cutOf(lift) { return -10 * Math.log10(earFactor(true, lift)); }

  function pick(list, x, dflt) { return list.indexOf(x) >= 0 ? x : dflt; }

  /** Rules 4–8 for one block of the day. */
  function block(b, dist, lift) {
    var kind = KINDS[KIND_IDS.indexOf(b.kind)];
    var base = b.kind === 'generator' ? genLevel(dist) : kind.level;
    var f = earFactor(b.flag, lift);
    var bg = dosePct(base, b.len);
    var shots = 0, shotsDose = 0, shotsEar = 0;
    if (b.kind === 'blanks') {
      shots = SHOTS * (b.len / TAKE);
      shotsDose = shots * dosePct(SEL, 1 / 60);
      shotsEar = b.flag ? shotsDose * Math.pow(10, -ATT / 10) : shotsDose;   // rule 8: announced, so on for every shot
    }
    var dose = bg + shotsDose, doseEar = bg * f + shotsEar;
    var levelEar = levelOf(doseEar, b.len);
    return {
      i: b.i, kind: b.kind, len: b.len, ear: b.flag, start: b.start, end: b.end,
      base: base, level: levelOf(dose, b.len), levelEar: levelEar, allowed: allowedMin(levelEar),
      dose: dose, doseEar: doseEar, shots: shots, shotsDose: shotsDose, shotsEar: shotsEar
    };
  }

  /** Rule 9: the action band of LEX,8h without defenders. Over 80 is 'lower' (80 itself is not); 85 and over 'upper'. */
  function actionBand(lex) { return lex == null ? 'below' : lex >= UPPER ? 'upper' : lex > LOWER ? 'lower' : 'below'; }
  /** Rule 9: the limit at the ear: 'over' only above 87 (87 itself is not over). */
  function limitBand(lex) { return lex != null && lex > LIMIT ? 'over' : 'under'; }

  /** Rule 10: the cumulative dose through the day, [{ m, u, e }] (minutes from the call; % without and at the ear).
   *  A blank-firing block rises with its background and jumps by each take's shots in the take's middle. */
  function curve(bs) {
    var pts = [{ m: 0, u: 0, e: 0 }], u = 0, e = 0;
    bs.forEach(function (b) {
      if (b.kind !== 'blanks') {
        u += b.dose; e += b.doseEar;
        pts.push({ m: b.end, u: u, e: e });
        return;
      }
      var takes = b.len / TAKE, bgU = (b.dose - b.shotsDose) / takes, bgE = (b.doseEar - b.shotsEar) / takes;
      for (var j = 0; j < takes; j++) {
        var t0 = b.start + j * TAKE;
        u += bgU / 2; e += bgE / 2;
        pts.push({ m: t0 + TAKE / 2, u: u, e: e });
        u += b.shotsDose / takes; e += b.shotsEar / takes;
        pts.push({ m: t0 + TAKE / 2, u: u, e: e });
        u += bgU / 2; e += bgE / 2;
        pts.push({ m: t0 + TAKE, u: u, e: e });
      }
    });
    return pts;
  }

  /** The whole state from the params. */
  function derive(p) {
    var dist = pick(DISTANCES, p.dist, defaults.dist), lift = pick(LIFTS, p.lift, defaults.lift);
    var bs = day.blocks(p, KIND_IDS).map(function (b) { return block(b, dist, lift); });
    var dose = 0, doseEar = 0;
    bs.forEach(function (b) { dose += b.dose; doseEar += b.doseEar; });
    var top = -1;   // rule 11: the block with the most dose at the ear; the earliest of equals
    bs.forEach(function (b, i) { if (b.doseEar > 0 && (top < 0 || b.doseEar > bs[top].doseEar)) top = i; });
    var lex = lexOf(dose), lexEar = lexOf(doseEar);
    return {
      blocks: bs, len: bs.length ? bs[bs.length - 1].end : 0, dist: dist, lift: lift, genLevel: genLevel(dist),
      dose: dose, doseEar: doseEar, lex: lex, lexEar: lexEar,
      action: actionBand(lex), limit: limitBand(lexEar), top: top, curve: curve(bs),
      full: bs.length >= day.SLOTS
    };
  }

  var logic = {
    day: day, REF_LEVEL: REF_LEVEL, REF_MIN: REF_MIN, LOWER: LOWER, UPPER: UPPER, LIMIT: LIMIT, ATT: ATT, TAKE: TAKE,
    SHOTS: SHOTS, SEL: SEL, GEN_LEVEL: GEN_LEVEL, GEN_REF: GEN_REF, KINDS: KINDS, KIND_IDS: KIND_IDS,
    DISTANCES: DISTANCES, LIFTS: LIFTS,
    defaults: defaults, presets: presets, withDefaults: withDefaults,
    initial: derive, derive: derive,
    dosePct: dosePct, levelOf: levelOf, lexOf: lexOf, allowedMin: allowedMin, genLevel: genLevel,
    earFactor: earFactor, cutOf: cutOf, actionBand: actionBand, limitBand: limitBand, curve: curve,
    add: function (p, kind) { return day.add(p, KIND_IDS, kind); },
    remove: function (p, i) { return day.remove(p, KIND_IDS, i); },
    bump: function (p, i, dir) { return day.bump(p, KIND_IDS, i, dir); },
    toggleEar: function (p, i) { return day.flag(p, KIND_IDS, i); }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
