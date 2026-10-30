/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for sql-injection: a login form, the query the application builds from it, and a tiny users table.
   Concatenation glues the input into the SQL text, so a quote in the input can end the string literal and the rest
   is read as code; a parameterized query sends a fixed template and the values separately, so the input is one value
   whatever it holds. The "database" is a tokenizer and a small evaluator (SELECT, DELETE, DROP TABLE; WHERE with =,
   <>, AND, OR, NOT, parentheses; -- comments; ; between statements), not a real SQL engine.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Rules and numbers: SPEC.md. */
(function (root) {
  'use strict';

  /** The users table in primary-key order. Passwords are stored in plain text only to keep the toy small (SPEC.md). */
  var USERS = [
    { id: 1, name: 'admin', pass: 'Vr4ta!9' },
    { id: 2, name: 'ana', pass: 'tajna' },
    { id: 3, name: 'marko', pass: 'ljeto26' }
  ];
  var COLUMNS = ['id', 'name', 'pass'];
  var TABLE = 'users';

  /** The payloads the payload param puts in the username field (rules 1–3, preset stacked). */
  var PAYLOADS = {
    'or-true': "' OR '1'='1",
    'admin-comment': "admin'--",
    stacked: "'; DROP TABLE users;--"
  };

  var KEYWORDS = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'DROP', 'TABLE', 'DELETE', 'INSERT', 'INTO', 'VALUES',
    'UPDATE', 'SET', 'UNION', 'ALL', 'ORDER', 'BY', 'LIMIT', 'NULL', 'LIKE', 'IS', 'IN', 'AS'];
  /** Roles the database reads as code. string, number and param are values; space is nothing. */
  var CODE_ROLES = ['keyword', 'ident', 'op', 'quote', 'comment', 'other'];

  // ── building the query ──

  /** The application's code for each mode: literal SQL text and the places the fields go (rules 1 and 4). */
  var TEMPLATES = {
    concat: [{ code: "SELECT * FROM users WHERE name='" }, { field: 'user' }, { code: "' AND pass='" }, { field: 'pass' }, { code: "'" }],
    param: [{ code: 'SELECT * FROM users WHERE name = ? AND pass = ?' }]
  };

  /** The text the database receives and the origin of each character: 'code' from the template, 'data' from input.
      In param mode the text is the template alone; the values travel beside it. */
  function build(mode, inputs) {
    var text = '', origin = [];
    TEMPLATES[mode].forEach(function (part) {
      var s = part.code !== undefined ? part.code : String(inputs[part.field]);
      var o = part.code !== undefined ? 'code' : 'data';
      text += s;
      for (var i = 0; i < s.length; i++) origin.push(o);
    });
    return { text: text, origin: origin, values: mode === 'param' ? [String(inputs.user), String(inputs.pass)] : null };
  }

  // ── tokenizer ──

  function isSpace(c) { return c === ' ' || c === '\t' || c === '\n' || c === '\r'; }
  function isDigit(c) { return c >= '0' && c <= '9'; }
  function isWordStart(c) { return /[A-Za-z_]/.test(c); }
  function isWord(c) { return /[A-Za-z0-9_]/.test(c); }

  /** Lexemes of an SQL text: { role, start, end, value }. A string literal is three lexemes (quote, content, quote);
      a doubled '' inside it is one quote character of the content, as SQL writes it. An unterminated literal ends
      the text with unterminated: true. -- starts a comment to the end of the line. */
  function lex(text) {
    var out = [], i = 0, n = text.length;
    function push(role, start, end, extra) { out.push(Object.assign({ role: role, start: start, end: end }, extra || {})); }
    while (i < n) {
      var c = text[i], j = i;
      if (isSpace(c)) {
        while (j < n && isSpace(text[j])) j++;
        push('space', i, j);
      } else if (c === '-' && text[i + 1] === '-') {
        while (j < n && text[j] !== '\n') j++;
        push('comment', i, j);
      } else if (c === "'") {
        push('quote', i, i + 1);
        j = i + 1;
        var value = '';
        while (j < n) {
          if (text[j] === "'" && text[j + 1] === "'") { value += "'"; j += 2; continue; }
          if (text[j] === "'") break;
          value += text[j]; j++;
        }
        if (j > i + 1) push('string', i + 1, j, { value: value });
        if (j < n) { push('quote', j, j + 1); j++; } else { out[out.length - 1].unterminated = true; }
      } else if (isDigit(c)) {
        while (j < n && isDigit(text[j])) j++;
        push('number', i, j, { value: Number(text.slice(i, j)) });
      } else if (isWordStart(c)) {
        while (j < n && isWord(text[j])) j++;
        var w = text.slice(i, j);
        push(KEYWORDS.indexOf(w.toUpperCase()) >= 0 ? 'keyword' : 'ident', i, j, { value: w });
      } else if ((c === '<' && text[i + 1] === '>') || (c === '!' && text[i + 1] === '=')) {
        j = i + 2;
        push('op', i, j, { value: '<>' });
      } else if ('=*;(),'.indexOf(c) >= 0) {
        j = i + 1;
        push('op', i, j, { value: c });
      } else if (c === '?') {
        j = i + 1;
        push('param', i, j);
      } else {
        j = i + 1;
        push('other', i, j, { value: c });
      }
      i = j;
    }
    return out;
  }

  /** Display tokens: lexemes split where the origin changes, so each token is all code or all data. */
  function tokensOf(text, origin, lexemes) {
    var out = [];
    lexemes.forEach(function (l) {
      var s = l.start;
      for (var k = l.start + 1; k <= l.end; k++) {
        if (k === l.end || origin[k] !== origin[s]) {
          out.push({ text: text.slice(s, k), origin: origin[s], role: l.role });
          s = k;
        }
      }
    });
    return out;
  }

  /** True when any character from the input is read as code: a keyword, name, operator, quote or comment (rule 1). */
  function injectedOf(tokens) {
    return tokens.some(function (t) { return t.origin === 'data' && CODE_ROLES.indexOf(t.role) >= 0; });
  }

  // ── parser: statements separated by ; ──

  function SyntaxErr(code) { this.code = code; }

  /** Statements of a lexeme list: { kind: 'select' | 'delete' | 'drop', table, where }. An empty statement (;;) is
      skipped. A ? placeholder is valid only when values travel beside the text (params). Throws SyntaxErr on
      anything outside the subset. */
  function parse(lexemes, params) {
    var toks = lexemes.filter(function (l) { return l.role !== 'space' && l.role !== 'comment'; });
    if (toks.some(function (l) { return l.unterminated; })) throw new SyntaxErr('syntax');
    var pos = 0, nParam = 0;
    function peek() { return toks[pos]; }
    function isKw(l, w) { return l && l.role === 'keyword' && l.value.toUpperCase() === w; }
    function isOp(l, v) { return l && l.role === 'op' && l.value === v; }
    function kw(w) { if (!isKw(peek(), w)) throw new SyntaxErr('syntax'); pos++; }
    function op(v) { if (!isOp(peek(), v)) throw new SyntaxErr('syntax'); pos++; }
    function tableName() {
      var l = peek();
      if (!l || l.role !== 'ident') throw new SyntaxErr('syntax');
      pos++;
      return l.value.toLowerCase();
    }
    function operand() {
      var l = peek();
      if (!l) throw new SyntaxErr('syntax');
      if (l.role === 'quote') {
        pos++;
        var v = '';
        if (peek() && peek().role === 'string') { v = peek().value; pos++; }
        if (!peek() || peek().role !== 'quote') throw new SyntaxErr('syntax');
        pos++;
        return { lit: v };
      }
      if (l.role === 'number') { pos++; return { lit: l.value }; }
      if (l.role === 'ident') { pos++; return { col: l.value.toLowerCase() }; }
      if (l.role === 'param' && params) { pos++; return { param: nParam++ }; }
      throw new SyntaxErr('syntax');
    }
    function primary() {
      if (isKw(peek(), 'NOT')) { pos++; return { not: primary() }; }
      if (isOp(peek(), '(')) { pos++; var e = orExpr(); op(')'); return e; }
      var a = operand();
      var o = peek();
      if (!isOp(o, '=') && !isOp(o, '<>')) throw new SyntaxErr('syntax');
      pos++;
      return { cmp: o.value, a: a, b: operand() };
    }
    function andExpr() {
      var e = primary();
      while (isKw(peek(), 'AND')) { pos++; e = { and: [e, primary()] }; }
      return e;
    }
    function orExpr() {
      var e = andExpr();
      while (isKw(peek(), 'OR')) { pos++; e = { or: [e, andExpr()] }; }
      return e;
    }
    function where() {
      if (!isKw(peek(), 'WHERE')) return null;
      pos++;
      return orExpr();
    }
    var out = [];
    while (pos < toks.length) {
      if (isOp(peek(), ';')) { pos++; continue; }
      var st;
      if (isKw(peek(), 'SELECT')) {
        pos++; op('*'); kw('FROM');
        st = { kind: 'select', table: tableName() };
        st.where = where();
      } else if (isKw(peek(), 'DELETE')) {
        pos++; kw('FROM');
        st = { kind: 'delete', table: tableName() };
        st.where = where();
      } else if (isKw(peek(), 'DROP')) {
        pos++; kw('TABLE');
        st = { kind: 'drop', table: tableName(), where: null };
      } else {
        throw new SyntaxErr('syntax');
      }
      if (pos < toks.length && !isOp(peek(), ';')) throw new SyntaxErr('syntax');
      out.push(st);
    }
    return out;
  }

  // ── evaluator ──

  /** Value of an operand for one row. Unknown columns throw. */
  function valueOf(o, row, values) {
    if (o.lit !== undefined) return o.lit;
    if (o.param !== undefined) return values[o.param];
    if (COLUMNS.indexOf(o.col) < 0) throw new SyntaxErr('column');
    return row[o.col];
  }

  /** = compares two texts as text and two numbers as numbers. A number against a text converts the text when it is
      a whole number ('1' = 1 and id = '01' are true, as PostgreSQL and MySQL coerce); any other text is unequal. */
  function equal(a, b) {
    if (typeof a === 'number' && typeof b === 'string') return /^\s*\d+\s*$/.test(b) && a === Number(b);
    if (typeof a === 'string' && typeof b === 'number') return equal(b, a);
    return a === b;
  }

  /** The WHERE expression for one row; AND binds tighter than OR (rule 2). */
  function test(e, row, values) {
    if (!e) return true;
    if (e.not) return !test(e.not, row, values);
    if (e.and) return test(e.and[0], row, values) && test(e.and[1], row, values);
    if (e.or) return test(e.or[0], row, values) || test(e.or[1], row, values);
    var eq = equal(valueOf(e.a, row, values), valueOf(e.b, row, values));
    return e.cmp === '=' ? eq : !eq;
  }

  /** What each role may run. The application's login role only reads (rule 6); the owner may do anything. */
  var GRANTS = { login: ['select'], owner: ['select', 'delete', 'drop'] };

  /** Runs the statements in order on a copy of the table. The first error (a missing table or column, a refused
      statement) stops the rest and the application gets an error instead of rows. The application reads the first
      SELECT's rows, in primary-key order (tie-break). */
  function run(statements, role, values) {
    var rows = USERS.map(function (u) { return Object.assign({}, u); });
    var dropped = false, result = null, error = null, deleted = [];
    var report = statements.map(function (st) { return { kind: st.kind, status: 'skipped', rows: 0 }; });
    for (var i = 0; i < statements.length; i++) {
      var st = statements[i], r = report[i];
      if (st.table !== TABLE || dropped) { r.status = 'error'; error = 'table'; break; }
      if (GRANTS[role].indexOf(st.kind) < 0) { r.status = 'denied'; error = 'denied'; break; }
      try {
        if (st.kind === 'select') {
          var hit = rows.filter(function (row) { return test(st.where, row, values); })
            .sort(function (a, b) { return a.id - b.id; });
          r.rows = hit.length;
          if (!result) result = hit.map(function (row) { return row.id; });
        } else if (st.kind === 'delete') {
          var gone = rows.filter(function (row) { return test(st.where, row, values); });
          gone.forEach(function (row) { deleted.push(row.id); });
          rows = rows.filter(function (row) { return gone.indexOf(row) < 0; });
          r.rows = gone.length;
        } else {
          dropped = true;
        }
        r.status = 'ran';
      } catch (err) {
        if (!(err instanceof SyntaxErr)) throw err;
        r.status = 'error'; error = err.code; break;
      }
    }
    return { report: report, error: error, returned: error ? [] : (result || []), dropped: dropped, deleted: deleted };
  }

  // ── the whole state ──

  /** The username the form holds: a chosen payload, or the typed text. */
  function userOf(p) {
    return p.payload && p.payload !== 'none' && PAYLOADS[p.payload] !== undefined ? PAYLOADS[p.payload] : String(p.user);
  }

  /** Query, tokens and result for one mode and one pair of inputs. */
  function evaluate(mode, inputs, role) {
    var b = build(mode, inputs);
    var lexemes = lex(b.text);
    var tokens = tokensOf(b.text, b.origin, lexemes);
    var statements = null, res;
    try {
      statements = parse(lexemes, mode === 'param');
      res = run(statements, role, b.values);
    } catch (err) {
      if (!(err instanceof SyntaxErr)) throw err;
      res = { report: [], error: 'syntax', returned: [], dropped: false, deleted: [] };
    }
    return { built: b.text, values: b.values, tokens: tokens, injected: injectedOf(tokens), res: res };
  }

  /** The caption's case (rules 1–6). A missing table after a DROP that ran is the stacked case, not a broken query. */
  function noteOf(mode, ev, outcome, wouldInject) {
    var dataComment = ev.tokens.some(function (t) { return t.origin === 'data' && t.role === 'comment'; });
    if (ev.res.error === 'syntax' || ev.res.error === 'column') return 'error';
    if (ev.res.error === 'table' && ev.res.report.length < 2) return 'error';
    if (mode === 'param') return outcome === 'login' ? 'paramMatch' : wouldInject ? 'paramFixed' : 'paramNoMatch';
    if (ev.res.report.length > 1) return 'stacked';
    if (ev.injected && dataComment) return 'comment';
    if (ev.injected) return 'injected';
    return outcome === 'login' ? 'normal' : 'wrong';
  }

  var logic = {
    defaults: { mode: 'concat', user: 'ana', pass: 'tajna', payload: 'none', role: 'login' },
    MODES: ['concat', 'param'],
    ROLES: ['login', 'owner'],
    PAYLOAD_IDS: ['none', 'or-true', 'admin-comment', 'stacked'],
    PAYLOADS: PAYLOADS,
    USERS: USERS,
    COLUMNS: COLUMNS,
    TEMPLATES: TEMPLATES,
    CODE_ROLES: CODE_ROLES,

    presets: [
      { id: 'normal', params: { mode: 'concat', payload: 'none', user: 'ana', pass: 'tajna', role: 'login' } },
      { id: 'or-true', params: { mode: 'concat', payload: 'or-true', pass: "' OR '1'='1", role: 'login' } },
      { id: 'admin-comment', params: { mode: 'concat', payload: 'admin-comment', pass: '12345', role: 'login' } },
      { id: 'stacked', params: { mode: 'concat', payload: 'stacked', pass: 'tajna', role: 'login' } },
      { id: 'fixed', params: { mode: 'param', payload: 'or-true', pass: "' OR '1'='1", role: 'login' } }
    ],

    /** The whole state; an explorer has no steps. */
    initial: function (p) {
      var mode = p.mode === 'param' ? 'param' : 'concat';
      var role = p.role === 'owner' ? 'owner' : 'login';
      var inputs = { user: userOf(p), pass: String(p.pass) };
      var ev = evaluate(mode, inputs, role);
      var res = ev.res;
      var outcome = res.error ? 'error' : res.returned.length ? 'login' : 'nomatch';
      var first = outcome === 'login' ? res.returned[0] : null;
      var wouldInject = mode === 'param' ? evaluate('concat', inputs, role).injected : ev.injected;
      return {
        mode: mode,
        role: role,
        inputs: inputs,
        template: TEMPLATES[mode],
        built: ev.built,
        values: ev.values,
        tokens: ev.tokens,
        injected: ev.injected,
        statements: res.report,
        error: res.error,
        rows: USERS.map(function (u) {
          return { id: u.id, name: u.name, pass: u.pass, returned: res.returned.indexOf(u.id) >= 0, first: u.id === first,
            deleted: res.deleted.indexOf(u.id) >= 0 };
        }),
        dropped: res.dropped,
        returned: res.returned,
        outcome: outcome,
        authenticated: first === null ? null : USERS.filter(function (u) { return u.id === first; })[0].name,
        note: noteOf(mode, ev, outcome, wouldInject)
      };
    },

    /** Rule 5's counter-example: a numeric field is glued in without quotes, so doubling quotes changes nothing. */
    escapeQuotes: function (s) { return String(s).replace(/'/g, "''"); },
    numericQuery: function (input) { return 'SELECT * FROM users WHERE id=' + input; },
    /** Runs any SQL text as code (all characters 'code') with a role; for the rule-5 tests. */
    runText: function (text, role) {
      var lexemes = lex(text);
      try { return run(parse(lexemes, false), role || 'login', null); } catch (err) {
        if (!(err instanceof SyntaxErr)) throw err;
        return { report: [], error: 'syntax', returned: [], dropped: false, deleted: [] };
      }
    },

    build: build,
    lex: lex,
    tokensOf: tokensOf,
    injectedOf: injectedOf,
    userOf: userOf
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
