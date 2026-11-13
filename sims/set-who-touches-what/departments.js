/* SPDX-License-Identifier: AGPL-3.0-or-later
   Departments and what they own (catalogue §5.25, the crew model): the ten departments a learner meets on set, the
   head of each, and the kinds of equipment and work each one owns. It reads the shared crew (crew.js, the
   set-crew model) for the departments the crew already has, and adds the four it lacks (art, costume, make-up,
   locations) with a head each, whose line runs to the 1st AD like the other heads. Pure functions over plain data, no
   words and no dependencies beyond the crew, ready for the coordinator to promote next to models/set-crew.js (or into
   it, additively). In a page it registers on globalThis.SimdeckModels['set-departments']; under node it is
   module.exports. Rules: SPEC.md rules 1-2. */
(function (root) {
  'use strict';

  var crew = typeof module === 'object' && module.exports
    ? require('./crew.js')
    : root.SimdeckModels['set-crew'];

  /** Rule 1: the ten departments, in the order the page lists them (the picker, the legend, every tie-break). */
  var DEPTS = ['electric', 'grip', 'camera', 'sound', 'art', 'props', 'costume', 'makeup', 'locations', 'production'];

  /** Rule 1: heads of the departments the crew model does not have. Same shape as crew.PEOPLE; `via` is the 1st AD.
      NOTES.md "Shared requests": add them to the crew model additively. */
  var EXTRA_HEADS = [
    { id: 'artd', dept: 'art', head: true, via: 'ad1', decides: 'dressing' },
    { id: 'cos', dept: 'costume', head: true, via: 'ad1', decides: 'clothing' },
    { id: 'mu', dept: 'makeup', head: true, via: 'ad1', decides: 'face' },
    { id: 'loc', dept: 'locations', head: true, via: 'ad1', decides: 'location' }
  ];

  /** Rule 2: who owns which kind of thing (the catalogue's list, in its order). Every kind has exactly one owner. */
  var OWNS = {
    electric: ['lamp', 'power', 'cable'],
    grip: ['stand', 'flag', 'track', 'rigging', 'sandbag'],
    camera: ['camera', 'card'],
    sound: ['microphone', 'transmitter'],
    art: ['dressing'],
    props: ['prop'],
    costume: ['clothing'],
    makeup: ['face', 'hair'],
    locations: ['location', 'owner'],
    production: ['paperwork', 'transport', 'catering']
  };

  var OWNER = {};
  DEPTS.forEach(function (d) { OWNS[d].forEach(function (k) { OWNER[k] = d; }); });

  /** Rule 2: the department that owns a kind of thing; throws for a kind nobody owns (a model error, not a choice). */
  function ownerOf(kind) {
    if (!Object.prototype.hasOwnProperty.call(OWNER, kind)) throw new Error('nobody owns: ' + kind);
    return OWNER[kind];
  }

  /** Rule 1: the head of a department: the crew's head where the crew has the department, else the added head. */
  function headOf(dept) {
    var h = crew.headOf(dept);
    if (h) return h;
    for (var i = 0; i < EXTRA_HEADS.length; i++) if (EXTRA_HEADS[i].dept === dept) return EXTRA_HEADS[i].id;
    return null;
  }

  /** The department of a person of the crew (or of an added head). */
  function deptOf(id) {
    for (var i = 0; i < EXTRA_HEADS.length; i++) if (EXTRA_HEADS[i].id === id) return EXTRA_HEADS[i].dept;
    return crew.person(id).dept;
  }

  function isDept(d) { return DEPTS.indexOf(d) >= 0; }

  var model = {
    crew: crew,
    DEPTS: DEPTS,
    EXTRA_HEADS: EXTRA_HEADS,
    OWNS: OWNS,
    ownerOf: ownerOf,
    headOf: headOf,
    deptOf: deptOf,
    isDept: isDept
  };

  if (typeof module === 'object' && module.exports) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {})['set-departments'] = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
