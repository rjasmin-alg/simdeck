/* SPDX-License-Identifier: AGPL-3.0-or-later
   The polarization vector (catalogue §5.26, shared model 4): a complex unit vector for an antenna seen from a direction,
   the projection a receiving antenna takes of an arriving wave, the polarization loss factor and the ellipse.
   Pure: plain arrays, no DOM, no strings, no units. Registers as SimdeckModels['polarization'] in a page and is
   module.exports under node, so the coordinator can move it to models/ unchanged.

   Conventions (SPEC.md §2):
   - A complex number is [re, im]; a complex 3-vector is [[re, im], [re, im], [re, im]]; a real 3-vector is [x, y, z].
   - Phasors use e^{+jωt}: the real field at phase φ = ωt is Re(e·e^{jφ}).
   - An antenna's vector is the polarization of the field it would SEND towards the other antenna, written in the one
     global frame. The voltage it receives from an arriving field E is the bilinear projection l·E (no conjugate):
     Balanis §2.15, V_oc = l_e·E^i. For two antennas facing each other this is matched for the same sense of rotation
     (right-hand into right-hand); the conjugate form |ê_w·ê_a*|² of some texts writes the antenna's vector as the incoming
     wave it matches (its receive polarization, the conjugate of its transmit vector) instead. For real (linear) vectors both forms give the same number. */
(function (root) {
  'use strict';

  var EPS = 1e-12;

  /** A tiny value from rounding (cos 90° = 6e-17) becomes exactly 0, so nulls are nulls and −0 is 0. */
  function snap(x) { return Math.abs(x) < EPS ? 0 : x; }

  function dot3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function len3(a) { return Math.sqrt(dot3(a, a)); }
  function scale3(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
  function sub3(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function cross3(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

  /** A real 3-vector as a complex one (a linear polarization). */
  function linear(v) { return [[v[0], 0], [v[1], 0], [v[2], 0]]; }

  /** |e|² = Σ |e_i|². */
  function norm2(e) { var s = 0; for (var i = 0; i < 3; i++) s += e[i][0] * e[i][0] + e[i][1] * e[i][1]; return s; }

  /** e scaled to unit length; null for a zero vector. */
  function unit(e) {
    var n = Math.sqrt(norm2(e));
    if (n < EPS) return null;
    return e.map(function (c) { return [c[0] / n, c[1] / n]; });
  }

  /** The transverse part of a real direction a seen along the unit direction r: a − (a·r)·r. Its length is sin θ, θ
      the angle between a and r (Griffiths §11.1.2, Balanis §4.2: the far field of a short dipole is along θ̂, ∝ sin θ). */
  function transverse(a, r) { return sub3(a, scale3(r, dot3(a, r))).map(snap); }

  /** The far field a short dipole along the unit vector a sends in the unit direction r: amp = |a − (a·r)·r| = sin θ (its
      pattern), e = the unit polarization vector along that transverse part (in the plane of the wire and r, at right
      angles to r). Along the wire itself amp is 0 and e is null: no transverse part, no radiation. */
  function dipoleWave(a, r) {
    var t = transverse(a, r), amp = snap(len3(t));
    return { amp: amp, e: amp > 0 ? linear(scale3(t, 1 / amp)) : null };
  }

  /** The bilinear projection Σ a_i·b_i of two complex vectors, as a complex number (the received voltage per unit
      field and unit effective length when one is the wave and the other the receiving antenna's vector). */
  function projection(a, b) {
    var re = 0, im = 0;
    for (var i = 0; i < 3; i++) {
      re += a[i][0] * b[i][0] - a[i][1] * b[i][1];
      im += a[i][0] * b[i][1] + a[i][1] * b[i][0];
    }
    return [snap(re), snap(im)];
  }

  /** The polarization loss factor: |ê_w·ê_a|² of the two unit vectors, 0 … 1 (Balanis §2.12.2: cos²ψ for two linear
      polarizations at an angle ψ). null when either vector is zero. */
  function plf(w, a) {
    var uw = unit(w), ua = unit(a);
    if (!uw || !ua) return null;
    var p = projection(uw, ua);
    return snap(p[0] * p[0] + p[1] * p[1]);
  }

  /** The real field at phase φ (radians): Re(e·e^{jφ})·amp, a real 3-vector. */
  function instant(e, amp, phi) {
    var c = Math.cos(phi), s = Math.sin(phi);
    return e.map(function (q) { return snap(amp * (q[0] * c - q[1] * s)); });
  }

  /** The ellipse the tip of Re(e·e^{jωt}) traces in the plane of the real unit vectors u1, u2 (both at right angles to
      the direction of travel): tilt = the major axis' angle from u1 towards u2 in degrees, 0 ≤ tilt < 180; major and
      minor semi-axes; ratio = minor/major (0 a line, 1 a circle; the axial ratio is its inverse). */
  function ellipse(e, u1, u2) {
    var p = linear(u1), q = linear(u2);
    var x = projection(e, p), y = projection(e, q);           // components along u1 and u2 (u real: no conjugate needed)
    var xx = x[0] * x[0] + x[1] * x[1], yy = y[0] * y[0] + y[1] * y[1];
    var xy = x[0] * y[0] + x[1] * y[1];                        // Re(x·conj(y))
    var tilt = 0.5 * Math.atan2(2 * xy, xx - yy) * 180 / Math.PI;
    tilt = snap(((tilt % 180) + 180) % 180);
    if (tilt >= 180) tilt = 0;
    var mean = (xx + yy) / 2, dev = Math.sqrt(((xx - yy) / 2) * ((xx - yy) / 2) + xy * xy);
    var major = Math.sqrt(mean + dev), minor = Math.sqrt(Math.max(0, mean - dev));
    minor = snap(minor);
    return { tilt: tilt, major: major, minor: minor, ratio: major > 0 ? minor / major : 0 };
  }

  var model = {
    EPS: EPS, snap: snap, dot3: dot3, len3: len3, cross3: cross3, linear: linear, norm2: norm2, unit: unit,
    transverse: transverse, dipoleWave: dipoleWave, projection: projection, plf: plf, instant: instant, ellipse: ellipse
  };

  if (typeof module === 'object' && module.exports) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {})['polarization'] = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
