/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the ham radio modes reference, Croatian and English (docs/sim-ui.md §9). Per mode (sim.js
   ids): n_<id> name, s_<id> subtitle, d_<id> description, note_<id> the note under its table, v_<id>_<row> the value
   of a table row whose label is r_<row>. e1_/e2_/e3_<symbol> name the three symbols of an ITU emission class. The
   Croatian follows the original, the English is new; NOTES.md lists what changed. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Amaterski načini rada: kartice i pojedinosti odabranog',
      unitHz: 'Hz', unitKHz: 'kHz', unitMHz: 'MHz',

      filters: 'Filtar',
      f_all: 'Svi', f_voice: 'Govor', f_digi: 'Digitalni', f_image: 'Slika i video', f_weak: 'Slabi signali', f_emg: 'Hitne službe',

      k_analog: 'Analogni', k_digital: 'Digitalni',
      g_voice: 'AM / SSB / CW / FM', g_image: 'Slika i TV', g_weak: 'Slabi signali, VKV+ DX', g_hftext: 'KV tekstualni načini',
      g_vhfdigi: 'VKV/UHF digitalni govor', g_packet: 'Paketi, APRS, mreže i sateliti',

      legendSel: 'odabrano',
      legendOff: 'izvan filtra',
      legendBw: 'širina pojasa (raspon)',
      legendPoint: 'širina pojasa (jedna vrijednost)',

      capHint: 'Kliknite karticu za pojedinosti. Klase emisije prema Pravilniku o radiokomunikacijama ITU-a, Dodatak 1.',
      capFilter: ['{f}: {n} način rada od 27; ostali su prigušeni.', '{f}: {n} načina rada od 27; ostali su prigušeni.', '{f}: {n} načina rada od 27; ostali su prigušeni.'],

      lblClass: 'Klasa emisije',
      lblDesig: 'Puna oznaka',
      desigHint: 'potrebna širina pojasa (slovo stoji umjesto decimalnog zareza) i klasa',
      noClass: 'Klasa emisije nije navedena: ovisi o tome kako se signal šalje.',
      lblBw: 'Širina pojasa',
      noBw: 'nije navedena kao jedan broj',
      bwAxis: 'Širina pojasa svih načina rada, logaritamska skala',
      pos1: 'modulacija nosioca', pos2: 'modulirajući signal', pos3: 'vrsta informacije',

      // ITU RR Appendix 1: first symbol
      e1_N: 'nemodulirani nosilac', e1_A: 'AM, dva bočna pojasa', e1_H: 'AM, jedan bočni pojas, puni nosilac',
      e1_R: 'AM, jedan bočni pojas, smanjeni nosilac', e1_J: 'AM, jedan bočni pojas, potisnuti nosilac',
      e1_B: 'AM, neovisni bočni pojasi', e1_C: 'AM, ostatak bočnog pojasa', e1_F: 'frekvencijska modulacija',
      e1_G: 'fazna modulacija', e1_D: 'amplitudna i kutna modulacija', e1_P: 'niz nemoduliranih impulsa',
      e1_K: 'impulsi modulirani amplitudom', e1_L: 'impulsi modulirani širinom', e1_M: 'impulsi modulirani položajem',
      e1_Q: 'impulsi s kutnom modulacijom nosioca', e1_V: 'kombinacija impulsnih modulacija', e1_W: 'kombinacija načina',
      e1_X: 'ostalo',
      // second symbol
      e2_0: 'bez modulirajućeg signala', e2_1: 'digitalni, bez podnosioca', e2_2: 'digitalni, s podnosiocem',
      e2_3: 'analogni, jedan kanal', e2_7: 'digitalni, više kanala', e2_8: 'analogni, više kanala',
      e2_9: 'analogni i digitalni zajedno', e2_X: 'ostalo',
      // third symbol
      e3_N: 'bez informacije', e3_A: 'telegrafija na sluh', e3_B: 'telegrafija za automatski prijam', e3_C: 'faksimil',
      e3_D: 'podaci, telemetrija, daljinsko upravljanje', e3_E: 'telefonija (govor)', e3_F: 'televizija (video)',
      e3_W: 'kombinacija', e3_X: 'ostalo',

      // table row labels
      r_bands: 'Opsezi', r_gain: 'Prednost u S/N', r_pol: 'Polarizacija', r_index: 'Indeks modulacije',
      r_eff: 'Učinkovitost', r_speed: 'Brzina', r_dev: 'Devijacija', r_spacing: 'Razmak kanala',
      r_offset: 'Pomak repetitora', r_related: 'Srodne klase', r_use: 'Primjena', r_time: 'Trajanje slike',
      r_res: 'Razlučivost', r_lpm: 'Linija u minuti', r_tones: 'Tonovi', r_mod: 'Modulacija', r_snr: 'Prag S/N',
      r_slot: 'Slot', r_sync: 'Sinkronizacija', r_msg: 'Poruka', r_jt65bw: 'Širina JT65', r_jt9bw: 'Širina JT9',
      r_cycle: 'Ciklus', r_fec: 'FEC', r_coding: 'Kodiranje', r_psk31bw: 'Širina PSK31', r_psk63bw: 'Širina PSK63',
      r_popular: 'Popularna inačica', r_funcs: 'Funkcije', r_thor22bw: 'Širina THOR22', r_pactorbw: 'Širina PACTOR IV',
      r_ofdmbw: 'Širina OFDM modema', r_transport: 'Prijenos', r_proto: 'Protokol', r_vocoder: 'Vokoder',
      r_dd: 'Kanal DD', r_slowdata: 'Spori podaci', r_routing: 'Usmjeravanje', r_tier2: 'Tier II', r_tier3: 'Tier III',
      r_vw: 'Način VW', r_ph1: 'Phase 1', r_ph2: 'Phase 2', r_freq: 'Frekvencije', r_r1200: '1200 Bd', r_r9600: '9600 Bd',
      r_frame: 'Okvir', r_std: 'Standard', r_codec: 'Kodek', r_qo100wb: 'QO-100, široki pojas', r_sr: 'Brzina simbola',
      r_sf: 'Raspon SF', r_payload: 'Najveći teret', r_qo100nb: 'QO-100, uski pojas', r_transponder: 'Širina transpondera',
      r_doppler: 'Dopplerov pomak (LEO)',

      // ── analog: AM / SSB / CW / FM ──
      n_ssb: 'SSB', s_ssb: 'jedan bočni pojas (USB/LSB)',
      d_ssb: 'Glavni način rada za KV DX veze. Nosilac i drugi bočni pojas su potisnuti, pa sva snaga ide u korisni signal. Iznad 10 MHz USB, ispod LSB.',
      v_ssb_bands: '80/40/20/15/10 m', v_ssb_gain: '+9 dB u odnosu na AM', v_ssb_pol: 'horizontalna (DX)',
      note_ssb: 'Zahtijeva sinkronu demodulaciju: prijamnik sam dodaje nosilac (BFO), a fino se ugađa clarifierom (RIT).',

      n_am: 'AM', s_am: 'dva bočna pojasa s nosiocem',
      d_am: 'Nosilac i oba bočna pojasa. Poseban interes: AM frekvencije (3885, 7290 kHz) i ljubitelji stare opreme. Jednostavna demodulacija.',
      v_am_index: 'm ≤ 1 (100 %)', v_am_eff: '≤ 33 % (nosilac nosi 2/3 snage)',

      n_cw: 'CW', s_cw: 'Morseova abeceda',
      d_cw: 'Najuža emisija, iznimno probojna. Nosilac se uključuje i isključuje (OOK); filtar 250–500 Hz. QRP DX do 5 W. Prednost na rubovima opsega.',
      v_cw_gain: '~15 dB u odnosu na SSB', v_cw_speed: '5–50+ WPM (PARIS)',
      note_cw: 'QSK (puni break-in) za natjecanja; elektronički taster i paddle za ravnomjerne znakove.',

      n_fm: 'FM', s_fm: 'uskopojasni FM (NFM)',
      d_fm: 'Standard na VKV-u i UHF-u. NFM (devijacija ±5 kHz) za repetitore. Pristupni tonovi CTCSS/DCS otvaraju squelch repetitora.',
      v_fm_dev: '±2,5–5 kHz (NFM)', v_fm_spacing: '12,5 / 25 kHz', v_fm_offset: '−600 kHz (2 m), −7,6 MHz (70 cm, Regija 1)',

      n_isb: 'DSB / ISB', s_isb: 'neovisni bočni pojasi',
      d_isb: 'ISB: dva neovisna kanala na istom nosiocu, po jedan u svakom bočnom pojasu. Profesionalne KV veze i linijski multipleks; kod amatera rijetko.',
      v_isb_related: 'H3E (SSB, puni nosilac), R3E (SSB, smanjeni nosilac)', v_isb_use: 'H3E može demodulirati i obični AM prijamnik',

      // ── analog: image and TV ──
      n_sstv: 'SSTV', s_sstv: 'televizija sporog skeniranja',
      d_sstv: 'Analogna slika kroz SSB kanal: svjetlina je frekvencija tona (1500–2300 Hz). Načini Martin M1/M2, Scottie S1/S2, Robot 36/72.',
      v_sstv_time: '36–128 s', v_sstv_res: '320 × 240 / 160 × 120',

      n_atv: 'ATV', s_atv: 'brzo skeniranje, analogna televizija',
      d_atv: 'Puni video (PAL/NTSC) na 70 cm i višim opsezima: AM s ostatkom bočnog pojasa (VSB) za sliku i FM za zvuk, ili sve u FM-u. Treba širok spektar.',
      v_atv_bands: '70 cm, 33 cm (Regija 2), 23 cm',

      n_fax: 'WEFAX / KV faks', s_fax: 'radiofaks',
      d_fax: 'Meteorološki faks i pomorske karte. Indeks suradnje (IOC) 576, 120 linija u minuti. Frekvencijski modulirana slika kroz SSB kanal.',
      v_fax_lpm: '60–240', v_fax_tones: '1500 Hz crno, 2300 Hz bijelo',

      // ── digital: weak signal ──
      n_ft8: 'FT8', s_ft8: '8-GFSK, slotovi od 15 s',
      d_ft8: 'Strukturirana poruka od 77 bita u slotovima od 15 s. Prag S/N −20 dB. Od 2017. prevladava u KV DX-u. FEC s LDPC kodom.',
      v_ft8_mod: '8-GFSK', v_ft8_snr: '−20 dB (šum u 2,5 kHz)', v_ft8_slot: '15 s, od toga 12,6 s odašiljanja',
      v_ft8_sync: 'sat točan na ±1 s (GPS ili mrežno vrijeme)', v_ft8_msg: '77 bita + 14-bitni CRC + LDPC',
      note_ft8: 'FT4: slotovi od 7,5 s za natjecanja. MSK144: meteorski odraz (meteor scatter).',

      n_jt65: 'JT65 / JT9', s_jt65: 'dugi ciklusi, vrlo slabi signali',
      d_jt65: 'JT65: 65 tonova (FSK), ciklus od 1 min, prag −25 dB; standard za EME na VKV-u i UHF-u. JT9: uži, 16 Hz, uglavnom KV. Reed-Solomon FEC.',
      v_jt65_jt65bw: '178 Hz (65 tonova × 2,69 Hz)', v_jt65_jt9bw: '16 Hz', v_jt65_snr: '−25 dB (JT65A)', v_jt65_cycle: '60 s',
      v_jt65_fec: 'Reed-Solomon (63,12)',

      n_wspr: 'WSPR', s_wspr: 'svjetionik za mapiranje propagacije',
      d_wspr: '4-FSK svjetionik za mapiranje propagacije, ciklus od 2 min. Prijemi se skupljaju u javnoj bazi na internetu. QRP (200 mW).',
      v_wspr_snr: '−28 dB', v_wspr_msg: 'pozivni znak + lokator (Maidenhead) + snaga u dBm', v_wspr_cycle: '2 min',

      // ── digital: HF text ──
      n_rtty: 'RTTY', s_rtty: 'radioteleprinter, FSK',
      d_rtty: 'Kod Baudot ITA-2, 45,45 Bd, pomak 170 Hz. Aktivan na natjecanjima. Modulacija AFSK ili FSK.',
      v_rtty_speed: '45,45 / 75 / 100 Bd', v_rtty_coding: '5-bitni Baudot ITA-2', v_rtty_fec: 'bez FEC-a',

      n_psk: 'PSK31 / PSK63', s_psk: 'fazna modulacija',
      d_psk: 'BPSK ili QPSK s kodom Varicode. Usko: 31 Hz. Veza se bira na vodopadu; tekstualna simpleks veza na 31,25 Bd.',
      v_psk_psk31bw: '31 Hz', v_psk_psk63bw: '63 Hz', v_psk_mod: 'BPSK / QPSK', v_psk_coding: 'Varicode (ASCII)',

      n_olivia: 'Olivia / Contestia', s_olivia: 'MFSK s jakim FEC-om',
      d_olivia: 'MFSK s Walsh-Hadamardovim FEC kodom. Inačice od 4 do 32 tona, široke 125–2000 Hz. Otporan na feding (QSB). Contestia je brža inačica.',
      v_olivia_fec: 'Walsh-Hadamard', v_olivia_popular: 'Olivia 8/500',

      n_js8: 'JS8', s_js8: 'izveden iz FT8, slobodan tekst',
      d_js8: 'FT8 kao prijenosni sloj za slobodan tekst. Pohrani i proslijedi: poruke putuju preko drugih stanica. KV mreža za hitne slučajeve bez interneta.',
      v_js8_snr: '−24 dB', v_js8_funcs: 'prosljeđivanje, grupne i usmjerene poruke', v_js8_use: 'mreža pohrani-i-proslijedi',

      n_thor: 'THOR / THROB', s_thor: 'inkrementalni MFSK',
      d_thor: 'Podatak je razlika između uzastopnih tonova (IFK), pa signal podnosi pomak frekvencije i drift. Inačice THOR11, THOR22 i druge. Otporan na selektivni feding.',
      v_thor_thor22bw: '500 Hz', v_thor_speed: '~22 WPM', v_thor_tones: '18 (inkrementalni FSK)',

      n_email: 'Radio e-pošta', s_email: 'KV/VKV, pohrani i proslijedi',
      d_email: 'E-pošta preko KV ili VKV veze do pristupne stanice spojene na internet; na KV-u PACTOR ili OFDM modem. Svjetska mreža pristupnih stanica; pomorstvo i hitni slučajevi.',
      v_email_pactorbw: '2,2 kHz', v_email_ofdmbw: '500 Hz / 2,3 kHz', v_email_transport: 'AX.25 na VKV-u; PACTOR ili OFDM na KV-u',
      v_email_proto: 'B2F (prosljeđivanje poruka)',

      // ── digital: VHF/UHF voice ──
      n_dstar: 'D-STAR', s_dstar: 'digitalni govor i podaci, standard JARL-a',
      d_dstar: 'GMSK, vokoder AMBE (3,6 kbit/s s FEC-om), kanal 6,25 kHz. Način DD za IP podatke (128 kbit/s na 23 cm). Usmjeravanje po pozivnom znaku; reflektori povezuju repetitore preko interneta.',
      v_dstar_mod: 'GMSK (BT = 0,5)', v_dstar_vocoder: 'AMBE (2,4 kbit/s govor + 1,2 kbit/s FEC)', v_dstar_dd: '~150 kHz (23 cm, 128 kbit/s)',
      v_dstar_slowdata: '1200 bit/s uz govor (DV)', v_dstar_routing: 'po pozivnom znaku (UR/RPT)',

      n_dmr: 'DMR', s_dmr: 'Digital Mobile Radio, ETSI TS 102 361',
      d_dmr: 'TDMA s dva slota u kanalu od 12,5 kHz. Vokoder AMBE+2. Talkgrupe na povezanim mrežama repetitora; u Hrvatskoj (9A) aktivna mreža.',
      v_dmr_mod: '4FSK', v_dmr_slot: '2 × 30 ms u okviru od 60 ms', v_dmr_vocoder: 'AMBE+2 (3,6 kbit/s)',
      v_dmr_tier2: 'izravno i preko repetitora', v_dmr_tier3: 'trunking',

      n_c4fm: 'C4FM', s_c4fm: 'četverorazinski FM, FDMA',
      d_c4fm: '4FSK u FDMA kanalu. Sam prepoznaje je li signal digitalni ili analogni FM. Vokoder AMBE+2. Repetitori se povezuju preko interneta.',
      v_c4fm_mod: '4FSK (±1,8 / ±0,6 kHz)', v_c4fm_vocoder: 'AMBE+2', v_c4fm_vw: 'govor pune kvalitete, cijeli kanal bez podataka',

      n_p25: 'P25 (APCO-25)', s_p25: 'Phase 1 / Phase 2',
      d_p25: 'Američki standard javne sigurnosti; amateri ga koriste eksperimentalno. Vokoder IMBE/AMBE, C4FM/CQPSK. Phase 2: TDMA, učinkovitost kanala od 6,25 kHz.',
      v_p25_ph1: 'C4FM / CQPSK', v_p25_ph2: 'TDMA, H-DQPSK', v_p25_vocoder: 'IMBE / AMBE+2',

      // ── digital: packet, APRS, networks and satellites ──
      n_aprs: 'APRS', s_aprs: 'automatsko javljanje paketima',
      d_aprs: 'AX.25 na 1200 Bd (AFSK) na 144,800 MHz u Europi. Praćenje položaja (GPS), meteorološke stanice, telemetrija. Pristupnici prema internetu.',
      v_aprs_mod: 'AFSK 1200 / 2200 Hz', v_aprs_speed: '1200 Bd', v_aprs_proto: 'AX.25, UI okvir', v_aprs_freq: '144,800 MHz (EU)',
      note_aprs: 'Za telemetriju male brzine APRS radi i preko LoRe.',

      n_packet: 'Packet radio', s_packet: 'AX.25 / TNC',
      d_packet: 'AX.25, protokol drugog sloja: 1200 Bd AFSK ili 9600 Bd FSK (G3RUH). BBS mreže i povezivanje čvorova. Temelj APRS-a i VKV pristupa radio e-pošti.',
      v_packet_r1200: 'Bell 202 AFSK', v_packet_r9600: 'G3RUH, filtrirani FSK', v_packet_frame: 'AX.25 u HDLC okviru',

      n_ipnet: 'HAMNET / mesh', s_ipnet: 'amaterske IP mreže',
      d_ipnet: 'Mreže izvedene iz 802.11 na amaterskim mikrovalnim frekvencijama. Usmjeravanje OLSR u mesh mrežama. VoIP, video, IP telemetrija.',
      v_ipnet_freq: '2,4 / 5,7 GHz (Regija 1); 900 MHz samo u Regiji 2', v_ipnet_routing: 'OLSR (mesh)',
      note_ipnet: 'NPR (New Packet Radio) nosi IP na 70 cm: sporije, ali dalje.',

      n_datv: 'DATV / DVB-S', s_datv: 'digitalna amaterska TV',
      d_datv: 'Video DVB-S/S2 (H.264) na 23 cm i višim opsezima. Jeftin SDR kao odašiljač. Širokopojasni transponder satelita QO-100.',
      v_datv_std: 'DVB-S / DVB-S2', v_datv_codec: 'H.264 / H.265', v_datv_qo100wb: '2401,5–2409,5 MHz gore, 10491–10499 MHz dolje',
      v_datv_sr: '333 kS/s – 4 MS/s',

      n_lora: 'LoRa', s_lora: 'telemetrija raspršenim spektrom',
      d_lora: 'CSS (chirp spread spectrum) na 433/868 MHz. SF7–SF12, širina 125/250/500 kHz. APRS preko LoRe za telemetriju; mesh mreže bez središta.',
      v_lora_mod: 'CSS (chirp)', v_lora_sf: 'SF7 (brzo) → SF12 (domet)', v_lora_payload: '255 bajtova po paketu', v_lora_snr: 'do −20 dB (SF12)',

      n_sat: 'Satelitske veze', s_sat: 'LEO / GEO: QO-100, FO-29 …',
      d_sat: 'Linearni transponderi (SSB/CW) na satelitima u niskoj orbiti. QO-100 je geostacionaran: uskopojasni SSB transponder i širokopojasni DATV transponder.',
      v_sat_qo100nb: '2400 MHz gore, 10489 MHz dolje', v_sat_transponder: '250 kHz (uski, linearni)',
      v_sat_doppler: 'do ±{d2} kHz (2 m), ±{d70} kHz (70 cm)'
    },

    en: {
      stage: 'Amateur radio modes: cards and the details of the selected one',
      unitHz: 'Hz', unitKHz: 'kHz', unitMHz: 'MHz',

      filters: 'Filter',
      f_all: 'All', f_voice: 'Voice', f_digi: 'Digital', f_image: 'Image and video', f_weak: 'Weak signal', f_emg: 'Emergency',

      k_analog: 'Analog', k_digital: 'Digital',
      g_voice: 'AM / SSB / CW / FM', g_image: 'Image and TV', g_weak: 'Weak signal, VHF+ DX', g_hftext: 'HF text modes',
      g_vhfdigi: 'VHF/UHF digital voice', g_packet: 'Packet, APRS, networks and satellites',

      legendSel: 'selected',
      legendOff: 'outside the filter',
      legendBw: 'bandwidth (range)',
      legendPoint: 'bandwidth (one value)',

      capHint: 'Click a card for details. Emission classes after the ITU Radio Regulations, Appendix 1.',
      capFilter: ['{f}: {n} mode of 27; the others are dimmed.', '{f}: {n} modes of 27; the others are dimmed.'],

      lblClass: 'Emission class',
      lblDesig: 'Full designation',
      desigHint: 'necessary bandwidth (the letter stands for the decimal point) and the class',
      noClass: 'No emission class given: it depends on how the signal is sent.',
      lblBw: 'Bandwidth',
      noBw: 'not given as one number',
      bwAxis: 'Bandwidth of every mode, log scale',
      pos1: 'carrier modulation', pos2: 'modulating signal', pos3: 'type of information',

      e1_N: 'unmodulated carrier', e1_A: 'AM, double sideband', e1_H: 'AM, single sideband, full carrier',
      e1_R: 'AM, single sideband, reduced carrier', e1_J: 'AM, single sideband, suppressed carrier',
      e1_B: 'AM, independent sidebands', e1_C: 'AM, vestigial sideband', e1_F: 'frequency modulation',
      e1_G: 'phase modulation', e1_D: 'amplitude and angle modulation', e1_P: 'unmodulated pulses',
      e1_K: 'pulses modulated in amplitude', e1_L: 'pulses modulated in width', e1_M: 'pulses modulated in position',
      e1_Q: 'pulses, carrier angle-modulated', e1_V: 'a combination of pulse modulations', e1_W: 'a combination of modes',
      e1_X: 'other',
      e2_0: 'no modulating signal', e2_1: 'digital, no subcarrier', e2_2: 'digital, with a subcarrier',
      e2_3: 'analog, one channel', e2_7: 'digital, several channels', e2_8: 'analog, several channels',
      e2_9: 'analog and digital combined', e2_X: 'other',
      e3_N: 'no information', e3_A: 'telegraphy, by ear', e3_B: 'telegraphy, automatic reception', e3_C: 'facsimile',
      e3_D: 'data, telemetry, telecommand', e3_E: 'telephony (voice)', e3_F: 'television (video)',
      e3_W: 'a combination', e3_X: 'other',

      r_bands: 'Bands', r_gain: 'S/N advantage', r_pol: 'Polarization', r_index: 'Modulation index',
      r_eff: 'Efficiency', r_speed: 'Speed', r_dev: 'Deviation', r_spacing: 'Channel spacing',
      r_offset: 'Repeater offset', r_related: 'Related classes', r_use: 'Use', r_time: 'Time per picture',
      r_res: 'Resolution', r_lpm: 'Lines per minute', r_tones: 'Tones', r_mod: 'Modulation', r_snr: 'S/N threshold',
      r_slot: 'Slot', r_sync: 'Sync', r_msg: 'Message', r_jt65bw: 'JT65 width', r_jt9bw: 'JT9 width',
      r_cycle: 'Cycle', r_fec: 'FEC', r_coding: 'Coding', r_psk31bw: 'PSK31 width', r_psk63bw: 'PSK63 width',
      r_popular: 'Popular variant', r_funcs: 'Functions', r_thor22bw: 'THOR22 width', r_pactorbw: 'PACTOR IV width',
      r_ofdmbw: 'OFDM modem width', r_transport: 'Transport', r_proto: 'Protocol', r_vocoder: 'Vocoder',
      r_dd: 'DD channel', r_slowdata: 'Slow data', r_routing: 'Routing', r_tier2: 'Tier II', r_tier3: 'Tier III',
      r_vw: 'VW mode', r_ph1: 'Phase 1', r_ph2: 'Phase 2', r_freq: 'Frequencies', r_r1200: '1200 Bd', r_r9600: '9600 Bd',
      r_frame: 'Frame', r_std: 'Standard', r_codec: 'Codec', r_qo100wb: 'QO-100 wideband', r_sr: 'Symbol rate',
      r_sf: 'SF range', r_payload: 'Max payload', r_qo100nb: 'QO-100 narrowband', r_transponder: 'Transponder width',
      r_doppler: 'Doppler shift (LEO)',

      n_ssb: 'SSB', s_ssb: 'single sideband (USB/LSB)',
      d_ssb: 'The main mode for HF DX contacts. The carrier and the other sideband are suppressed, so all the power goes into the useful signal. USB above 10 MHz, LSB below.',
      v_ssb_bands: '80/40/20/15/10 m', v_ssb_gain: '+9 dB over AM', v_ssb_pol: 'horizontal (DX)',
      note_ssb: 'Needs synchronous demodulation: the receiver adds the carrier itself (BFO); fine tuning uses the clarifier (RIT).',

      n_am: 'AM', s_am: 'double sideband with carrier',
      d_am: 'The carrier and both sidebands. A special interest: AM frequencies (3885, 7290 kHz) and vintage equipment. Simple demodulation.',
      v_am_index: 'm ≤ 1 (100%)', v_am_eff: '≤ 33% (the carrier takes 2/3 of the power)',

      n_cw: 'CW', s_cw: 'Morse code',
      d_cw: 'The narrowest emission; it gets through where others fail. The carrier is keyed on and off (OOK); a 250–500 Hz filter. QRP DX at up to 5 W. Priority at the band edges.',
      v_cw_gain: '~15 dB over SSB', v_cw_speed: '5–50+ WPM (PARIS)',
      note_cw: 'QSK (full break-in) for contests; an electronic keyer and paddle for even characters.',

      n_fm: 'FM', s_fm: 'narrowband FM (NFM)',
      d_fm: 'The VHF/UHF standard. NFM (±5 kHz deviation) for repeaters. CTCSS/DCS access tones open the repeater squelch.',
      v_fm_dev: '±2.5–5 kHz (NFM)', v_fm_spacing: '12.5 / 25 kHz', v_fm_offset: '−600 kHz (2 m), −7.6 MHz (70 cm, Region 1)',

      n_isb: 'DSB / ISB', s_isb: 'independent sidebands',
      d_isb: 'ISB: two independent channels on one carrier, one in each sideband. Professional HF links and line multiplexing; rare among amateurs.',
      v_isb_related: 'H3E (SSB, full carrier), R3E (SSB, reduced carrier)', v_isb_use: 'an ordinary AM receiver can demodulate H3E',

      n_sstv: 'SSTV', s_sstv: 'slow-scan television',
      d_sstv: 'An analog picture through an SSB channel: brightness is the tone frequency (1500–2300 Hz). Modes Martin M1/M2, Scottie S1/S2, Robot 36/72.',
      v_sstv_time: '36–128 s', v_sstv_res: '320 × 240 / 160 × 120',

      n_atv: 'ATV', s_atv: 'fast-scan analog television',
      d_atv: 'Full video (PAL/NTSC) on 70 cm and higher bands: AM with a vestigial sideband (VSB) for the picture and FM for the sound, or all in FM. Needs a wide spectrum.',
      v_atv_bands: '70 cm, 33 cm (Region 2), 23 cm',

      n_fax: 'WEFAX / HF fax', s_fax: 'radiofax',
      d_fax: 'Weather fax and nautical charts. Index of cooperation (IOC) 576, 120 lines per minute. A frequency-modulated picture through an SSB channel.',
      v_fax_lpm: '60–240', v_fax_tones: '1500 Hz black, 2300 Hz white',

      n_ft8: 'FT8', s_ft8: '8-GFSK, 15 s slots',
      d_ft8: 'A structured 77-bit message in 15 s slots. S/N threshold −20 dB. Dominant in HF DX since 2017. LDPC FEC.',
      v_ft8_mod: '8-GFSK', v_ft8_snr: '−20 dB (noise in 2.5 kHz)', v_ft8_slot: '15 s, 12.6 s of it transmitting',
      v_ft8_sync: 'clock within ±1 s (GPS or network time)', v_ft8_msg: '77 bits + 14-bit CRC + LDPC',
      note_ft8: 'FT4: 7.5 s slots for contests. MSK144: meteor scatter.',

      n_jt65: 'JT65 / JT9', s_jt65: 'long cycles, very weak signals',
      d_jt65: 'JT65: 65 tones (FSK), 1 min cycle, −25 dB threshold; the EME standard on VHF and UHF. JT9: narrower, 16 Hz, mostly HF. Reed-Solomon FEC.',
      v_jt65_jt65bw: '178 Hz (65 tones × 2.69 Hz)', v_jt65_jt9bw: '16 Hz', v_jt65_snr: '−25 dB (JT65A)', v_jt65_cycle: '60 s',
      v_jt65_fec: 'Reed-Solomon (63,12)',

      n_wspr: 'WSPR', s_wspr: 'a beacon for propagation mapping',
      d_wspr: 'A 4-FSK beacon for propagation mapping, 2 min cycle. Receptions are collected in a public database on the internet. QRP (200 mW).',
      v_wspr_snr: '−28 dB', v_wspr_msg: 'callsign + locator (Maidenhead) + power in dBm', v_wspr_cycle: '2 min',

      n_rtty: 'RTTY', s_rtty: 'radioteletype, FSK',
      d_rtty: 'Baudot ITA-2 code, 45.45 Bd, 170 Hz shift. Active in contests. AFSK or FSK modulation.',
      v_rtty_speed: '45.45 / 75 / 100 Bd', v_rtty_coding: '5-bit Baudot ITA-2', v_rtty_fec: 'none',

      n_psk: 'PSK31 / PSK63', s_psk: 'phase-shift keying',
      d_psk: 'BPSK or QPSK with Varicode. Narrow: 31 Hz. Contacts are picked off the waterfall; a 31.25 Bd simplex text link.',
      v_psk_psk31bw: '31 Hz', v_psk_psk63bw: '63 Hz', v_psk_mod: 'BPSK / QPSK', v_psk_coding: 'Varicode (ASCII)',

      n_olivia: 'Olivia / Contestia', s_olivia: 'MFSK with strong FEC',
      d_olivia: 'MFSK with a Walsh–Hadamard FEC code. Variants of 4 to 32 tones, 125–2000 Hz wide. Robust against fading (QSB). Contestia is a faster variant.',
      v_olivia_fec: 'Walsh–Hadamard', v_olivia_popular: 'Olivia 8/500',

      n_js8: 'JS8', s_js8: 'derived from FT8, free text',
      d_js8: 'FT8 as a transport layer for free text. Store and forward: messages travel through other stations. An HF emergency network without the internet.',
      v_js8_snr: '−24 dB', v_js8_funcs: 'relay, group and directed messages', v_js8_use: 'store-and-forward network',

      n_thor: 'THOR / THROB', s_thor: 'incremental MFSK',
      d_thor: 'The data is the step between successive tones (IFK), so the signal tolerates frequency offset and drift. Variants THOR11, THOR22 and others. Robust against selective fading.',
      v_thor_thor22bw: '500 Hz', v_thor_speed: '~22 WPM', v_thor_tones: '18 (incremental FSK)',

      n_email: 'Radio email', s_email: 'HF/VHF, store and forward',
      d_email: 'Email over an HF or VHF link to a gateway station on the internet; on HF a PACTOR or OFDM modem. A worldwide network of gateway stations; maritime and emergency use.',
      v_email_pactorbw: '2.2 kHz', v_email_ofdmbw: '500 Hz / 2.3 kHz', v_email_transport: 'AX.25 on VHF; PACTOR or OFDM on HF',
      v_email_proto: 'B2F (message forwarding)',

      n_dstar: 'D-STAR', s_dstar: 'digital voice and data, a JARL standard',
      d_dstar: 'GMSK, AMBE vocoder (3.6 kbit/s with FEC), 6.25 kHz channel. DD mode for IP data (128 kbit/s on 23 cm). Routing by callsign; reflectors link repeaters over the internet.',
      v_dstar_mod: 'GMSK (BT = 0.5)', v_dstar_vocoder: 'AMBE (2.4 kbit/s voice + 1.2 kbit/s FEC)', v_dstar_dd: '~150 kHz (23 cm, 128 kbit/s)',
      v_dstar_slowdata: '1200 bit/s alongside voice (DV)', v_dstar_routing: 'by callsign (UR/RPT)',

      n_dmr: 'DMR', s_dmr: 'Digital Mobile Radio, ETSI TS 102 361',
      d_dmr: 'TDMA with two slots in a 12.5 kHz channel. AMBE+2 vocoder. Talkgroups on linked repeater networks; an active network in Croatia (9A).',
      v_dmr_mod: '4FSK', v_dmr_slot: '2 × 30 ms in a 60 ms frame', v_dmr_vocoder: 'AMBE+2 (3.6 kbit/s)',
      v_dmr_tier2: 'direct and via repeater', v_dmr_tier3: 'trunking',

      n_c4fm: 'C4FM', s_c4fm: 'four-level FM, FDMA',
      d_c4fm: '4FSK in an FDMA channel. Tells digital from analog FM by itself. AMBE+2 vocoder. Repeaters are linked over the internet.',
      v_c4fm_mod: '4FSK (±1.8 / ±0.6 kHz)', v_c4fm_vocoder: 'AMBE+2', v_c4fm_vw: 'full-quality voice, the whole channel without data',

      n_p25: 'P25 (APCO-25)', s_p25: 'Phase 1 / Phase 2',
      d_p25: 'A US public-safety standard; amateurs use it experimentally. IMBE/AMBE vocoder, C4FM/CQPSK. Phase 2: TDMA, 6.25 kHz channel efficiency.',
      v_p25_ph1: 'C4FM / CQPSK', v_p25_ph2: 'TDMA, H-DQPSK', v_p25_vocoder: 'IMBE / AMBE+2',

      n_aprs: 'APRS', s_aprs: 'Automatic Packet Reporting System',
      d_aprs: 'AX.25 at 1200 Bd (AFSK) on 144.800 MHz in Europe. Position tracking (GPS), weather stations, telemetry. Gateways to the internet.',
      v_aprs_mod: 'AFSK 1200 / 2200 Hz', v_aprs_speed: '1200 Bd', v_aprs_proto: 'AX.25 UI frame', v_aprs_freq: '144.800 MHz (EU)',
      note_aprs: 'For low-rate telemetry APRS also runs over LoRa.',

      n_packet: 'Packet radio', s_packet: 'AX.25 / TNC',
      d_packet: 'AX.25, a layer-2 protocol: 1200 Bd AFSK or 9600 Bd FSK (G3RUH). BBS networks and node linking. The base of APRS and of VHF access to radio email.',
      v_packet_r1200: 'Bell 202 AFSK', v_packet_r9600: 'G3RUH, filtered FSK', v_packet_frame: 'AX.25 in an HDLC frame',

      n_ipnet: 'HAMNET / mesh', s_ipnet: 'amateur IP networks',
      d_ipnet: 'Networks derived from 802.11 on amateur microwave frequencies. OLSR routing in mesh networks. VoIP, video, IP telemetry.',
      v_ipnet_freq: '2.4 / 5.7 GHz (Region 1); 900 MHz only in Region 2', v_ipnet_routing: 'OLSR (mesh)',
      note_ipnet: 'NPR (New Packet Radio) carries IP on 70 cm: slower, but further.',

      n_datv: 'DATV / DVB-S', s_datv: 'digital amateur TV',
      d_datv: 'DVB-S/S2 video (H.264) on 23 cm and higher bands. A low-cost SDR as the transmitter. The wideband transponder of the QO-100 satellite.',
      v_datv_std: 'DVB-S / DVB-S2', v_datv_codec: 'H.264 / H.265', v_datv_qo100wb: '2401.5–2409.5 MHz up, 10491–10499 MHz down',
      v_datv_sr: '333 kS/s – 4 MS/s',

      n_lora: 'LoRa', s_lora: 'spread-spectrum telemetry',
      d_lora: 'CSS (chirp spread spectrum) on 433/868 MHz. SF7–SF12, 125/250/500 kHz wide. APRS over LoRa for telemetry; mesh networks without a centre.',
      v_lora_mod: 'CSS (chirp)', v_lora_sf: 'SF7 (fast) → SF12 (range)', v_lora_payload: '255 bytes per packet', v_lora_snr: 'down to −20 dB (SF12)',

      n_sat: 'Satellite links', s_sat: 'LEO / GEO: QO-100, FO-29 …',
      d_sat: 'Linear transponders (SSB/CW) on low-orbit satellites. QO-100 is geostationary: a narrowband SSB transponder and a wideband DATV transponder.',
      v_sat_qo100nb: '2400 MHz up, 10489 MHz down', v_sat_transponder: '250 kHz (narrowband, linear)',
      v_sat_doppler: 'up to ±{d2} kHz (2 m), ±{d70} kHz (70 cm)'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
