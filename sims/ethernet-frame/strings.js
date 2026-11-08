/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of ethernet-frame, in both languages (docs/sim-ui.md §9). Same keys in hr and en; {name} is a
   placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term. *word* is an
   English term in italics (the page turns it into <em lang="en">; term pairs not in the glossary yet, NOTES.md).
   The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Ethernet okvir po poljima',
      payload: 'Podaci (paket)',
      type: 'Duljina/tip',
      dst: 'Odredišna adresa',
      flipBit: 'Promijenjeni bit',
      flip: 'Promijeni jedan bit na vodu',
      fix: 'Ukloni pogrešku',
      whyNoFlip: 'Okvir s više od 1500 okteta podataka ne šalje se.',
      whyNoFix: 'Nema pogreške na vodu.',
      opt_ipv4: 'IPv4',
      opt_arp: 'ARP',
      opt_ipv6: 'IPv6',
      opt_unicast: 'jednom uređaju',
      opt_broadcast: 'svima',
      opt_multicast: 'skupini',

      preset_arp_request: 'ARP zahtjev',
      preset_exact_minimum: '46 okteta',
      preset_tcp_ack: 'TCP potvrda',
      preset_full_frame: 'Pun okvir',
      preset_bit_flip: 'Pogrešan bit',
      preset_too_big: '1501 oktet',
      hint_arp_request: '28 okteta svima, tip 0x0806: 18 okteta nadopune, okvir 64 okteta.',
      hint_exact_minimum: '6 + 6 + 2 + 46 + 4 = 64, bez nadopune.',
      hint_tcp_ack: 'IPv4 i TCP bez podataka, 40 okteta: 6 okteta nadopune.',
      hint_full_frame: '1500 okteta podataka: okvir 1518 okteta, na vodu 1526.',
      hint_bit_flip: 'FCS primatelja razlikuje se od poslanog: okvir se odbacuje.',
      hint_too_big: 'Više od 1500 okteta podataka: okvir se ne šalje.',

      legAddr: 'adrese',
      legType: 'duljina/tip',
      legData: 'podaci',
      legPad: 'nadopuna (nule)',
      legFcs: 'FCS (podnožje)',
      legPre: 'preambula i SFD, ne broje se',
      legChanged: 'promijenjeno zadnjom izmjenom',

      f_pre: 'preambula',
      f_sfd: 'SFD',
      f_dst: 'odredište',
      f_src: 'izvor',
      f_type: 'duljina/tip',
      f_data: 'podaci',
      f_pad: 'nadopuna',
      f_fcs: 'FCS',
      in_dst: 'u odredišnoj adresi',
      in_src: 'u izvorišnoj adresi',
      in_type: 'u polju duljina/tip',
      in_data: 'u podacima',
      in_pad: 'u nadopuni',
      size: '{n} B',
      octets: ['{n} oktet', '{n} okteta', '{n} okteta'],
      notCounted: 'ne broji se',
      tag_unicast: 'jednom uređaju',
      tag_multicast: 'skupini',
      tag_broadcast: 'svima',
      typeTag: '≥ 0x0600: tip',
      dataOf_ipv4: 'paket IPv4',
      dataOf_arp: 'poruka ARP',
      dataOf_ipv6: 'paket IPv6',
      zeros: 'nule',
      tooLongTag: 'previše',
      flipTag: 'bit {k}',
      bracketFrame: 'okvir: {n}',
      bracketHeader: 'zaglavlje',
      bracketBody: 'podaci + nadopuna: {n}',
      bracketData: 'podaci: {n}',
      bracketTrailer: 'podnožje',

      meterLabel: 'Duljina okvira',
      meterWire: 'na vodu {n} (s preambulom i SFD-om)',
      meterNotSent: 'ne šalje se',
      mMin: 'najmanje 64',
      mMax: 'najviše 1518',

      pnSender: 'Pošiljatelj',
      pnSenderDo: 'CRC-32 od odredišne adrese do FCS-a',
      pnWire: 'Na vodu',
      pnWireOk: 'nijedan bit nije promijenjen',
      pnWireFlip: 'bit {k} promijenjen {field}',
      pnReceiver: 'Primatelj',
      pnRecompute: 'ponovno računa CRC-32',
      pnMatch: 'jednako: okvir prihvaćen',
      pnMismatch: 'različito: okvir odbačen, pošiljatelj ništa ne saznaje',
      pnRefused: 'Okvir se ne šalje: podataka je više od 1500 okteta.',
      pnRefused2: 'Mrežni sloj mora slati manje pakete.',

      capPad: 'Podaci imaju {data}, pa se dodaje {pad} *padding* (nadopune) da okvir dosegne najmanjih 64 okteta.',
      capNoPad: 'Podaci imaju {data}: okvir ima {frame} bez nadopune, a na vod ide {wire} s preambulom i SFD-om.',
      capFull: 'Podaci imaju 1500 okteta, najviše što osnovni okvir nosi: okvir ima 1518 okteta, na vodu 1526.',
      capOk: 'Primatelj ponovno izračuna CRC-32 i dobije isti {fcs}: okvir je prihvaćen.',
      capFlip: 'Jedan bit promijenjen na vodu: CRC-32 primatelja je {recv} umjesto poslanog {sent}, pa se okvir odbacuje bez obavijesti.',
      capTooLong: 'Podaci imaju {data}, više od najviše dopuštenih 1500 okteta: takav okvir Ethernet ne šalje. Mrežni sloj mora slati manje pakete.',

      explain: '<p>Ethernet [[frame]] nosi paket mrežnog sloja između [[header]] i [[trailer]]. Zaglavlje čine odredišna adresa ' +
        '(6 okteta), izvorišna adresa (6) i polje duljina/tip (2); slijede podaci (46 do 1500 okteta) i ' +
        '<em lang="en">frame check sequence</em> (provjera ispravnosti okvira, FCS, 4 okteta) kao podnožje. Ispred okvira ' +
        'idu <em lang="en">preamble</em> (preambula, 7 okteta) i <em lang="en">start frame delimiter</em> (graničnik početka ' +
        'okvira, SFD, 1 oktet), ali se u duljinu okvira ne broje: ona se broji od odredišne adrese do FCS-a.</p>' +
        '<p>Najmanji okvir ima 6 + 6 + 2 + 46 + 4 = 64 okteta. Paket kraći od 46 okteta dobiva <em lang="en">padding</em> ' +
        '(nadopunu) od nula. Granica potječe iz dijeljenog medija: pošiljatelj mora slati dovoljno dugo da za koliziju sazna ' +
        'prije kraja okvira, pa primatelj okvir kraći od 64 okteta smatra ostatkom kolizije i odbacuje ga. Preambula se u tih ' +
        '64 okteta ne broji.</p>' +
        '<p>Najveći osnovni okvir ima 1518 okteta: granica od 1500 odnosi se na podatke, ne na okvir. Veći paket mrežni sloj ' +
        'mora podijeliti ili poslati manji. „Jumbo” okviri nisu dio norme IEEE 802.3, nego dogovor opreme na oba kraja.</p>' +
        '<p>Vrijednost polja duljina/tip od 0x0600 (1536) naviše je tip sadržaja: 0x0800 IPv4, 0x0806 ARP, 0x86DD IPv6; ' +
        'vrijednost do 1500 bila bi duljina podataka.</p>' +
        '<p>FCS je CRC-32 izračunat od odredišne adrese do kraja nadopune. Primatelj ga računa ponovno; ako se razlikuje, ' +
        'okvir tiho odbacuje i pošiljatelju ništa ne javlja. Ponovno slanje, ako ga ima, pokreće viši sloj.</p>' +
        '<p>Najniži bit prvog okteta odredišne adrese (I/G) govori je li okvir za jedan uređaj (0) ili za skupinu (1); ' +
        'FF-FF-FF-FF-FF-FF je adresa za sve uređaje.</p>'
    },
    en: {
      stage: 'An Ethernet frame, field by field',
      payload: 'Data (the packet)',
      type: 'Length/type',
      dst: 'Destination address',
      flipBit: 'Flipped bit',
      flip: 'Flip one bit in transit',
      fix: 'Clear the error',
      whyNoFlip: 'A frame with more than 1500 octets of data is not sent.',
      whyNoFix: 'There is no error on the wire.',
      opt_ipv4: 'IPv4',
      opt_arp: 'ARP',
      opt_ipv6: 'IPv6',
      opt_unicast: 'one device',
      opt_broadcast: 'everyone',
      opt_multicast: 'a group',

      preset_arp_request: 'ARP request',
      preset_exact_minimum: '46 octets',
      preset_tcp_ack: 'TCP ACK',
      preset_full_frame: 'Full frame',
      preset_bit_flip: 'Flipped bit',
      preset_too_big: '1501 octets',
      hint_arp_request: '28 octets to everyone, type 0x0806: 18 octets of padding, a 64-octet frame.',
      hint_exact_minimum: '6 + 6 + 2 + 46 + 4 = 64, no padding.',
      hint_tcp_ack: 'IPv4 and TCP with no data, 40 octets: 6 octets of padding.',
      hint_full_frame: '1500 octets of data: a 1518-octet frame, 1526 on the wire.',
      hint_bit_flip: 'The receiver\'s FCS differs from the sent one: the frame is dropped.',
      hint_too_big: 'More than 1500 octets of data: the frame is not sent.',

      legAddr: 'addresses',
      legType: 'length/type',
      legData: 'data',
      legPad: 'padding (zeros)',
      legFcs: 'FCS (trailer)',
      legPre: 'preamble and SFD, not counted',
      legChanged: 'changed by the last edit',

      f_pre: 'preamble',
      f_sfd: 'SFD',
      f_dst: 'destination',
      f_src: 'source',
      f_type: 'length/type',
      f_data: 'data',
      f_pad: 'padding',
      f_fcs: 'FCS',
      in_dst: 'in the destination address',
      in_src: 'in the source address',
      in_type: 'in the length/type field',
      in_data: 'in the data',
      in_pad: 'in the padding',
      size: '{n} B',
      octets: ['{n} octet', '{n} octets'],
      notCounted: 'not counted',
      tag_unicast: 'one device',
      tag_multicast: 'group',
      tag_broadcast: 'everyone',
      typeTag: '≥ 0x0600: type',
      dataOf_ipv4: 'IPv4 packet',
      dataOf_arp: 'ARP message',
      dataOf_ipv6: 'IPv6 packet',
      zeros: 'zeros',
      tooLongTag: 'too long',
      flipTag: 'bit {k}',
      bracketFrame: 'frame: {n}',
      bracketHeader: 'header',
      bracketBody: 'data + padding: {n}',
      bracketData: 'data: {n}',
      bracketTrailer: 'trailer',

      meterLabel: 'Frame length',
      meterWire: '{n} on the wire (with preamble and SFD)',
      meterNotSent: 'not sent',
      mMin: 'min 64',
      mMax: 'max 1518',

      pnSender: 'Sender',
      pnSenderDo: 'CRC-32 from the destination address up to the FCS',
      pnWire: 'On the wire',
      pnWireOk: 'no bit changed',
      pnWireFlip: 'bit {k} flipped {field}',
      pnReceiver: 'Receiver',
      pnRecompute: 'recomputes the CRC-32',
      pnMatch: 'equal: frame accepted',
      pnMismatch: 'different: frame dropped, the sender is not told',
      pnRefused: 'The frame is not sent: there are more than 1500 octets of data.',
      pnRefused2: 'The network layer must send smaller packets.',

      capPad: 'The data is {data}, so the sender adds {pad} of padding to bring the frame up to the minimum of 64 octets.',
      capNoPad: 'The data is {data}: the frame is {frame} with no padding, and {wire} go on the wire with the preamble and SFD.',
      capFull: 'The data is 1500 octets, the most a basic frame carries: the frame is 1518 octets, 1526 on the wire.',
      capOk: 'The receiver recomputes the CRC-32 and gets the same {fcs}: the frame is accepted.',
      capFlip: 'One bit flipped on the wire: the receiver\'s CRC-32 is {recv} instead of the sent {sent}, so the frame is dropped without notice.',
      capTooLong: 'The data is {data}, more than the 1500 maximum: Ethernet does not send such a frame. The network layer must send smaller packets.',

      explain: '<p>An Ethernet [[frame]] carries the network layer\'s packet between a header and a trailer. The [[header]] is the ' +
        'destination address (6 octets), the source address (6) and the length/type field (2); then come the data (46 to ' +
        '1500 octets) and the frame check sequence (FCS, 4 octets) as the [[trailer]]. In front of the frame go the preamble ' +
        '(7 octets) and the start frame delimiter (SFD, 1 octet), but they do not count towards the frame length, which is ' +
        'counted from the destination address to the FCS.</p>' +
        '<p>The smallest frame is 6 + 6 + 2 + 46 + 4 = 64 octets. A packet shorter than 46 octets gets padding of zeros. The ' +
        'floor comes from the shared medium: a sender must transmit long enough to hear of a collision before the frame ' +
        'ends, so a receiver treats a frame shorter than 64 octets as the remains of a collision and drops it. The preamble ' +
        'does not count towards those 64.</p>' +
        '<p>The largest basic frame is 1518 octets: the 1500 limit is on the data, not the frame. The network layer must ' +
        'split a bigger packet or send a smaller one. "Jumbo" frames are not part of IEEE 802.3, only an agreement between ' +
        'the equipment at both ends.</p>' +
        '<p>A length/type value of 0x0600 (1536) or more is the type of the contents: 0x0800 IPv4, 0x0806 ARP, 0x86DD IPv6; a ' +
        'value up to 1500 would be the length of the data.</p>' +
        '<p>The FCS is a CRC-32 computed from the destination address to the end of the padding. The receiver computes it ' +
        'again; if it differs, the frame is dropped silently and the sender is not told. A resend, if any, is up to a higher ' +
        'layer.</p>' +
        '<p>The lowest bit of the destination\'s first octet (I/G) says whether the frame is for one device (0) or a group (1); ' +
        'FF-FF-FF-FF-FF-FF is the address of every device.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
