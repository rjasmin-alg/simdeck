/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-powershell-objects: the same task in two pipelines, bash (lines of text) and PowerShell (objects).
   Rules and numbers: SPEC.md. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it.

   Both lanes are computed from one fixed directory listing. Step n (1..S) runs stage n of each lane that has one;
   the last step (S + 1) is the terminal: bash prints its lines as they are, PowerShell formats its objects
   (the implicit Out-Default). S is the longer lane's number of stages. */
(function (root) {
  'use strict';

  var MIB = 1048576;
  /** ls -l's "total" counts allocated 1 KiB units; the model assumes 4 KiB blocks and no sparse files (SPEC.md). */
  var BLOCK = 4096;

  /** The directory, in name order. Sizes: 3 files over 1 MiB, one just over (1048577), two equal (4096). */
  var FILES = [
    { name: 'arhiva.zip', size: 7340032, mtime: '2026-10-28T16:02' },
    { name: 'bilješke.txt', size: 980, mtime: '2026-11-04T08:30' },
    { name: 'predavanje.mp4', size: 1048577, mtime: '2026-11-03T09:10' },
    { name: 'prezentacija.pptx', size: 3145728, mtime: '2026-11-03T09:05' },
    { name: 'raspored.csv', size: 4096, mtime: '2026-11-03T10:15' },
    { name: 'tablica.csv', size: 4096, mtime: '2026-11-03T10:15' }
  ];
  /** Added by the nameWithSpace param: 2.4 MiB, so the big-files filter keeps it. */
  var SPACE_FILE = { name: 'godišnji izvještaj.pdf', size: 2516582, mtime: '2026-11-02T12:00' };

  var TASKS = ['big-files', 'by-size', 'by-extension'];

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function padL(s, w) { s = String(s); while (s.length < w) s = ' ' + s; return s; }
  function padR(s, w) { s = String(s); while (s.length < w) s += ' '; return s; }
  /** Plain character order (what both directory listings use for these names). */
  function cmpText(a, b) { return a < b ? -1 : a > b ? 1 : 0; }

  /** The listing both lanes read: the six files, plus the one with a space when the param is on, in name order. */
  function listing(p) {
    var files = FILES.slice();
    if (p && p.nameWithSpace) files.push(SPACE_FILE);
    return clone(files).sort(function (a, b) { return cmpText(a.name, b.name); });
  }

  // ── text: what bash programs see ──

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function parts(mtime) {
    var m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)$/.exec(mtime);
    return { y: Number(m[1]), mo: Number(m[2]), d: Number(m[3]), h: Number(m[4]), mi: m[5] };
  }
  /** ls -l's date column for a recent file: "Nov  3 10:15". */
  function lsDate(mtime) {
    var t = parts(mtime);
    return MONTHS[t.mo - 1] + ' ' + padL(t.d, 2) + ' ' + padL(t.h, 2).replace(' ', '0') + ':' + t.mi;
  }

  /** `ls -l`: a "total" line, then one line per file; the size column is right-aligned to the widest size. */
  function lsLong(files) {
    var w = 0;
    var total = 0;
    files.forEach(function (f) { w = Math.max(w, String(f.size).length); total += Math.ceil(f.size / BLOCK) * (BLOCK / 1024); });
    return {
      out: ['total ' + total].concat(files.map(function (f) {
        return '-rw-r--r-- 1 ana ana ' + padL(f.size, w) + ' ' + lsDate(f.mtime) + ' ' + f.name;
      })),
      src: [null].concat(files.map(function (f, i) { return i; }))
    };
  }

  /** `ls` into a pipe: one name per line, no quoting (the output is not a terminal). */
  function lsPlain(files) {
    return { out: files.map(function (f) { return f.name; }), src: files.map(function (f, i) { return i; }) };
  }

  /** awk's default field splitting: runs of blanks separate fields; leading blanks are skipped (rule 3).
      Returns [{ text, start, end }] with character offsets into the line. */
  function fields(line) {
    var out = [];
    var re = /[^ \t]+/g;
    var m;
    while ((m = re.exec(line))) out.push({ text: m[0], start: m.index, end: m.index + m[0].length });
    return out;
  }
  function field(line, n) { var f = fields(line)[n - 1]; return f ? f.text : ''; }
  function looksNumeric(s) { return /^[ \t]*[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?[ \t]*$/.test(s); }

  /** awk '$5 > 1048576 {print $9}': a field that looks like a number compares as a number, else as text. */
  function awkBigFiles(input) {
    var out = [], src = [], shifted = [];
    input.out.forEach(function (line, i) {
      var f5 = field(line, 5);
      var keep = looksNumeric(f5) ? Number(f5) > MIB : cmpText(f5, String(MIB)) > 0;
      if (!keep) return;
      out.push(field(line, 9));
      src.push(input.src[i]);
      if (fields(line).length !== 9) shifted.push({ src: input.src[i], nf: fields(line).length });
    });
    return { out: out, src: src, issue: shifted.length ? { code: 'field-shift', items: shifted } : null };
  }

  /** awk -F. '{print $NF}': split at every dot, print the last field. */
  function awkLastDotField(input) {
    return {
      out: input.out.map(function (l) { var f = l.split('.'); return f[f.length - 1]; }),
      src: input.src.slice()
    };
  }

  /** The key of `sort -k5`: from field 5 to the end of the line, leading blanks skipped (the blanks that right-align
      ls's column do not count in the course's UTF-8 locale; SPEC.md, rule 5). Empty when there is no field 5. */
  function sortKey5(line) { var f = fields(line)[4]; return f ? line.slice(f.start) : ''; }
  function leadingNumber(s) { var m = /^\s*([+-]?\d+(\.\d+)?)/.exec(s); return m ? Number(m[1]) : 0; }

  /** sort: every input line is read before the first is written (rule 7). Keys compare as text, or as numbers with
      -n; equal keys fall back to the whole line (the last-resort comparison), so equal sizes order by name. */
  function sortLines(input, opts) {
    var idx = input.out.map(function (l, i) { return i; });
    idx.sort(function (a, b) {
      var la = input.out[a], lb = input.out[b];
      var c = 0;
      if (opts.k === 5) {
        var ka = sortKey5(la), kb = sortKey5(lb);
        c = opts.n ? leadingNumber(ka) - leadingNumber(kb) : cmpText(ka, kb);
      }
      return c || cmpText(la, lb) || a - b;
    });
    return { out: idx.map(function (i) { return input.out[i]; }), src: idx.map(function (i) { return input.src[i]; }) };
  }

  /** uniq -c: one line per run of equal adjacent lines, the count right-aligned in 7 columns. */
  function uniqCount(input) {
    var out = [];
    var src = [];
    input.out.forEach(function (l, i) {
      var last = out.length ? out[out.length - 1] : null;
      if (last && last.text === l) { last.n++; src[src.length - 1].push(input.src[i]); }
      else { out.push({ text: l, n: 1 }); src.push([input.src[i]]); }
    });
    return { out: out.map(function (r) { return padL(r.n, 7) + ' ' + r.text; }), src: src };
  }

  // ── objects: what PowerShell cmdlets see ──

  /** A PowerShell numeric literal with a multiplier suffix: 1KB = 1024, 1MB = 1048576, 1GB = 1073741824 (rule 4). */
  function psNumber(text) {
    var m = /^(\d+(?:\.\d+)?)(KB|MB|GB|TB|PB)?$/i.exec(text);
    if (!m) return NaN;
    var k = { KB: 1, MB: 2, GB: 3, TB: 4, PB: 5 }[(m[2] || '').toUpperCase()] || 0;
    return Number(m[1]) * Math.pow(1024, k);
  }

  function extOf(name) { var i = name.lastIndexOf('.'); return i > 0 ? name.slice(i) : ''; }
  /** LastWriteTime as the default (en-US) view shows a DateTime: "11/3/2026 10:15 AM". */
  function psDate(mtime) {
    var t = parts(mtime);
    var h12 = t.h % 12 === 0 ? 12 : t.h % 12;
    return t.mo + '/' + t.d + '/' + t.y + ' ' + h12 + ':' + t.mi + ' ' + (t.h < 12 ? 'AM' : 'PM');
  }

  /** Get-ChildItem: one FileInfo object per file; Length is a number, Name a string, a space is just a character. */
  function getChildItem(files) {
    return {
      out: files.map(function (f, i) {
        return { type: 'FileInfo', props: { Name: f.name, Length: f.size, LastWriteTime: psDate(f.mtime), Extension: extOf(f.name) }, src: i };
      })
    };
  }

  function hasProp(o, k) { return Object.prototype.hasOwnProperty.call(o.props, k); }

  /** Where-Object Length -gt 1MB: reads the property of each object; an object without it does not pass. */
  function whereGt(input, prop, literal) {
    var limit = psNumber(literal);
    return { out: input.out.filter(function (o) { return hasProp(o, prop) && o.props[prop] > limit; }).map(clone) };
  }

  /** Select-Object Name: a new object per input object, with only the named property. */
  function selectProps(input, names) {
    return {
      out: input.out.map(function (o) {
        var props = {};
        names.forEach(function (k) { props[k] = hasProp(o, k) ? o.props[k] : null; });
        return { type: 'PSCustomObject', props: props, src: o.src };
      })
    };
  }

  /** Sort-Object Length: reads every object first (rule 7), compares the property's values (numbers as numbers);
      objects without it have no key, and equal keys keep their input order (stable), so equal sizes stay in name
      order. */
  function sortObjects(input, prop) {
    var missing = input.out.filter(function (o) { return !hasProp(o, prop); }).length;
    var idx = input.out.map(function (o, i) { return i; });
    idx.sort(function (a, b) {
      var oa = input.out[a], ob = input.out[b];
      var ka = hasProp(oa, prop) ? oa.props[prop] : null, kb = hasProp(ob, prop) ? ob.props[prop] : null;
      if (ka === null || kb === null) return (ka === null ? 0 : 1) - (kb === null ? 0 : 1) || a - b;
      return (ka < kb ? -1 : ka > kb ? 1 : 0) || a - b;
    });
    return {
      out: idx.map(function (i) { return clone(input.out[i]); }),
      issue: missing ? { code: 'no-property', prop: prop, count: missing } : null
    };
  }

  /** A table as the console shows it: a header, dashes under each header, rows; numbers right-aligned. */
  function table(cols, rows) {
    var w = cols.map(function (c) {
      return rows.reduce(function (m, r) { return Math.max(m, String(r[c.key]).length); }, c.key.length);
    });
    function line(cells) {
      return cells.map(function (s, i) { return cols[i].right ? padL(s, w[i]) : (i === cols.length - 1 ? s : padR(s, w[i])); }).join(' ').replace(/\s+$/, '');
    }
    return {
      head: [line(cols.map(function (c) { return c.key; })),
        line(cols.map(function (c, i) { var d = ''; while (d.length < c.key.length) d += '-'; return cols[i].right ? padL(d, w[i]) : d; }))],
      rows: rows.map(function (r) { return line(cols.map(function (c) { return String(r[c.key]); })); })
    };
  }

  var DIR_PS = 'C:\\Users\\ana\\Dokumenti';
  var FILE_COLS = [{ key: 'Mode' }, { key: 'LastWriteTime' }, { key: 'Length', right: true }, { key: 'Name' }];
  function fileRow(o) { return { Mode: '-a---', LastWriteTime: o.props.LastWriteTime, Length: o.props.Length, Name: o.props.Name }; }

  /** Format-Table: turns the objects into formatting records (a start, a group start, one entry per row, a group end,
      an end). They carry the table's text, not the objects' properties (rule 6). */
  function formatTable(input) {
    var objs = input.out;
    var tb = table(FILE_COLS, objs.map(fileRow));
    return {
      out: [{ type: 'FormatStartData', props: {}, src: null, text: [] },
        { type: 'GroupStartData', props: {}, src: null, text: ['Directory: ' + DIR_PS, ''].concat(tb.head) }]
        .concat(objs.map(function (o, i) { return { type: 'FormatEntryData', props: {}, src: o.src, text: [tb.rows[i]], row: o.props.Name }; }))
        .concat([{ type: 'GroupEndData', props: {}, src: null, text: [] }, { type: 'FormatEndData', props: {}, src: null, text: [] }])
    };
  }

  /** Group-Object Extension: reads every object first (rule 7); one GroupInfo per value, in order of first
      appearance, with its Count and the group's objects. */
  function groupObjects(input, prop) {
    var groups = [];
    var at = {};
    input.out.forEach(function (o) {
      var k = hasProp(o, prop) ? String(o.props[prop]) : '';
      if (!(k in at)) { at[k] = groups.length; groups.push({ type: 'GroupInfo', props: { Count: 0, Name: k, Group: [] }, src: null, members: [] }); }
      var g = groups[at[k]];
      g.props.Count++;
      g.props.Group.push(o.props.Name);
      g.members.push(o.src);
    });
    return { out: groups };
  }

  /** The implicit Out-Default at the end of a PowerShell line: formatting records print as they are; other objects
      get the default view of their type, a table. */
  function outDefault(objs) {
    if (!objs.length) return [];
    if (/^(FormatStartData|GroupStartData|FormatEntryData|GroupEndData|FormatEndData)$/.test(objs[0].type)) {
      return objs.reduce(function (acc, o) { return acc.concat(o.text || []); }, []);
    }
    var tb;
    if (objs[0].type === 'FileInfo') {
      tb = table(FILE_COLS, objs.map(fileRow));
      return ['Directory: ' + DIR_PS, ''].concat(tb.head, tb.rows);
    }
    if (objs[0].type === 'GroupInfo') {
      tb = table([{ key: 'Count', right: true }, { key: 'Name' }, { key: 'Group' }], objs.map(function (o) {
        return { Count: o.props.Count, Name: o.props.Name, Group: '{' + o.props.Group.join(', ') + '}' };
      }));
      return tb.head.concat(tb.rows);
    }
    var keys = Object.keys(objs[0].props);
    tb = table(keys.map(function (k) { return { key: k, right: typeof objs[0].props[k] === 'number' }; }), objs.map(function (o) { return o.props; }));
    return tb.head.concat(tb.rows);
  }

  // ── the two pipelines of each task ──

  /** The stages of both lanes for the params: [{ cmd, kind, collects }]. */
  function plan(p) {
    var task = TASKS.indexOf(p.task) >= 0 ? p.task : 'big-files';
    if (task === 'by-size') {
      return {
        bash: [{ cmd: 'ls -l', kind: 'ls-l' }, { cmd: p.numeric ? 'sort -k5 -n' : 'sort -k5', kind: p.numeric ? 'sort-k5n' : 'sort-k5', collects: true }],
        ps: p.formatEarly
          ? [{ cmd: 'Get-ChildItem', kind: 'gci' }, { cmd: 'Format-Table', kind: 'format-table' }, { cmd: 'Sort-Object Length', kind: 'sort-object', collects: true }]
          : [{ cmd: 'Get-ChildItem', kind: 'gci' }, { cmd: 'Sort-Object Length', kind: 'sort-object', collects: true }, { cmd: 'Format-Table', kind: 'format-table' }]
      };
    }
    if (task === 'by-extension') {
      return {
        bash: [{ cmd: 'ls', kind: 'ls' }, { cmd: "awk -F. '{print $NF}'", kind: 'awk-ext' }, { cmd: 'sort', kind: 'sort', collects: true }, { cmd: 'uniq -c', kind: 'uniq-c' }],
        ps: [{ cmd: 'Get-ChildItem', kind: 'gci' }, { cmd: 'Group-Object Extension', kind: 'group-object', collects: true }]
      };
    }
    return {
      bash: [{ cmd: 'ls -l', kind: 'ls-l' }, { cmd: "awk '$5 > 1048576 {print $9}'", kind: 'awk-filter' }],
      ps: [{ cmd: 'Get-ChildItem', kind: 'gci' }, { cmd: 'Where-Object Length -gt 1MB', kind: 'where' }, { cmd: 'Select-Object Name', kind: 'select' }]
    };
  }

  /** Run one stage on its input (null for the first stage, which reads the directory). */
  function run(kind, input, files) {
    switch (kind) {
      case 'ls-l': return lsLong(files);
      case 'ls': return lsPlain(files);
      case 'awk-filter': return awkBigFiles(input);
      case 'awk-ext': return awkLastDotField(input);
      case 'sort-k5': return sortLines(input, { k: 5, n: false });
      case 'sort-k5n': return sortLines(input, { k: 5, n: true });
      case 'sort': return sortLines(input, {});
      case 'uniq-c': return uniqCount(input);
      case 'gci': return getChildItem(files);
      case 'where': return whereGt(input, 'Length', '1MB');
      case 'select': return selectProps(input, ['Name']);
      case 'sort-object': return sortObjects(input, 'Length');
      case 'format-table': return formatTable(input);
      case 'group-object': return groupObjects(input, 'Extension');
    }
    throw new Error('unknown stage ' + kind);
  }

  /** A sort is "wrong" when its file lines are not in size order (ties by name): the first pair to say so. */
  function textOrderIssue(res, files) {
    var order = res.src.filter(function (s) { return s !== null; });
    var smallest = order.slice().sort(function (a, b) { return files[a].size - files[b].size || a - b; })[0];
    if (files[order[0]].size > files[smallest].size) return { code: 'text-order', a: order[0], b: smallest };
    for (var i = 1; i < order.length; i++) {
      if (files[order[i - 1]].size > files[order[i]].size) return { code: 'text-order', a: order[i - 1], b: order[i] };
    }
    return null;
  }

  /** What the task's answer is, straight from the data, and what each lane's terminal amounts to. */
  function answer(task, files, lane, objs) {
    if (task === 'by-size') {
      if (lane === 'bash') return objs.filter(function (s) { return s !== null; });
      return objs.map(function (o) { return o.src; }).filter(function (s) { return s !== null; });
    }
    if (task === 'by-extension') {
      var m = {};
      if (lane === 'bash') objs.forEach(function (l) { var r = /^\s*(\d+) (.*)$/.exec(l); m[r[2]] = Number(r[1]); });
      else objs.forEach(function (o) { m[o.props.Name.replace(/^\./, '')] = o.props.Count; });
      return Object.keys(m).sort().map(function (k) { return k + '=' + m[k]; });
    }
    if (lane === 'bash') return objs.slice();
    return objs.map(function (o) { return o.props.Name; });
  }
  function truth(task, files) {
    if (task === 'by-size') {
      return files.map(function (f, i) { return i; }).sort(function (a, b) { return files[a].size - files[b].size || cmpText(files[a].name, files[b].name); });
    }
    if (task === 'by-extension') {
      var m = {};
      files.forEach(function (f) { var e = extOf(f.name).replace(/^\./, ''); m[e] = (m[e] || 0) + 1; });
      return Object.keys(m).sort().map(function (k) { return k + '=' + m[k]; });
    }
    return files.filter(function (f) { return f.size > MIB; }).map(function (f) { return f.name; });
  }

  /** Every stage of both lanes, run to the end, and the terminals. Memoised on the params that shape it. */
  var memo = {};
  function lanes(p) {
    var task = TASKS.indexOf(p.task) >= 0 ? p.task : 'big-files';
    var key = [task, p.nameWithSpace ? 1 : 0, p.formatEarly ? 1 : 0, p.numeric ? 1 : 0].join('|');
    if (memo[key]) return memo[key];
    var files = listing(p);
    var pl = plan(Object.assign({}, p, { task: task }));
    var out = { task: task, data: files };
    ['bash', 'ps'].forEach(function (lane) {
      var prev = null;
      out[lane] = {
        stages: pl[lane].map(function (st, i) {
          var res = run(st.kind, prev, files);
          var issue = res.issue || null;
          if (st.kind === 'sort-k5' || st.kind === 'sort-k5n') issue = textOrderIssue(res, files);
          prev = res;
          var s = { cmd: st.cmd, kind: st.kind, proc: lane === 'bash' ? i : 0, collects: !!st.collects, out: res.out, issue: issue };
          if (res.src) s.src = res.src;
          return s;
        })
      };
      var last = pl[lane].length ? prev : { out: [] };
      out[lane].terminal = lane === 'bash' ? last.out.slice() : outDefault(last.out);
      var got = answer(task, files, lane, lane === 'bash' ? (task === 'by-size' ? last.src : last.out) : last.out);
      out[lane].correct = JSON.stringify(got) === JSON.stringify(truth(task, files));
    });
    out.stageCount = Math.max(out.bash.stages.length, out.ps.stages.length);
    memo[key] = out;
    return out;
  }

  /** The state after step n: stages 1..n have run (their output is in their pipe), the terminal at the last step. */
  function stateAt(p, n) {
    var L = lanes(p);
    var S = L.stageCount;
    n = Math.max(0, Math.min(n, S + 1));
    var s = { task: L.task, data: clone(L.data), at: n, terminal: n === S + 1, broken: null };
    ['bash', 'ps'].forEach(function (lane) {
      s[lane] = {
        stages: L[lane].stages.map(function (st, i) {
          var ran = i < n;
          var c = { cmd: st.cmd, kind: st.kind, proc: st.proc, collects: st.collects, ran: ran, now: ran && i === n - 1,
            out: ran ? clone(st.out) : null, issue: ran ? clone(st.issue) : null };
          if (st.src) c.src = ran ? clone(st.src) : null;
          return c;
        }),
        terminal: n === S + 1 ? L[lane].terminal.slice() : null,
        correct: n === S + 1 ? L[lane].correct : null
      };
    });
    // the first stage, by position, whose output is wrong for the task (bash first at the same position)
    for (var i = 0; i < S && i < n && !s.broken; i++) {
      ['bash', 'ps'].forEach(function (lane) {
        var st = s[lane].stages[i];
        if (!s.broken && st && st.issue) s.broken = { lane: lane, stage: i, why: st.issue.code };
      });
    }
    return s;
  }

  var logic = {
    /** Parameter defaults (task file: task big-files, nameWithSpace off, formatEarly off; numeric added, off). */
    defaults: { task: 'big-files', nameWithSpace: false, formatEarly: false, numeric: false },

    /** One step per stage of the longer lane, plus the terminal. */
    steps: function (p) { return lanes(p).stageCount + 1; },

    initial: function (p) { return stateAt(p, 0); },
    step: function (s, n, p) { return stateAt(p, n); },

    // pure helpers, for the page and the tests
    MIB: MIB, FILES: FILES, SPACE_FILE: SPACE_FILE, TASKS: TASKS, DIR_PS: DIR_PS,
    listing: listing, lsLong: lsLong, lsPlain: lsPlain, fields: fields, field: field, sortKey5: sortKey5,
    awkBigFiles: awkBigFiles, sortLines: sortLines, uniqCount: uniqCount, awkLastDotField: awkLastDotField,
    psNumber: psNumber, getChildItem: getChildItem, whereGt: whereGt, selectProps: selectProps, sortObjects: sortObjects,
    formatTable: formatTable, groupObjects: groupObjects, outDefault: outDefault,
    plan: plan, lanes: lanes, truth: truth, stateAt: stateAt
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
