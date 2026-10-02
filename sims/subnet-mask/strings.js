/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of subnet-mask, in both languages (docs/sim-ui.md §9). Croatian is the original (the URM
   book's fragment podmrezna-maska.html and chapter 8); English is written for simdeck. Croatian terms follow the
   book: podmrežna maska, mrežna adresa, broadcast adresa, mrežni i host dio, bitovno I, zadani pristupnik.
   Terms missing from kit/glossary.js (subnet mask, network address, broadcast address, bitwise AND, default gateway,
   unicast) are written out in both tables; the pairs are listed in NOTES.md. Addresses and bit strings are data,
   not words: the page puts them in translate="no" elements. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Adresa, maska i odredište u binarnom zapisu',
      addr: 'Vlastita adresa',
      prefix: 'Duljina maske (prefiks)',
      dest: 'Odredišna adresa',
      presetBook: 'Primjer iz knjige',
      presetBookHint: '192.168.1.100 s maskom 255.255.255.192, poglavlje 8',
      presetMask28: 'Maska 255.255.255.240',
      presetMask28Hint: 'Koliko upotrebljivih adresa ostaje za hostove?',
      presetFar: 'Odredište 192.168.1.200',
      presetFarHint: 'Je li odredište lokalno ili udaljeno, i zašto?',
      presetInternet: 'Odredište 8.8.8.8',
      presetInternetHint: 'Kome ARP zahtjev traži MAC adresu?',
      presetP2: 'Primjer 2: ista mreža ili druga?',
      presetP2Hint: '192.168.1.10 s maskom 255.255.255.0 i odredište 192.168.2.50',
      presetP6: 'Primjer 6: druga maska',
      presetP6Hint: '192.168.5.77 s maskom 255.255.255.240',
      legendNet: 'mrežni dio',
      legendHost: 'host dio',
      legendDiffer: 'bitovi se razlikuju',
      rowAddr: 'adresa',
      rowMask: 'maska',
      rowNet: 'mrežna adresa',
      rowBc: 'broadcast adresa',
      rowDest: 'odredište',
      rowDestNet: 'odredište I maska',
      partNet: 'mrežni dio',
      partHost: 'host dio',
      hostsBox: ['{h} bit za hostove', '{h} bita za hostove', '{h} bitova za hostove'],
      usable: ['{count} upotrebljiva adresa', '{count} upotrebljive adrese', '{count} upotrebljivih adresa'],
      range: 'od {first} do {last}',
      verdictLocal: 'Isti rezultat: ista mreža',
      verdictRemote: 'Različit rezultat: druga mreža',
      thisHost: 'ovaj uređaj',
      everyone: 'svi na segmentu',
      gateway: 'zadani pristupnik',
      arpAsk: 'Tko ima {who}?',
      arpAskGateway: 'Tko ima adresu zadanog pristupnika?',
      arpAnswer: 'moja MAC adresa',
      arpBroadcast: 'zahtjev, broadcast',
      arpUnicast: 'odgovor, unicast',
      notAssignable: 'ne dodjeljuje se uređaju',
      captionStart: 'Adresa {addr} s maskom {mask} ({p}). Jedinice u maski pokrivaju mrežni dio, nule host dio. ' +
        'Pritisni → za bitovno I.',
      captionNetwork: 'Bitovno I zadržava bit adrese gdje maska ima jedinicu, a briše ga gdje ima nulu: mrežna adresa ' +
        'je {net}. Ona označava samu mrežu.',
      captionBroadcast: 'Isti mrežni dio, a svi host bitovi postavljeni na jedinicu: broadcast adresa {bc}, na kojoj ' +
        'promet primaju svi uređaji u mreži odjednom.',
      ofAll: ['od {count} adrese', 'od {count} adrese', 'od {count} adresa'],
      usableLeft: ['ostaje {count} upotrebljiva adresa', 'ostaju {count} upotrebljive adrese', 'ostaje {count} upotrebljivih adresa'],
      captionHosts: 'Mrežna i broadcast adresa ne dodjeljuju se uređaju, pa {ofAll} {usable}, od {first} do {last}.',
      captionAddrNetwork: 'Pozor: {addr} je upravo mrežna adresa ove mreže, pa se ne smije dodijeliti uređaju.',
      captionAddrBroadcast: 'Pozor: {addr} je upravo broadcast adresa ove mreže, pa se ne smije dodijeliti uređaju.',
      captionDest: 'Istu masku uređaj primijeni i na odredište {dest}: rezultat je {dnet}.',
      captionLocal: '{dnet} = {net}: rezultati se poklapaju, pa je odredište u istoj mreži i paket ide ravno njemu.',
      captionRemote: '{dnet} ≠ {net}: rezultati se razlikuju u označenim bitovima, pa je odredište izvan mreže i paket ' +
        'mora ići preko zadanog pristupnika.',
      captionArpLocal: 'ARP zahtjev ide svima na segmentu (broadcast): „Tko ima {dest}?” Čuju ga svi, a odgovara ' +
        'samo uređaj s tom adresom.',
      captionArpRemote: 'ARP zahtjev ide svima na segmentu, ali traži MAC adresu zadanog pristupnika, ne adresu {dest}: ' +
        'taj zahtjev ne prelazi granicu mreže, pa do odredišta ne bi ni stigao.',
      captionReplyLocal: 'Odgovor stiže samo pošiljatelju (unicast): {dest} šalje svoju MAC adresu, a okvir s paketom ide ' +
        'ravno njemu.',
      captionReplyRemote: 'Odgovor stiže samo pošiljatelju (unicast): pristupnik šalje svoju MAC adresu. Okvir ide ' +
        'pristupniku, a IP paket u njemu i dalje nosi odredišnu adresu {dest}.',
      explain: '<p><em lang="en">Subnet mask</em> (podmrežna maska) drugi je 32-bitni broj uz adresu: jedinice stoje na ' +
        'mjestima koja pripadaju mreži, nule na mjestima koja pripadaju pojedinom uređaju (<em lang="en">host</em> dio). ' +
        'Jedinice su slijeva neprekinute, pa masku opisuje i jedan broj, duljina prefiksa (/26). Granica može pasti ' +
        'usred okteta, pa „usporedi cijele oktete” nije opće pravilo.</p>' +
        '<p>Uređaj masku primijeni bitovnim I (<em lang="en">bitwise AND</em>) i na vlastitu adresu i na odredišnu, pa ' +
        'usporedi rezultate. Ako se poklapaju, odredište je u istoj mreži i ARP traži izravno njegovu MAC adresu. Ako se ' +
        'ne poklapaju, paket izlazi kroz zadani pristupnik (<em lang="en">default gateway</em>), pa ARP traži MAC adresu ' +
        'pristupnika: ARP zahtjev je <em lang="en">broadcast</em> okvir, a on ne prelazi granicu mreže.</p>' +
        '<p><em lang="en">Network address</em> (mrežna adresa, svi host bitovi 0) i <em lang="en">broadcast address</em> ' +
        '(<em lang="en">broadcast</em> adresa, svi host bitovi 1) ne dodjeljuju se uređaju, pa od 2<sup>h</sup> adresa ' +
        'uređajima ostaje 2<sup>h</sup> − 2. Prefiksi /31 i /32 imaju posebna pravila i ovdje se ne prikazuju.</p>'
    },
    en: {
      stage: 'Address, mask and destination in binary',
      addr: 'Own address',
      prefix: 'Mask length (prefix)',
      dest: 'Destination address',
      presetBook: 'The book\'s example',
      presetBookHint: '192.168.1.100 with mask 255.255.255.192, chapter 8',
      presetMask28: 'Mask 255.255.255.240',
      presetMask28Hint: 'How many usable addresses are left for hosts?',
      presetFar: 'Destination 192.168.1.200',
      presetFarHint: 'Is the destination local or remote, and why?',
      presetInternet: 'Destination 8.8.8.8',
      presetInternetHint: 'Whose MAC address does the ARP request ask for?',
      presetP2: 'Example 2: same network or another?',
      presetP2Hint: '192.168.1.10 with mask 255.255.255.0 and destination 192.168.2.50',
      presetP6: 'Example 6: another mask',
      presetP6Hint: '192.168.5.77 with mask 255.255.255.240',
      legendNet: 'network part',
      legendHost: 'host part',
      legendDiffer: 'bits differ',
      rowAddr: 'address',
      rowMask: 'mask',
      rowNet: 'network address',
      rowBc: 'broadcast address',
      rowDest: 'destination',
      rowDestNet: 'destination AND mask',
      partNet: 'network part',
      partHost: 'host part',
      hostsBox: ['{h} bit for hosts', '{h} bits for hosts'],
      usable: ['{count} usable address', '{count} usable addresses'],
      range: 'from {first} to {last}',
      verdictLocal: 'Same result: same network',
      verdictRemote: 'Different result: another network',
      thisHost: 'this host',
      everyone: 'everyone on the segment',
      gateway: 'default gateway',
      arpAsk: 'Who has {who}?',
      arpAskGateway: 'Who has the default gateway\'s address?',
      arpAnswer: 'my MAC address',
      arpBroadcast: 'request, broadcast',
      arpUnicast: 'reply, unicast',
      notAssignable: 'not assigned to a host',
      captionStart: 'Address {addr} with mask {mask} ({p}). The ones in the mask cover the network part, the zeros the ' +
        'host part. Press → for the bitwise AND.',
      captionNetwork: 'Bitwise AND keeps an address bit where the mask has a one and clears it where it has a zero: the ' +
        'network address is {net}. It stands for the network itself.',
      captionBroadcast: 'The same network part with every host bit set to one: the broadcast address {bc}, on which every ' +
        'host in the network receives traffic at once.',
      ofAll: ['of {count} address', 'of {count} addresses'],
      usableLeft: ['{count} usable address is left', '{count} usable addresses are left'],
      captionHosts: 'The network and broadcast addresses are not assigned to hosts, so {ofAll} {usable}, from {first} to {last}.',
      captionAddrNetwork: 'Note: {addr} is the network address of this very network, so it must not be assigned to a host.',
      captionAddrBroadcast: 'Note: {addr} is the broadcast address of this very network, so it must not be assigned to a host.',
      captionDest: 'The host applies the same mask to the destination {dest}: the result is {dnet}.',
      captionLocal: '{dnet} = {net}: the results match, so the destination is in the same network and the packet goes ' +
        'straight to it.',
      captionRemote: '{dnet} ≠ {net}: the results differ in the marked bits, so the destination is outside the network ' +
        'and the packet must go through the default gateway.',
      captionArpLocal: 'The ARP request goes to everyone on the segment (broadcast): “Who has {dest}?” Everyone hears ' +
        'it, and only the host with that address replies.',
      captionArpRemote: 'The ARP request goes to everyone on the segment, but it asks for the default gateway\'s MAC ' +
        'address, not for {dest}: the request does not cross the network boundary, so it would never reach the destination.',
      captionReplyLocal: 'The reply goes to the sender only (unicast): {dest} sends its MAC address, and the frame with ' +
        'the packet goes straight to it.',
      captionReplyRemote: 'The reply goes to the sender only (unicast): the gateway sends its MAC address. The frame goes ' +
        'to the gateway, and the IP packet inside it still carries the destination address {dest}.',
      explain: '<p>A <em>subnet mask</em> is a second 32-bit number that goes with the address: ones in the places that ' +
        'belong to the network, zeros in the places that belong to a single device (the <em>host</em> part). The ones ' +
        'are contiguous from the left, so one number, the prefix length (/26), describes the mask too. The boundary can ' +
        'fall in the middle of an octet, so "compare whole octets" is not a general rule.</p>' +
        '<p>The host applies the mask with a <em>bitwise AND</em> to its own address and to the destination, and ' +
        'compares the results. If they match, the destination is in the same network and ARP asks for its MAC address ' +
        'directly. If not, the packet leaves through the <em>default gateway</em>, so ARP asks for the gateway\'s MAC ' +
        'address: an ARP request is a <em>broadcast</em> frame, and it does not cross the network boundary.</p>' +
        '<p>The <em>network address</em> (every host bit 0) and the <em>broadcast address</em> (every host bit 1) are ' +
        'not assigned to hosts, so of 2<sup>h</sup> addresses 2<sup>h</sup> − 2 are left for hosts. The prefixes /31 ' +
        'and /32 have rules of their own and are not shown here.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
