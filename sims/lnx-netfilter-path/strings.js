/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-netfilter-path, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder (a node in captions: hooks, chains, addresses and interfaces are shown as code), an array is
   plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). None of this page's terms is in kit/glossary.js yet, so the
   Croatian explanation writes the term rule out by hand (NOTES.md, "Term pairs"). The title and subtitle come from
   sim.json. Hook, chain and interface names, addresses, ports and rule text are data, not words. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Kuke netfiltera u usmjerniku: paket, lanci na svakoj kuki, odluka o usmjeravanju i tablica veza',
      // panel
      packet: 'Paket',
      pkSshIn: 'na :22',
      pkPortFwd: 'na :8080',
      pkLanOut: 'iz LAN-a',
      pkLocalOut: 'lokalni',
      reply: 'Zatim i odgovor',
      ipForward: 'Prosljeđivanje (ip_forward)',
      inputPolicy: 'Politika lanca filter_in',
      fwdRule: 'Pravilo 3 u lancu filter_fwd',
      fwdNone: 'nema',
      fwd80: 'dport 80',
      fwd8080: 'dport 8080',
      optAccept: 'accept',
      optDrop: 'drop',
      extra: 'Drugi lanac na kuki input, prioritet',
      extraHint: 'Lanac extra: LAN prolazi, ostalo drop.',
      extraNone: 'nema',
      pInbound: 'Izvana na :22',
      pPortFwd: 'Prosljeđivanje porta',
      pMasq: 'Maskiranje',
      pLocalOut: 'Paket usmjernika',
      pAcceptNotFinal: 'accept nije konačan',
      pNoForward: 'Bez prosljeđivanja',
      // legend
      lgPath: 'kuka na putu paketa',
      lgDark: 'nije na putu',
      lgAccept: 'propušta',
      lgDrop: 'odbacuje',
      lgNat: 'prepisuje adresu',
      lgChanged: 'promijenjeno u ovom koraku',
      // stage: the diagram
      boxIn: 'sa žice',
      boxOut: 'na žicu',
      boxLocal: 'lokalni proces',
      boxRoute: 'odluka o usmjeravanju',
      boxDropped: 'odbačeno',
      noChain: 'nema baznog lanca',
      here: 'paket',
      hereReply: 'odgovor',
      viaIf: 'kroz {iif}',
      toIf: 'kroz {oif}',
      toInput: '→ input',
      toForward: '→ forward',
      toLocal: 'lokalno',
      outside: 'vanjsko računalo',
      inside: 'unutarnje računalo',
      router: 'usmjernik',
      sends: 'šalje',
      gets: 'prima',
      tie: 'isti prioritet',
      // stage: the packet card and conntrack
      cardPacket: 'Paket',
      cardReply: 'Odgovor',
      ctState: 'veza',
      ctNew: 'nova',
      ctEst: 'uspostavljena',
      ctNone: 'još nije pronađena',
      ctGone: 'uklonjena',
      ctTitle: 'Tablica veza',
      colOrig: 'izvorni smjer',
      colReply: 'očekivani odgovor',
      colNat: 'NAT',
      colStatus: 'stanje',
      ctEmpty: 'nema zapisa',
      // stage: the chains of this hook (K4), the route table, the trace
      chainsAt: 'Lanci na kuki {hook}',
      chainHead: '{name} · tip {type} · prioritet {prio}',
      colMatch: 'uvjet',
      colVerdict: 'presuda',
      policyRow: 'nijedno pravilo ne odgovara: politika',
      markWin: 'odlučuje',
      markSkip: 'nije čitano',
      skippedNat: 'Preskočen: lanac tipa nat vidi samo prvi paket veze.',
      ctDid: 'Umjesto njega praćenje veza: {what} → {value}.',
      ctDidNothing: 'Umjesto njega praćenje veza: ovdje nema što prevesti.',
      whatDst: 'odredište',
      whatSrc: 'izvor',
      hookNoChain: 'Na ovoj kuki nema baznog lanca: paket prolazi nepromijenjen.',
      notYet: 'Paket još nije ni na jednoj kuki.',
      rtTitle: 'Odluka o usmjeravanju',
      rtLocal: 'lokalne adrese',
      rtDest: 'odredište',
      rtIf: 'sučelje',
      rtForwardOn: 'prosljeđivanje uključeno',
      rtForwardOff: 'prosljeđivanje isključeno',
      rtNoCheck: 'Za lokalni paket prosljeđivanje se ne pita.',
      traceTitle: 'Put paketa: presuda svakog lanca',
      traceSkip: 'preskočen',
      traceCt: 'praćenje veza prevodi',
      tracePolicy: 'politika',
      traceRule: 'pravilo {n}',
      traceNone: 'nijedan lanac',
      // captions
      cStartIn: 'Paket {src} → {dst} šalje {who}; stiže na sučelje {iif}.',
      cStartLocal: 'Proces na samom usmjerniku otvara vezu prema {dst}.',
      cReplyIn: 'Odgovor {src} → {dst} stiže na {iif}.',
      cReplyLocal: 'Lokalni proces odgovara: {src} → {dst}.',
      hNoChain: '{hook}: nema baznog lanca, pa paket prolazi.',
      hDnat: '{chain} (nat): pravilo {n} mijenja odredište u {to}.',
      hMasq: '{chain} (nat): pravilo {n} maskira izvor — sada je {addr}, adresa sučelja {oif}.',
      hMasqAfter: 'Filtar u forward vidio je još stari izvor {old}.',
      hNatNoMatch: '{chain} (nat): nijedno pravilo ne odgovara, adrese ostaju.',
      hNatSkip: '{chain} se preskače: lanac tipa nat vidi samo prvi paket veze.',
      hCtNat: '{chain} se preskače, a praćenje veza prepisuje {what} kako je zapisano uz prvi paket: {value}.',
      hAccept: '{chain}: pravilo {n} odgovara, accept.',
      hAcceptPolicy: '{chain}: nijedno pravilo ne odgovara, politika accept propušta paket.',
      hDrop: '{chain}: pravilo {n} odgovara, drop.',
      hDropPolicy: '{chain}: nijedno pravilo ne odgovara, pa odlučuje politika drop — paket je odbačen.',
      hNotFinal: 'accept završava samo lanac {chain}; {next} se i dalje izvodi.',
      hTie: '⚠ {a} i {b} imaju isti prioritet {prio}: dokumentacija ne određuje redoslijed; ovdje se izvode po imenu.',
      hSeesDnat: 'Filtar ovdje vidi novo odredište {dst}.',
      rLocal: 'Odluka o usmjeravanju: {dst} je adresa ovog stroja, pa paket ide u input.',
      rFwd: 'Odluka o usmjeravanju: {dst} nije lokalna adresa, put vodi kroz {oif}, pa paket ide u forward.',
      rDnat: 'DNAT (prevođenje odredišne adrese) u {pre} promijenio je odredište u {dst} prije odluke o usmjeravanju — zato paket ide kroz {fwd}, a ne {inp}.',
      rCt: 'Praćenje veza vratilo je u prerouting odredište na {dst} prije ove odluke, pa odgovor ide kroz forward prema {oif}.',
      rNoFwd: 'Odluka o usmjeravanju: {dst} nije lokalna adresa, a prosljeđivanje je isključeno ({sysctl}). Paket se odbacuje ovdje; forward ga nikad ne vidi.',
      rOut: 'Odluka o usmjeravanju za lokalni paket: {dst} se doseže kroz {oif}. Prosljeđivanje se tu ne pita: paket nastaje ovdje.',
      cLocal: 'Paket je predan lokalnom procesu na portu {dport}. forward i postrouting ga ne vide.',
      cOut: 'Paket izlazi kroz {oif} prema {dst} ({who}).',
      cOutSnat: 'Druga strana vidi izvor {src}, a ne {old}.',
      cOutDnat: 'Primatelj vidi odredište {dst}, a pošiljatelj je paket poslao na {old}.',
      cDropped: 'Paket je odbačen u {where}. drop je konačan: nijedan kasniji lanac ni kuka ga ne vidi, a veza se ne zapisuje.',
      cDroppedRoute: 'Paket je odbačen pri odluci o usmjeravanju i veza se ne zapisuje.',
      cDroppedReply: 'Paket je odbačen u {where}. drop je konačan: nijedan kasniji lanac ni kuka ga ne vidi. Veza ostaje zapisana; izgubljen je samo ovaj paket.',
      explain: '<p>Netfilter predaje paket pravilima na pet mjesta, a svako je <i lang="en">hook</i> (kuka): ' +
        '<code>prerouting</code> (svaki paket sa žice, prije usmjeravanja), <code>input</code> (paket za ovaj stroj), ' +
        '<code>forward</code> (paket koji prolazi kroz stroj), <code>output</code> (paket koji nastaje ovdje) i ' +
        '<code>postrouting</code> (svaki paket koji odlazi). Paket ide jednim od tri puta: na lokalnu adresu ' +
        '<code>prerouting → input</code>, kroz stroj <code>prerouting → forward → postrouting</code>, a lokalni ' +
        '<code>output → postrouting</code>. Između je <i lang="en">routing decision</i> (odluka o usmjeravanju).</p>' +
        '<p>Na kuku se veže <i lang="en">chain</i> (lanac); takav bazni lanac ima tip, prioritet i politiku. Lanci iste kuke ' +
        'izvode se redom prioriteta, od manjeg prema većem: <code>dstnat</code> −100, <code>filter</code> 0, ' +
        '<code>srcnat</code> 100 (postoje i <code>raw</code> −300, <code>mangle</code> −150, <code>security</code> 50). ' +
        'U lancu odlučuje prvo pravilo koje odgovara; ako nijedno ne odgovara, odlučuje politika lanca. ' +
        '<code>accept</code> završava samo taj lanac: sljedeći lanac iste kuke i kasnije kuke i dalje mogu odbaciti paket. ' +
        '<code>drop</code> je konačan. To nije jedan popis „prvo pravilo pobjeđuje” kao kod jednostavnog vatrozida, nego put kroz kuke.</p>' +
        '<p>Gdje se mijenja adresa: <i lang="en">DNAT</i> (prevođenje odredišne adrese) u <code>prerouting</code> ' +
        '(i <code>output</code> za lokalne pakete, kad se put traži još jednom), pa odluka o usmjeravanju već vidi novo odredište; ' +
        '<i lang="en">SNAT</i> i <i lang="en">masquerade</i> (maskiranje) u <code>postrouting</code>, pa filtar u ' +
        '<code>forward</code> (i sve prije <code>srcnat</code>) vidi stari izvor. Prosljeđivanje porta zato treba pravilo u <code>forward</code> za novo odredište, a ne pravilo u ' +
        '<code>input</code>. Ako je <code>net.ipv4.ip_forward</code> 0, paket koji nije za ovaj stroj odbacuje se već pri odluci o usmjeravanju.</p>' +
        '<p>Lanac tipa <code>nat</code> vidi samo prvi paket veze. <i lang="en">Connection tracking</i> (praćenje veza) ' +
        'zapisuje vezu i prijevod, pa sljedeće pakete i odgovore prevodi sam, u oba smjera. Filtar ' +
        'pravilom <code>ct state established,related accept</code> propušta odgovore; tako radi ' +
        '<i lang="en">stateful firewall</i> (vatrozid sa stanjem).</p>' +
        '<p>Česte zablude: „prosljeđivanje porta treba pravilo u <code>input</code>” (paket nakon DNAT-a ide kroz ' +
        '<code>forward</code>); „<code>accept</code> u jednom lancu znači da je paket propušten” (kasniji lanac ga još može ' +
        'odbaciti); „maskiranje mijenja izvor prije nego što ga filter vidi” (događa se tek u <code>postrouting</code>).</p>'
    },
    en: {
      stage: 'The netfilter hooks of a router: the packet, the chains at each hook, the routing decision and the connection table',
      packet: 'Packet',
      pkSshIn: 'to :22',
      pkPortFwd: 'to :8080',
      pkLanOut: 'from LAN',
      pkLocalOut: 'local',
      reply: 'Then the reply',
      ipForward: 'Forwarding (ip_forward)',
      inputPolicy: 'Policy of filter_in',
      fwdRule: 'Rule 3 in filter_fwd',
      fwdNone: 'none',
      fwd80: 'dport 80',
      fwd8080: 'dport 8080',
      optAccept: 'accept',
      optDrop: 'drop',
      extra: 'A second input chain, priority',
      extraHint: 'The chain extra: LAN allowed, else drop.',
      extraNone: 'none',
      pInbound: 'Inbound to :22',
      pPortFwd: 'Port forward',
      pMasq: 'Masquerade',
      pLocalOut: 'Router\'s own packet',
      pAcceptNotFinal: 'accept is not final',
      pNoForward: 'Forwarding off',
      lgPath: 'hook on the packet\'s path',
      lgDark: 'not on the path',
      lgAccept: 'propušta',
      lgDrop: 'odbacuje',
      lgNat: 'rewrites the address',
      lgChanged: 'changed in this step',
      boxIn: 'from the wire',
      boxOut: 'to the wire',
      boxLocal: 'local process',
      boxRoute: 'routing decision',
      boxDropped: 'dropped',
      noChain: 'no base chain',
      here: 'packet',
      hereReply: 'reply',
      viaIf: 'via {iif}',
      toIf: 'via {oif}',
      toInput: '→ input',
      toForward: '→ forward',
      toLocal: 'local',
      outside: 'outside host',
      inside: 'inside host',
      router: 'router',
      sends: 'sends',
      gets: 'receives',
      tie: 'same priority',
      cardPacket: 'Packet',
      cardReply: 'Reply',
      ctState: 'connection',
      ctNew: 'new',
      ctEst: 'established',
      ctNone: 'not looked up yet',
      ctGone: 'removed',
      ctTitle: 'Connection table',
      colOrig: 'original',
      colReply: 'expected reply',
      colNat: 'NAT',
      colStatus: 'state',
      ctEmpty: 'no entries',
      chainsAt: 'Chains at the {hook} hook',
      chainHead: '{name} · type {type} · priority {prio}',
      colMatch: 'match',
      colVerdict: 'verdict',
      policyRow: 'no rule matches: the policy',
      markWin: 'decides',
      markSkip: 'not read',
      skippedNat: 'Skipped: a nat chain sees only the first packet of a connection.',
      ctDid: 'Conntrack instead: {what} → {value}.',
      ctDidNothing: 'Conntrack instead: nothing to translate here.',
      whatDst: 'destination',
      whatSrc: 'source',
      hookNoChain: 'No base chain on this hook: the packet passes unchanged.',
      notYet: 'The packet is not at a hook yet.',
      rtTitle: 'Routing decision',
      rtLocal: 'local addresses',
      rtDest: 'destination',
      rtIf: 'interface',
      rtForwardOn: 'forwarding on',
      rtForwardOff: 'forwarding off',
      rtNoCheck: 'For a local packet forwarding plays no part.',
      traceTitle: 'The path: each chain\'s verdict',
      traceSkip: 'skipped',
      traceCt: 'conntrack translates',
      tracePolicy: 'policy',
      traceRule: 'rule {n}',
      traceNone: 'no chain',
      cStartIn: 'The {who} sends {src} → {dst}; the packet arrives on the interface {iif}.',
      cStartLocal: 'A process on the router itself opens a connection to {dst}.',
      cReplyIn: 'The reply {src} → {dst} arrives on {iif}.',
      cReplyLocal: 'The local process answers: {src} → {dst}.',
      hNoChain: '{hook}: no base chain, so the packet passes.',
      hDnat: '{chain} (nat): rule {n} changes the destination to {to}.',
      hMasq: '{chain} (nat): rule {n} masquerades the source — it is now {addr}, the address of {oif}.',
      hMasqAfter: 'The filter in forward still saw the old source {old}.',
      hNatNoMatch: '{chain} (nat): no rule matches; the addresses stay.',
      hNatSkip: '{chain} is skipped: a nat chain sees only the first packet of a connection.',
      hCtNat: '{chain} is skipped, and conntrack rewrites the {what} as recorded with the first packet: {value}.',
      hAccept: '{chain}: rule {n} matches, accept.',
      hAcceptPolicy: '{chain}: no rule matches; the policy accept lets the packet through.',
      hDrop: '{chain}: rule {n} matches, drop.',
      hDropPolicy: '{chain}: no rule matches, so the policy drop decides — the packet is dropped.',
      hNotFinal: 'accept ends only the chain {chain}; {next} still runs.',
      hTie: '⚠ {a} and {b} have the same priority {prio}: the documentation does not fix the order; here they run by name.',
      hSeesDnat: 'The filter here sees the new destination {dst}.',
      rLocal: 'Routing decision: {dst} is an address of this machine, so the packet goes to input.',
      rFwd: 'Routing decision: {dst} is not local; the route goes out through {oif}, so the packet goes to forward.',
      rDnat: 'DNAT in {pre} changed the destination to {dst} before the routing decision, so the packet goes through {fwd}, not {inp}.',
      rCt: 'Conntrack turned the destination back to {dst} in prerouting, before this decision, so the reply goes through forward to {oif}.',
      rNoFwd: 'Routing decision: {dst} is not local, and forwarding is off ({sysctl}). The packet is dropped here; forward never sees it.',
      rOut: 'Routing decision for a local packet: {dst} is reached through {oif}. Forwarding plays no part: the packet starts here.',
      cLocal: 'The packet is delivered to the local process on port {dport}. forward and postrouting never see it.',
      cOut: 'The packet leaves through {oif} towards {dst} ({who}).',
      cOutSnat: 'The other end sees the source {src}, not {old}.',
      cOutDnat: 'The receiver sees the destination {dst}; the sender sent the packet to {old}.',
      cDropped: 'The packet was dropped in {where}. drop is final: no later chain or hook sees it, and the connection is not recorded.',
      cDroppedRoute: 'The packet was dropped at the routing decision, and the connection is not recorded.',
      cDroppedReply: 'The packet was dropped in {where}. drop is final: no later chain or hook sees it. The connection stays recorded; only this packet is lost.',
      explain: '<p>Netfilter hands a packet to the rules at five places, each a hook: <code>prerouting</code> (every ' +
        'packet from a wire, before routing), <code>input</code> (a packet for this machine), <code>forward</code> (a packet ' +
        'passing through), <code>output</code> (a packet made here) and <code>postrouting</code> (every packet leaving). A ' +
        'packet takes one of three paths: to a local address <code>prerouting → input</code>, through the machine ' +
        '<code>prerouting → forward → postrouting</code>, and a local one <code>output → postrouting</code>. The routing ' +
        'decision sits in between.</p>' +
        '<p>Base chains attach to a hook; each chain has a type, a priority and a policy. The chains of one hook run in ' +
        'ascending priority: <code>dstnat</code> −100, <code>filter</code> 0, <code>srcnat</code> 100 (there are also ' +
        '<code>raw</code> −300, <code>mangle</code> −150, <code>security</code> 50). In a chain the first rule that matches ' +
        'decides; if none matches, the chain\'s policy does. <code>accept</code> ends only that chain: the next chain at ' +
        'the same hook and later hooks can still drop the packet. <code>drop</code> is final. This is not one ' +
        '“first match wins” list as in a simple firewall, but a path through hooks.</p>' +
        '<p>Where the address changes: DNAT (destination NAT) in <code>prerouting</code> (and <code>output</code> for ' +
        'local packets, when the route is looked up again), so the routing decision already sees the new destination; SNAT and masquerade in ' +
        '<code>postrouting</code>, so the filter in <code>forward</code> (and everything before <code>srcnat</code>) sees the old source. A port forward therefore needs a rule in ' +
        '<code>forward</code> for the new destination, not a rule in <code>input</code>. With ' +
        '<code>net.ipv4.ip_forward</code> at 0, a packet not for this machine is dropped at the routing decision.</p>' +
        '<p>A <code>nat</code> chain sees only the first packet of a connection. Connection tracking records the ' +
        'connection and its translation, and translates later packets and replies itself, in both directions. A filter ' +
        'lets replies in with <code>ct state established,related accept</code>; that is how a stateful firewall works.</p>' +
        '<p>Common mistakes: “a port forward needs a rule in <code>input</code>” (after DNAT the packet goes through ' +
        '<code>forward</code>); “<code>accept</code> in one chain means the packet is accepted” (a later chain can still ' +
        'drop it); “masquerade changes the source before the filter sees it” (it happens only in ' +
        '<code>postrouting</code>).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
