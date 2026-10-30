/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of dmz-matrix, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   Services (tcp/443), addresses and test ids are data and stay out of this table.
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Vatrozid s tri sučelja, matrica pravila i probne veze',

      zone_inet: 'Internet',
      zone_dmz: 'DMZ',
      zone_lan: 'LAN',
      zoneSub_inet: 'vanjska mreža',
      zoneSub_dmz: 'javni poslužitelji',
      zoneSub_lan: 'zaštićena mreža',
      host_visitor: 'posjetitelj',
      host_extWeb: 'web na internetu',
      host_web: 'web poslužitelj',
      host_mail: 'poslužitelj e-pošte',
      host_client: 'klijent',
      host_files: 'datotečni poslužitelj',
      host_db: 'baza podataka',
      firewall: 'vatrozid',
      iface: 'sučelje {n}',
      noLink: 'nema izravne veze',
      attackerTag: 'napadač',

      matrixTitle: 'Tko smije otvoriti što prema kome',
      matrixHint: 'Klikni uslugu da je dopustiš ili ukloniš.',
      corner: 'od ↓ · prema →',
      diagonal: 'unutar zone: ovdje se ne filtrira',
      chipOn: '{from} → {to}, {svc}: dopušteno. Klikni za uklanjanje.',
      chipOff: '{from} → {to}, {svc}: nije navedeno. Klikni za dopuštanje.',
      chipReplyOn: '{from} → {to}, odgovor na {svc} (izvorišni port {port}): dopušten. Klikni za uklanjanje.',
      chipReplyOff: '{from} → {to}, odgovor na {svc} (izvorišni port {port}): nije naveden. Klikni za dopuštanje.',

      testsTitle: 'Probne veze',
      testsAttack: 'Napadač na web poslužitelju u DMZ-u',
      request: 'zahtjev',
      reply: 'odgovor',
      'why_cell-allow': 'dopušteno ćelijom',
      'why_default-deny': 'odbij po zadanome',
      'why_same-zone': 'ne prolazi kroz vatrozid',
      'reply_reply-of-tracked': 'po tablici stanja',
      'reply_cell-allow': 'svojim pravilom',
      'reply_no-rule-for-reply': 'nema pravila',
      testTitle: '{id}: {src} → {dst}, {svc}',

      stateful: 'Filtriranje sa stanjem',
      statefulHint: 'Vatrozid pamti otvorene veze i sam propušta njihove odgovore.',
      compromised: 'Web poslužitelj u DMZ-u je provaljen',
      compromisedHint: 'Probne veze kreću s web poslužitelja: kamo napadač odande stiže?',
      cellParam: 'Ćelija {cell}',

      preset_book: 'Primjer iz knjige',
      'hint_book': 'Web i e-pošta u DMZ-u, LAN smije van na web i DNS, DMZ ne smije u LAN.',
      preset_stateless: 'Bez stanja',
      hint_stateless: 'Iste ćelije, ali vatrozid ne pamti veze: prolazi li odgovor?',
      'preset_web-compromised': 'Provaljen web poslužitelj',
      'hint_web-compromised': 'Napadač je na web poslužitelju u DMZ-u. Što od LAN-a doseže?',
      'preset_any-any': '„Privremeno“ any',
      'hint_any-any': 'Pravilo any iz interneta u LAN, ostavljeno nakon privremene potrebe, i udp/161 prema svim zonama.',
      'preset_rdp-forward': 'tcp/3389 za jedno računalo',
      'hint_rdp-forward': 'Internet → LAN tcp/3389 (udaljena radna površina), zamišljeno za jedno računalo u LAN-u.',

      legZone: 'zona',
      legOn: 'dopuštena',
      legOff: 'nije navedena',
      legReply: 'pravilo za odgovor',
      legPass: 'prolazi',
      legDrop: 'odbačeno',
      legState: 'odgovor',
      legChanged: 'promijenjeno',

      capOn: '{from} → {to}, {svc}: dopušteno pravilom u ćeliji.',
      capOff: '{from} → {to}, {svc}: nema pravila, odbij po zadanome.',
      capAnyOn: '{from} → {to}, any: dopuštena je svaka usluga, i one čiji čip nije uključen.',
      capAnyOff: '{from} → {to}, any uklonjen: prolaze samo navedene usluge, ostalo se odbija po zadanome.',
      capReplyOn: '{from} → {to}, odgovori na {svc} (izvorišni port {port}): dopušteni zasebnim pravilom.',
      capReplyOff: '{from} → {to}, odgovori na {svc} (izvorišni port {port}): nema pravila, odgovor se odbacuje.',
      capStillAny: '{from} → {to}, {svc}: čip je isključen, ali ćelija i dalje navodi any, pa se usluga i dalje propušta.',
      capReplyStillAny: '{from} → {to}, odgovori na {svc}: pravilo je isključeno, ali any u ćeliji i dalje propušta svaki odgovor.',
      capReplyStateful: 'Uz filtriranje sa stanjem to pravilo ne mijenja ništa: odgovor prolazi po tablici stanja.',
      changedSome: ['Promijenio se ishod {n} probne veze: {list}.', 'Promijenio se ishod {n} probne veze: {list}.', 'Promijenio se ishod {n} probnih veza: {list}.'],
      changedNone: 'Nijedna probna veza nije promijenila ishod.',
      capSummary: ['{n} od {total} probnih veza prolazi u oba smjera.', '{n} od {total} probnih veza prolaze u oba smjera.', '{n} od {total} probnih veza prolazi u oba smjera.'],
      capDenied: ['{n} zahtjev odbijen je po zadanome.', '{n} zahtjeva odbijena su po zadanome.', '{n} zahtjeva odbijeno je po zadanome.'],
      capSameZone: ['{n} veza ostaje unutar jedne zone i ne prolazi kroz vatrozid.', '{n} veze ostaju unutar jedne zone i ne prolaze kroz vatrozid.', '{n} veza ostaje unutar jedne zone i ne prolazi kroz vatrozid.'],
      capStateful: 'Odgovori prolaze po tablici stanja, bez pravila za povratni smjer.',
      capStateless: 'Bez stanja svaki odgovor treba svoje pravilo u obrnutoj ćeliji.',
      capNoReply: ['{n} odgovor nema pravilo i odbacuje se.', '{n} odgovora nemaju pravilo i odbacuju se.', '{n} odgovora nema pravilo i odbacuje se.'],
      capAttack: ['Napadač s web poslužitelja doseže {k} od {n} cilja.', 'Napadač s web poslužitelja doseže {k} od {n} cilja.', 'Napadač s web poslužitelja doseže {k} od {n} ciljeva.'],
      capAttackLan: 'U LAN prolazi samo ono što ćelija DMZ → LAN navodi.',
      list2: '{a} i {b}',
      listSep: ', ',

      explain: '<p>Ovdje [[firewall]] ima tri sučelja: internet, DMZ i zaštićenu mrežu. ' +
        '<em lang="en">Demilitarised zone</em> (demilitarizirana zona, DMZ) nije rupa u vatrozidu ni zaobilaznica oko ' +
        'njega, nego treće sučelje istog uređaja. Promet između DMZ-a i zaštićene mreže i dalje prolazi kroz vatrozid, kao ' +
        'i promet prema internetu. Zato matrica ima ćeliju za svaki par zona i svaki smjer.</p>' +
        '<p>Za vezu iz zone A u zonu B vatrozid gleda samo ćeliju A → B. Ćelija je skup usluga: redoslijed u njoj nije ' +
        'važan, za razliku od liste pravila koja se čita odozgo. Što nije navedeno, odbacuje se: <em lang="en">deny by ' +
        'default</em> (odbij po zadanome), u oba smjera.</p>' +
        '<p>Uz <em lang="en">stateful inspection</em> (filtriranje sa stanjem) vatrozid pamti dopuštenu vezu i sam ' +
        'propušta njezin odgovor. Kad je vatrozid <em lang="en">stateless</em> (bez stanja), odgovor mu je novi paket: ' +
        'treba mu zasebno pravilo u obrnutoj ćeliji, za izvorišni <em lang="en">port</em> usluge.</p>' +
        '<p>Javni poslužitelji stoje u DMZ-u da njihov proboj ne otvori put u zaštićenu mrežu: napadač na web ' +
        'poslužitelju doseže LAN samo kroz ćeliju DMZ → LAN. Unutar jedne zone vatrozid ne vidi promet; za to treba ' +
        '<em lang="en">segmentation</em> (segmentacija), još jedan vatrozid unutar mreže.</p>' +
        '<p>NAT ovdje nema redak: nije sigurnosna mjera. Isto što NAT naizgled daje, zabranu da netko izvana otvori vezu ' +
        'prema unutra, daje odbij po zadanome uz filtriranje sa stanjem.</p>'
    },
    en: {
      stage: 'A firewall with three interfaces, the rule matrix and test connections',

      zone_inet: 'Internet',
      zone_dmz: 'DMZ',
      zone_lan: 'LAN',
      zoneSub_inet: 'outside network',
      zoneSub_dmz: 'public servers',
      zoneSub_lan: 'protected network',
      host_visitor: 'visitor',
      host_extWeb: 'web on the internet',
      host_web: 'web server',
      host_mail: 'mail server',
      host_client: 'client',
      host_files: 'file server',
      host_db: 'database',
      firewall: 'firewall',
      iface: 'interface {n}',
      noLink: 'no direct link',
      attackerTag: 'attacker',

      matrixTitle: 'Who may open what to whom',
      matrixHint: 'Click a service to allow or remove it.',
      corner: 'from ↓ · to →',
      diagonal: 'inside one zone: not filtered here',
      chipOn: '{from} → {to}, {svc}: allowed. Click to remove.',
      chipOff: '{from} → {to}, {svc}: not listed. Click to allow.',
      chipReplyOn: '{from} → {to}, reply to {svc} (source port {port}): allowed. Click to remove.',
      chipReplyOff: '{from} → {to}, reply to {svc} (source port {port}): not listed. Click to allow.',

      testsTitle: 'Test connections',
      testsAttack: 'An attacker on the DMZ web server',
      request: 'request',
      reply: 'reply',
      'why_cell-allow': 'allowed by the cell',
      'why_default-deny': 'deny by default',
      'why_same-zone': 'does not cross the firewall',
      'reply_reply-of-tracked': 'by the state table',
      'reply_cell-allow': 'by its own rule',
      'reply_no-rule-for-reply': 'no rule',
      testTitle: '{id}: {src} → {dst}, {svc}',

      stateful: 'Stateful inspection',
      statefulHint: 'The firewall remembers open connections and lets their replies through itself.',
      compromised: 'The DMZ web server is compromised',
      compromisedHint: 'The test connections start from the web server: where can the attacker get from there?',
      cellParam: 'Cell {cell}',

      preset_book: 'The book\'s example',
      'hint_book': 'Web and mail in the DMZ, the LAN may go out to web and DNS, the DMZ may not open the LAN.',
      preset_stateless: 'Stateless',
      hint_stateless: 'The same cells, but the firewall remembers no connections: does the reply get through?',
      'preset_web-compromised': 'Compromised web server',
      'hint_web-compromised': 'An attacker is on the DMZ web server. What in the LAN can it reach?',
      'preset_any-any': 'A "temporary" any',
      'hint_any-any': 'An any rule from the internet to the LAN, left behind after a temporary need, and udp/161 to every zone.',
      'preset_rdp-forward': 'tcp/3389 for one computer',
      'hint_rdp-forward': 'Internet → LAN tcp/3389 (remote desktop), meant for one computer in the LAN.',

      legZone: 'zone',
      legOn: 'allowed',
      legOff: 'not listed',
      legReply: 'reply rule',
      legPass: 'passes',
      legDrop: 'dropped',
      legState: 'reply',
      legChanged: 'changed',

      capOn: '{from} → {to}, {svc}: allowed by the cell\'s rule.',
      capOff: '{from} → {to}, {svc}: no rule, deny by default.',
      capAnyOn: '{from} → {to}, any: every service is allowed, also those whose chip is off.',
      capAnyOff: '{from} → {to}, any removed: only the listed services pass, the rest is denied by default.',
      capReplyOn: '{from} → {to}, replies to {svc} (source port {port}): allowed by a separate rule.',
      capReplyOff: '{from} → {to}, replies to {svc} (source port {port}): no rule, the reply is dropped.',
      capStillAny: '{from} → {to}, {svc}: the chip is off, but the cell still lists any, so the service still passes.',
      capReplyStillAny: '{from} → {to}, replies to {svc}: the rule is off, but any in the cell still lets every reply through.',
      capReplyStateful: 'With stateful inspection this rule changes nothing: the reply passes by the state table.',
      changedSome: ['{n} test connection changed its outcome: {list}.', '{n} test connections changed their outcome: {list}.'],
      changedNone: 'No test connection changed its outcome.',
      capSummary: ['{n} of {total} test connections works both ways.', '{n} of {total} test connections work both ways.'],
      capDenied: ['{n} request is denied by default.', '{n} requests are denied by default.'],
      capSameZone: ['{n} connection stays inside one zone and does not cross the firewall.', '{n} connections stay inside one zone and do not cross the firewall.'],
      capStateful: 'Replies pass by the state table, with no rule for the return direction.',
      capStateless: 'Stateless, every reply needs a rule of its own in the reverse cell.',
      capNoReply: ['{n} reply has no rule and is dropped.', '{n} replies have no rule and are dropped.'],
      capAttack: ['The attacker on the web server reaches {k} of {n} target.', 'The attacker on the web server reaches {k} of {n} targets.'],
      capAttackLan: 'Into the LAN goes only what the DMZ → LAN cell lists.',
      list2: '{a} and {b}',
      listSep: ', ',

      explain: '<p>The DMZ (demilitarised zone) is not a hole in the [[firewall]] or a way around it: it is a third interface ' +
        'of the same device. Traffic between the DMZ and the protected network still goes through the firewall, like ' +
        'traffic to the internet. So the matrix has a cell for every pair of zones and each direction.</p>' +
        '<p>For a connection from zone A to zone B the firewall looks only at the cell A → B. A cell is a set of ' +
        'services: order inside it does not matter, unlike a rule list read from the top. Anything not listed is ' +
        'dropped: deny by default, in both directions.</p>' +
        '<p>A stateful firewall (stateful inspection) remembers an allowed connection and lets its reply through by ' +
        'itself. To a stateless firewall a reply is a new packet: it needs a separate rule in the reverse cell, for the ' +
        'service\'s source port.</p>' +
        '<p>Public servers sit in the DMZ so that breaking into one does not open a way into the protected network: an ' +
        'attacker on the web server reaches the LAN only through the DMZ → LAN cell. Inside one zone the firewall sees ' +
        'no traffic; that takes segmentation, another firewall inside the network.</p>' +
        '<p>NAT has no row here: it is not a security measure. What NAT seems to give, nobody outside opening a ' +
        'connection inwards, deny by default with stateful inspection gives too.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
