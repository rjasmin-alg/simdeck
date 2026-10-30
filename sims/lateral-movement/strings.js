/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lateral-movement, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). In captions, *term* is an
   English term in italics (the page turns it into <em lang="en">); the terms are not in kit/glossary.js yet, so the
   pairs are written out here (NOTES.md, "Term pairs"). Account names, machine names and hashes are data, written by
   the page with translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Mreža domene po slojevima, s vjerodajnicama u memoriji svakog računala',

      tier0: 'Sloj 0 · identitet',
      tier1: 'Sloj 1 · poslužitelji',
      tier2: 'Sloj 2 · radne stanice',
      roleDc: 'kontroler domene',
      roleApp: 'aplikacijski poslužitelj',
      roleFs: 'datotečni poslužitelj',
      roleWs: 'radna stanica',
      dcLine: 'imenik: sažeci svih računa',
      lapsTag: 'LAPS',
      laLabel: 'lokalni admin:',
      localAdminName: 'lokalni administrator ({node})',
      memory: 'u memoriji:',
      memoryEmpty: 'ništa',
      badgeAttacker: 'napadač · {priv}',
      badgeOwned: 'zauzet',
      privUser: 'korisnik',
      leaverTag: 'bivši',
      refusedLabel: '{who}: prijavu je odbilo raslojavanje',

      sideTitle: 'Napadač',
      notIn: 'još nije u mreži',
      atLine: 'na {node} kao {priv}',
      pathLabel: 'put:',
      heldTitle: 'Ukradene vjerodajnice',
      heldNone: 'još nijedna',
      kindHash: 'NT sažetak',
      kindPassword: 'lozinka',
      opens: 'otvara:',
      opensNothing: 'nigdje administrator',
      everyAccount: 'i sažetak svakog računa u domeni',
      outcomeCompromised: 'Domena je kompromitirana',
      outcomeContained: 'Zaustavljen u sloju {tier}',

      tiering: 'Slojevi ovlasti',
      tieringHint: 'Administrator se ne prijavljuje na niži sloj.',
      laps: 'LAPS na radnim stanicama',
      lapsHint: 'Svaka stanica ima svoju lokalnu lozinku.',
      daLogsOnWS: 'Domenski administrator na WS1',
      daLogsOnWSHint: 'Pomogao je korisniku i ostao prijavljen.',
      daRefused: 'Uz raslojavanje ta prijava nije dopuštena.',
      sharedLocalAdmin: 'Ista lokalna lozinka na stanicama',
      sharedHint: 'Sve iz jedne slike sustava.',
      sharedLaps: 'LAPS svakoj daje svoju.',
      leaverAdmin: 'Račun bivšeg administratora',
      leaverHint: 'Uključen; zadatak na APP1 radi pod njim.',

      presetFlat: 'Bez slojeva',
      presetFlatHint: 'Domenski administrator ostavio je vjerodajnicu na WS1.',
      presetLaps: 'Samo LAPS',
      presetLapsHint: 'Lokalni sažetak više ne otvara WS2, ali domenski administrator je i dalje na WS1.',
      presetTiered: 'Slojevi',
      presetTieredHint: 'Administrator sloja 0 ne prijavljuje se na radne stanice.',
      presetBoth: 'Slojevi + LAPS',
      presetBothHint: 'Napadač ostaje na WS1.',
      presetChain: 'Skok po skok',
      presetChainHint: 'Bez domenskog administratora na WS1: vjerodajnice od računala do računala.',

      legendT0: 'sloj 0',
      legendT1: 'sloj 1',
      legendT2: 'sloj 2',
      legendUser: 'korisnik',
      legendStolen: 'ukradena',
      legendUsable: 'prijelaz',
      legendCut: 'odsječeno',
      legendRefused: 'prijava odbijena',
      legendChanged: 'promjena',

      capStart: 'Mreža prije napada: u memoriji svakog računala su vjerodajnice onih koji su se na njemu prijavili. Pritisni → za početak.',
      capStep: 'Korak {n}:',
      capFoothold: 'uporište. Napadač izvršava kod kao {who} na {node}: običan korisnik, nigdje administrator. (Kako je ušao, tema je druge demonstracije.)',
      capEscalate: '*privilege escalation* (eskalacija ovlasti). Napadač je sada lokalni administrator (SYSTEM) na {node} i može čitati memoriju procesa prijave (LSASS).',
      capDump: [
        'napadač kopira {n} vjerodajnicu iz memorije računala {node}: {list}.',
        'napadač kopira {n} vjerodajnice iz memorije računala {node}: {list}.',
        'napadač kopira {n} vjerodajnica iz memorije računala {node}: {list}.'
      ],
      capDumpNone: 'u memoriji računala {node} nema ničeg novog za napadača.',
      noteDaOnWs: 'Na {node} je bila prijava domenskog administratora — njegova je vjerodajnica sada u napadačevim rukama.',
      noteServerAdmin: 'Ovdje se prijavio administrator poslužitelja: ta vjerodajnica otvara sve poslužitelje.',
      noteLeaver: 'Vlasnik računa {who} više ne radi ovdje, ali račun je uključen i pod njim radi zakazani zadatak: lozinka je spremljena na {node}.',
      noteImage: 'Sažetak lokalnog administratora isti je na svim radnim stanicama: otvara i ostale.',
      noteLaps: 'Uz LAPS ova lozinka lokalnog administratora postoji samo na {node}.',
      noteUnique: 'Ova lozinka lokalnog administratora postoji samo na {node}.',
      capMoveHash: '*pass-the-hash* (ponovna uporaba sažetka). Napadač se na {to} prijavljuje kao {who} ukradenim sažetkom: lozinka mu ne treba, ništa ne razbija.',
      capMovePassword: 'napadač se na {to} prijavljuje kao {who} ukradenom lozinkom.',
      capRefusedLaps: 'napadač pokušava sažetak lokalnog administratora s {from} na {to}: odbijeno. Uz LAPS svaka radna stanica ima svoju lozinku.',
      capRefusedUnique: 'napadač pokušava sažetak lokalnog administratora s {from} na {to}: odbijeno. {to} ima drugu lozinku.',
      capCompromised: 'domena je kompromitirana. Na kontroleru domene napadač čita sažetke svih računa, i krbtgt, pa sada može biti bilo tko.',
      capStalled: 'zaustavljen u sloju {tier}. Nijedna ukradena vjerodajnica ne otvara drugo računalo.',
      noteTiering: 'Uz slojeve, administrator sloja 0 nikad se ne prijavljuje na radnu stanicu: nema što ukrasti.',

      explain:
        '<p><b>Bočno kretanje.</b> <em lang="en">Lateral movement</em> (bočno kretanje): napadač s jednog osvojenog računala prelazi ' +
        'na druga, vjerodajnicama koje tamo nađe. Tko se interaktivno prijavi na računalo, ostavlja u memoriji procesa prijave ' +
        'svoju <em lang="en">credential</em> (vjerodajnicu), NT <em lang="en">hash</em> (sažetak) lozinke. Lokalni administrator tog ' +
        'računala može je pročitati.</p>' +
        '<p><b>Sažetak je lozinka.</b> NTLM provjera računa se iz sažetka, ne iz lozinke, pa ukradeni sažetak radi bez razbijanja: ' +
        '<em lang="en">pass-the-hash</em> (ponovna uporaba sažetka). Jaka lozinka tu ne pomaže. Kerberosova karta ukradena iz memorije ' +
        'jednako se ponovno upotrebljava (<em lang="en">pass-the-ticket</em>).</p>' +
        '<p><b>Jedna prijava otvara domenu.</b> Domenski administrator koji se prijavi na radnu stanicu ostavlja tamo vjerodajnicu ' +
        'koja vrijedi na svakom računalu domene, i na kontroleru domene. Napadaču ne treba lozinka kontrolera domene.</p>' +
        '<p><b>LAPS.</b> Radne stanice instalirane iz jedne slike sustava imaju istu lozinku lokalnog administratora, pa sažetak s ' +
        'jedne otvara sve. LAPS svakoj daje svoju i mijenja je. To siječe taj prijelaz, ali ne štiti domenske vjerodajnice u memoriji.</p>' +
        '<p><b>Slojevi.</b> Raslojavanje administrativnih ovlasti: sloj 0 su identitet i kontroleri domene, sloj 1 poslužitelji, ' +
        'sloj 2 radne stanice. Administrator se prijavljuje samo na računala svog sloja, pa njegova vjerodajnica nikad ne leži ' +
        'tamo gdje do nje dolazi napad na niži sloj. Napadač s radne stanice tako nalazi samo vjerodajnice sloja 2.</p>' +
        '<p><b>Bivši zaposlenici.</b> Neisključeni računi s administratorskim ovlastima šire štetu: još jedna vjerodajnica sloja 0 ' +
        'koja negdje leži.</p>' +
        '<p><b>Zablude.</b> „Napadaču treba lozinka kontrolera domene": ne, dovoljna je tuđa vjerodajnica iz memorije. ' +
        '„Jaka lozinka sprječava <em lang="en">pass-the-hash</em>": ne, sažetak je lozinka. „Jedno osvojeno računalo ostaje ' +
        'samo": ne, ako je na njemu bio administrator.</p>' +
        '<p><b>Pojednostavljenja.</b> Svaki korisnik domene može pročitati tko je gdje administrator, pa napadač domenske ' +
        'vjerodajnice pokušava baš tamo. Sažetak lokalnog administratora pokušava na ostalim računalima istog sloja. Najprije ' +
        'bira vjerodajnicu najvišeg sloja, zatim cilj najvišeg sloja, zatim po imenu računala. Kako je ušao i alati nisu tema.</p>'
    },
    en: {
      stage: 'The domain\'s machines by tier, with the credentials in each machine\'s memory',

      tier0: 'Tier 0 · identity',
      tier1: 'Tier 1 · servers',
      tier2: 'Tier 2 · workstations',
      roleDc: 'domain controller',
      roleApp: 'application server',
      roleFs: 'file server',
      roleWs: 'workstation',
      dcLine: 'directory: every account\'s hash',
      lapsTag: 'LAPS',
      laLabel: 'local admin:',
      localAdminName: 'local Administrator ({node})',
      memory: 'in memory:',
      memoryEmpty: 'nothing',
      badgeAttacker: 'attacker · {priv}',
      badgeOwned: 'taken',
      privUser: 'user',
      leaverTag: 'leaver',
      refusedLabel: '{who}: logon refused by tiering',

      sideTitle: 'Attacker',
      notIn: 'not in the network yet',
      atLine: 'on {node} as {priv}',
      pathLabel: 'path:',
      heldTitle: 'Stolen credentials',
      heldNone: 'none yet',
      kindHash: 'NT hash',
      kindPassword: 'password',
      opens: 'opens:',
      opensNothing: 'admin nowhere',
      everyAccount: 'and the hash of every account in the domain',
      outcomeCompromised: 'Domain compromised',
      outcomeContained: 'Contained at Tier {tier}',

      tiering: 'Tiering',
      tieringHint: 'An admin never logs on to a lower tier.',
      laps: 'LAPS on workstations',
      lapsHint: 'Each workstation has its own local password.',
      daLogsOnWS: 'Domain Admin on WS1',
      daLogsOnWSHint: 'They helped the user and stayed logged on.',
      daRefused: 'With tiering this logon is not allowed.',
      sharedLocalAdmin: 'One local password on all workstations',
      sharedHint: 'All installed from one image.',
      sharedLaps: 'LAPS gives each its own.',
      leaverAdmin: 'A leaver\'s admin account',
      leaverHint: 'Enabled; a task on APP1 runs as it.',

      presetFlat: 'No tiers',
      presetFlatHint: 'A Domain Admin left their credential on WS1.',
      presetLaps: 'LAPS only',
      presetLapsHint: 'The local hash no longer opens WS2, but the Domain Admin is still on WS1.',
      presetTiered: 'Tiering',
      presetTieredHint: 'A Tier 0 admin does not log on to workstations.',
      presetBoth: 'Tiering + LAPS',
      presetBothHint: 'The attacker stays on WS1.',
      presetChain: 'Hop by hop',
      presetChainHint: 'No Domain Admin on WS1: credentials from machine to machine.',

      legendT0: 'Tier 0',
      legendT1: 'Tier 1',
      legendT2: 'Tier 2',
      legendUser: 'user',
      legendStolen: 'stolen',
      legendUsable: 'move',
      legendCut: 'cut',
      legendRefused: 'logon refused',
      legendChanged: 'changed',

      capStart: 'The estate before the attack: each machine\'s memory holds the credentials of whoever logged on there. Press → to start.',
      capStep: 'Step {n}:',
      capFoothold: 'foothold. The attacker runs code as {who} on {node}: an ordinary user, admin nowhere. (How they got in is another demo.)',
      capEscalate: 'privilege escalation. The attacker is now local admin (SYSTEM) on {node} and can read the memory of the logon process (LSASS).',
      capDump: [
        'the attacker copies {n} credential from the memory of {node}: {list}.',
        'the attacker copies {n} credentials from the memory of {node}: {list}.'
      ],
      capDumpNone: 'nothing new for the attacker in the memory of {node}.',
      noteDaOnWs: 'A Domain Admin had logged on to {node} — that credential is now in the attacker\'s hands.',
      noteServerAdmin: 'A server admin had logged on here: that credential opens every server.',
      noteLeaver: 'The owner of {who} has left, but the account is enabled and a scheduled task runs as it: its password is stored on {node}.',
      noteImage: 'The local Administrator hash is the same on every workstation: it opens the others too.',
      noteLaps: 'With LAPS this local Administrator password exists only on {node}.',
      noteUnique: 'This local Administrator password exists only on {node}.',
      capMoveHash: 'pass-the-hash. The attacker logs on to {to} as {who} with the stolen hash: no password needed, nothing cracked.',
      capMovePassword: 'the attacker logs on to {to} as {who} with the stolen password.',
      capRefusedLaps: 'the attacker tries the local Administrator hash from {from} on {to}: refused. With LAPS every workstation has its own password.',
      capRefusedUnique: 'the attacker tries the local Administrator hash from {from} on {to}: refused. {to} has a different password.',
      capCompromised: 'domain compromised. On the domain controller the attacker reads every account\'s hash, krbtgt included, and can now be anyone.',
      capStalled: 'contained at Tier {tier}. No stolen credential opens another machine.',
      noteTiering: 'With tiering, a Tier 0 admin never logs on to a workstation: there is nothing to steal.',

      explain:
        '<p><b>Lateral movement.</b> The attacker moves from one compromised machine to others with the credentials found there. ' +
        'Whoever logs on interactively leaves their credential, the NT hash of the password, in the memory of the logon process. ' +
        'A local admin on that machine can read it.</p>' +
        '<p><b>The hash is the password.</b> NTLM computes its response from the hash, not from the password, so a stolen hash works ' +
        'without cracking: pass-the-hash. A strong password does not help here. A Kerberos ticket stolen from memory is reused the ' +
        'same way (pass-the-ticket).</p>' +
        '<p><b>One logon exposes the domain.</b> A Domain Admin who logs on to a workstation leaves there a credential that is valid ' +
        'on every machine in the domain, the domain controller included. The attacker never needs the domain controller\'s password.</p>' +
        '<p><b>LAPS.</b> Workstations installed from one image share the local admin password, so a hash from one opens them all. ' +
        'LAPS gives each its own and rotates it. That cuts this move, but it does not protect domain credentials in memory.</p>' +
        '<p><b>Tiers.</b> Tiering admin rights: Tier 0 is identity and the domain controllers, Tier 1 the servers, Tier 2 the ' +
        'workstations. An admin logs on only to machines of their own tier, so their credential never lies where an attack on a ' +
        'lower tier can reach it. An attacker on a workstation then finds only Tier 2 credentials.</p>' +
        '<p><b>Leavers.</b> Admin accounts nobody disabled widen the damage: one more Tier 0 credential lying somewhere.</p>' +
        '<p><b>Misconceptions.</b> "The attacker needs the domain controller\'s password": no, someone else\'s credential from memory ' +
        'is enough. "A strong password stops pass-the-hash": no, the hash is the password. "One compromised PC stays contained": ' +
        'not if an admin was logged on to it.</p>' +
        '<p><b>Simplifications.</b> Any domain user can read who is an admin where, so the attacker tries domain credentials exactly ' +
        'there. A local Administrator hash is tried on the other machines of the same tier. The attacker picks the highest-tier ' +
        'credential first, then the highest-tier target, then by machine name. How they got in, and tools, are not the topic.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
