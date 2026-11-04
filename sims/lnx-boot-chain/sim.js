/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-boot-chain: booting is a chain of hand-overs. A chain is data (stages with what each needs, what it
   does and what the console shows), so a second chain (Windows, task w3/win-boot) needs no new model code. One step:
   power on, or the current stage checks its needs and either hands control to the next stage or stops the chain.
   Rules and numbers: SPEC.md. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var KVER = '6.12.0-211.16.1.el10_2.0.1.x86_64';            // UL ch13, ch16
  var ROOT_UUID = '01582c00-2b49-4e9b-86ee-75f418a4b720';     // vda4, / (UL ch11 lsblk -f)
  var WRONG_UUID = '01582c00-2b49-4e9b-86ee-75f418a4b702';    // the same with the last two digits swapped (ours)
  var VJEZBA_UUID = '77b8714b-1cf6-4d6b-bce3-57d9763fb1e6';   // /mnt/vjezba in /etc/fstab (UL ch11)

  /* Stage fields: label, sub, lives, hands are string keys; needs are need ids (the page shows need_<id>); screen and
     failText are console lines ({var} filled from the chain's vars) or { t: key } for a described screen. does: what
     the stage leaves behind when it finishes (root, pid1, time, target, facts); onFail: what a failure leaves (target,
     facts). facts: { row: [part] } for the card rows a chain lists in factRows; a part is data (a string) or { t: key },
     both {var}-filled; facts set by onFail are the bad ones (factsBad). A chain reads its break from p[breakKey]. */
  var CHAINS = {
    linux: {
      capPrefix: '',                                          // caption keys: <capPrefix>capDone_<stage id>, …capFail_<break>
      breaks: ['bootEntry', 'kernelFile', 'diskDriver', 'rootUuid', 'targetUnit'],
      targets: ['multi-user', 'graphical'],
      vars: function (p) {
        return {
          kver: KVER, host: 'demosrv1', vjezba: VJEZBA_UUID,
          uuid: p['break'] === 'rootUuid' ? WRONG_UUID : ROOT_UUID,
          target: p.target === 'graphical' ? 'graphical.target' : 'multi-user.target',
          targetDesc: p.target === 'graphical' ? 'Graphical Interface' : 'Multi-User System'
        };
      },
      stages: [
        { id: 'firmware', label: 'stFirmware', sub: null, lives: 'livesRom', hands: 'handsFirmware', needs: ['bootEntry'],
          screen: [{ t: 'scrFirmware' }],
          failText: [{ t: 'scrNoBoot' }], failState: 'firmwareHalt' },
        { id: 'loader', label: 'stLoader', sub: 'GRUB', lives: 'livesDisk', hands: 'handsLoader', needs: ['kernelFile'],
          screen: ['  Linux ({kver})', '',
            'Use the ↑ and ↓ keys to select which entry is highlighted.',
            'The highlighted entry will be executed automatically in 5s.'],
          failText: ['error: file `/vmlinuz-{kver}\' not found.', 'error: you need to load the kernel first.', '',
            'Press any key to continue...'], failState: 'loaderPrompt' },
        { id: 'kernel', label: 'stKernel', sub: null, lives: 'livesKernel', hands: 'handsKernel', needs: [],
          screen: ['Linux version {kver}', 'Command line: BOOT_IMAGE=(hd0,gpt3)/vmlinuz-{kver} root=UUID={uuid} ro'],
          does: { root: 'initramfs', pid1: 'systemd', time: 'kernel' } },
        { id: 'initramfs', label: 'stInitramfs', sub: null, lives: 'livesRamdisk', hands: 'handsInitramfs',
          needs: ['diskDriver', 'rootUuid'],
          screen: ['Trying to unpack rootfs image as initramfs...', 'Run /init as init process',
            '[  OK  ] Reached target basic.target - Basic System.'],
          failText: ['[ TIME ] Timed out waiting for device /dev/disk/by-uuid/{uuid}.',
            '[DEPEND] Dependency failed for initrd-root-fs.target - Initrd Root File System.',
            'Warning: /dev/disk/by-uuid/{uuid} does not exist', '',
            'Entering emergency mode. Exit the shell to continue.', 'Type "journalctl" to view system logs.', '',
            'dracut:/#'], failState: 'initrdEmergency',
          does: { root: 'real', time: 'initrd' } },
        { id: 'init', label: 'stInit', sub: 'systemd, PID 1', lives: 'livesRealRoot', hands: 'handsInit', needs: [],
          screen: ['[  OK  ] Found device /dev/disk/by-uuid/{uuid}.', '[  OK  ] Mounted sysroot.mount - /sysroot.',
            '[  OK  ] Reached target initrd.target - Initrd Default Target.',
            '         Starting initrd-switch-root.service - Switch Root...'] },
        { id: 'target', label: 'stTarget', sub: 'default.target → {target}', lives: 'livesUnits', hands: 'handsTarget',
          needs: ['targetUnit'],
          screen: ['[  OK  ] Mounted boot.mount - /boot.', '[  OK  ] Mounted boot-efi.mount - /boot/efi.'],
          failText: ['[ TIME ] Timed out waiting for device /dev/disk/by-uuid/{vjezba}.',
            '[DEPEND] Dependency failed for mnt-vjezba.mount - /mnt/vjezba.',
            '[DEPEND] Dependency failed for local-fs.target - Local File Systems.', '',
            'You are in emergency mode. After logging in, type "journalctl -xb" to view',
            'system logs, "systemctl reboot" to reboot, or "exit" to continue bootup.',
            'Give root password for maintenance', '(or press Control-D to continue): '], failState: 'emergency',
          does: { time: 'userspace', target: true }, onFail: { target: 'emergency.target' } }
      ],
      end: {
        'multi-user': ['[  OK  ] Mounted mnt-vjezba.mount - /mnt/vjezba.',
          '[  OK  ] Reached target local-fs.target - Local File Systems.',
          '[  OK  ] Started crond.service - Command Scheduler.',
          '[  OK  ] Reached target {target} - {targetDesc}.', '', '{host} login: '],
        graphical: ['[  OK  ] Mounted mnt-vjezba.mount - /mnt/vjezba.',
          '[  OK  ] Reached target local-fs.target - Local File Systems.',
          '[  OK  ] Started crond.service - Command Scheduler.',
          '[  OK  ] Reached target {target} - {targetDesc}.', '', { t: 'scrGraphical' }]
      },
      // systemd-analyze on the book machine (UL ch10), multi-user.target; graphical was not measured (SPEC.md).
      timing: { kernel: 1.363, initrd: 3.996, userspace: { 'multi-user': 26.504 }, targetAt: { 'multi-user': 8.13 } }
    },

    /* Windows (task w3/win-boot): UEFI → Boot Manager → winload → kernel → smss → winlogon (Microsoft "Advanced
       troubleshooting for Windows boot problems": PreBoot, Boot Manager, OS Loader, Kernel; Windows Internals 7th ed.
       Part 2 ch. 12 "Startup and shutdown"). Its own break param (winBreak), no targets, no timing. SPEC.md "Windows". */
    windows: {
      capPrefix: 'win_',
      breakKey: 'winBreak',
      breaks: ['bcd', 'bootDriver', 'criticalProcess'],
      targets: [],
      factRows: ['from', 'bcd', 'driver', 'first', 's0', 's1'],
      vars: function (p) {
        return { drvState: p.winBreak === 'bootDriver' ? 'wDrvNotLoaded' : 'wDrvLoaded' };
      },
      stages: [
        { id: 'uefi', label: 'wStUefi', sub: 'NVRAM: Windows Boot Manager', lives: 'livesRom', hands: 'wHandsUefi',
          needs: ['bootEntry'], screen: [{ t: 'wScrUefi' }],
          does: { facts: { from: [{ t: 'wFromEsp' }] } } },
        { id: 'bootmgr', label: 'wStBootmgr', sub: 'bootmgfw.efi', lives: 'wLivesEsp', hands: 'wHandsBootmgr',
          needs: ['bcd'], screen: [{ t: 'wScrBootmgr' }],
          failText: ['Recovery', '', 'Your PC/Device needs to be repaired', '',
            'The Boot Configuration Data for your PC is missing or contains errors.', '',
            'File: \\EFI\\Microsoft\\Boot\\BCD', 'Error code: 0xc000000f', '',
            'You\'ll need to use recovery tools.'], failState: 'bcdRecovery',
          does: { facts: { from: [{ t: 'wFromC' }], bcd: ['device partition=C:', 'path \\Windows\\system32\\winload.efi'] } },
          onFail: { facts: { bcd: [{ t: 'wBcdMissing' }] } } },
        { id: 'winload', label: 'wStWinload', sub: 'winload.efi', lives: 'wLivesC', hands: 'wHandsWinload', needs: [],
          screen: [{ t: 'wScrWinload' }],
          does: { facts: { driver: ['storahci.sys', { t: '{drvState}' }] } } },
        { id: 'kernel', label: 'stKernel', sub: 'ntoskrnl.exe', lives: 'livesKernel', hands: 'wHandsKernel',
          needs: ['bootDriver'], screen: [{ t: 'wScrKernel' }],
          failText: [':(', '', 'Your PC ran into a problem and needs to restart. We\'re just collecting some error info, and then we\'ll restart for you.', '', 'If you call a support person, give them this info:',
            'Stop code: INACCESSIBLE_BOOT_DEVICE'], failState: 'bugcheck7b',
          does: { facts: { first: ['smss.exe'] } },
          onFail: { facts: { driver: ['storahci.sys', { t: '{drvState}' }] } } },
        { id: 'smss', label: 'wStSmss', sub: ['smss.exe', { t: 'wSubS0' }, { t: 'wSubS1' }], lives: 'wLivesC',
          hands: 'wHandsSmss', needs: ['criticalProcess'], screen: [{ t: 'wScrSmss' }],
          failText: [':(', '', 'Your PC ran into a problem and needs to restart. We\'re just collecting some error info, and then we\'ll restart for you.', '', 'If you call a support person, give them this info:',
            'Stop code: CRITICAL_PROCESS_DIED'], failState: 'bugcheckEf',
          does: { facts: { s0: ['csrss.exe, wininit.exe → services.exe, lsass.exe'], s1: ['csrss.exe, winlogon.exe'] } },
          onFail: { facts: { s0: ['csrss.exe', { t: 'wWininitDied' }] } } },
        { id: 'winlogon', label: 'wStWinlogon', sub: 'winlogon.exe → LogonUI', lives: 'wLivesSession1',
          hands: 'wHandsWinlogon', needs: [], screen: [{ t: 'wScrWinlogon' }] }
      ],
      end: { any: [{ t: 'wScrLogon' }] }
    }
  };

  function chainOf(p) { return CHAINS[p.chain] || CHAINS.linux; }

  /** The break the chain reads: p[breakKey] ('break' for Linux, 'winBreak' for Windows). */
  function breakOf(p) { return p[chainOf(p).breakKey || 'break']; }

  /** Index of the first stage that needs the broken thing (rule 7, T1), or -1 (none broken, or a break no stage has: T2). */
  function failIndex(chain, brk) {
    if (!brk || brk === 'none') return -1;
    for (var i = 0; i < chain.stages.length; i++) if (chain.stages[i].needs.indexOf(brk) >= 0) return i;
    return -1;
  }

  function fill(line, vars) {
    if (typeof line !== 'string') return { t: fill(line.t, vars) };
    return line.replace(/\{(\w+)\}/g, function (m, k) { return k in vars ? vars[k] : m; });
  }
  function screenOf(lines, vars) { return lines.map(function (l) { return fill(l, vars); }); }

  /** A stage's sub-label with its {vars} filled ('default.target → multi-user.target'), or null. A list (a stage that
      fans out, Windows smss) gives one line per item: data strings and { t: key }. */
  function subOf(stage, p) {
    if (!stage.sub) return null;
    var vars = chainOf(p).vars(p);
    return Array.isArray(stage.sub) ? screenOf(stage.sub, vars) : fill(stage.sub, vars);
  }
  function setFacts(o, facts, vars, bad) {
    Object.keys(facts || {}).forEach(function (k) {
      o.facts[k] = screenOf(facts[k], vars);
      if (bad && o.factsBad.indexOf(k) < 0) o.factsBad.push(k);
    });
  }

  function targetName(p) { return chainOf(p).vars(p).target || null; }

  var logic = {
    CHAINS: CHAINS,
    KVER: KVER, ROOT_UUID: ROOT_UUID, WRONG_UUID: WRONG_UUID, VJEZBA_UUID: VJEZBA_UUID,
    failIndex: failIndex,
    chainOf: chainOf,
    breakOf: breakOf,
    subOf: subOf,

    defaults: { chain: 'linux', 'break': 'none', winBreak: 'none', target: 'multi-user' },

    /** Power on + one step per stage; a failing stage is the last step (SPEC.md "Steps per demo"). */
    steps: function (p) {
      var c = chainOf(p), f = failIndex(c, breakOf(p));
      return 1 + (f < 0 ? c.stages.length : f + 1);
    },

    initial: function (p) {
      var c = chainOf(p);
      return {
        chain: p.chain in CHAINS ? p.chain : 'linux',
        stages: c.stages.map(function (s) { return s.id; }),
        power: false, at: -1, changed: null, done: [], failedAt: null, halt: null, screen: [],
        root: { initramfs: false, real: false }, pid1: null, target: null, facts: {}, factsBad: [],
        t: { kernel: null, initrd: null, userspace: null, targetAt: null }
      };
    },

    step: function (s, n, p) {
      var c = chainOf(p), vars = c.vars(p), brk = breakOf(p);
      var o = JSON.parse(JSON.stringify(s));
      if (o.failedAt || o.at >= c.stages.length) return o;               // T4: nothing runs after a stop or the end
      if (!o.power) {                                                     // step 1: power on, stage 0 takes control
        o.power = true; o.at = 0; o.changed = c.stages[0].id;
        o.screen = screenOf(c.stages[0].screen || [], vars);
        return o;
      }
      var st = c.stages[o.at];
      if (brk && brk !== 'none' && st.needs.indexOf(brk) >= 0) {         // rule 7: the chain stops here
        o.failedAt = st.id; o.halt = st.failState || 'halt'; o.changed = null;
        o.screen = screenOf(st.failText || [], vars);
        if (st.onFail && st.onFail.target) o.target = st.onFail.target;
        if (st.onFail) setFacts(o, st.onFail.facts, vars, true);
        return o;
      }
      o.done.push(st.id);
      var d = st.does || {};
      if (d.root === 'initramfs') { o.root.initramfs = true; o.root.real = false; }   // rule 4
      if (d.root === 'real') { o.root.initramfs = false; o.root.real = true; }        // rule 5: switch root
      if (d.pid1) o.pid1 = d.pid1;
      if (d.target) o.target = vars.target;                                            // rule 6
      setFacts(o, d.facts, vars, false);
      if (d.time && c.timing) {
        var tm = c.timing[d.time];
        o.t[d.time] = typeof tm === 'object' && tm !== null ? (tm[p.target] !== undefined ? tm[p.target] : null) : tm;
        if (d.time === 'userspace' && c.timing.targetAt) {
          var ta = c.timing.targetAt[p.target];
          o.t.targetAt = ta !== undefined ? ta : null;
        }
      }
      o.at += 1;
      if (o.at < c.stages.length) {
        o.changed = c.stages[o.at].id;
        o.screen = screenOf(c.stages[o.at].screen || [], vars);
      } else {
        o.changed = null;
        o.screen = screenOf((c.end && (c.end[p.target] || c.end.any)) || [], vars);
      }
      return o;
    },

    targetName: targetName
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
