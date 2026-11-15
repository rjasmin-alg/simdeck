/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-bitlocker-tpm, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   *word* is an English term on the Croatian page (the page renders it in italics, lang="en"); the glossary has only
   "boot loader" of this sim's terms, the others are written out (NOTES.md, "Term pairs").
   The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Lanac podizanja, TPM i zapečaćeni ključ',

      // the chain
      chainTitle: 'Lanac podizanja',
      st_firmware: 'UEFI firmver',
      st_secureboot: 'Provjera potpisa',
      st_bootmgr: 'Windows Boot Manager',
      st_bitlocker: 'BitLocker otključava',
      st_winload: 'winload',
      sub_secureboot: '*Secure Boot*',
      sub_bitlocker: 'TPM otpečaćuje VMK',
      sub_winload: 'učitava Windows',
      measuresInto: 'mjeri se u',
      measuresNone: 'ne mjeri se',
      capsInto: 'poslije: zaključava',
      mDone: 'izvedeno',
      mNow: 'izmjereno, radi',
      mRun: 'radi',
      mNoCheck: 'izmjereno, bez provjere',
      mWait: 'čeka',
      mNever: 'nije pokrenuto',
      mOff: 'isključeno',

      // the TPM
      tpmTitle: 'TPM: registri PCR',
      tpmOf: 'čip računala {m}',
      pcr: 'PCR',
      pcrWhat0: 'kod firmvera',
      pcrWhat2: 'dodatni ROM-ovi kartica',
      pcrWhat4: 'kod Boot Managera',
      pcrWhat7: 'stanje *Secure Boota*',
      pcrWhat11: 'pristup BitLockeru',
      pcrOff: 'struja isključena',

      // the seal
      sealTitle: 'Zapečaćeni glavni ključ (VMK)',
      sealProfile: 'zapečaćen uz PCR {list}, TPM računala {m}',
      colPcr: 'PCR',
      colSealed: 'pri pečaćenju',
      colNow: 'sada',
      colAtCompare: 'pri usporedbi',
      colMatch: 'jednako?',
      matchYes: 'da',
      matchNo: 'ne',
      tpmRow: 'TPM',
      tpmSame: 'isti čip',
      tpmOther: 'drugi čip',
      lockHeld: 'ključ zaključan',
      lockReleased: 'ključ otpušten',
      lockWaiting: 'čeka usporedbu',
      byTpm: 'otpečatio TPM',
      byClear: 'otvoren čistim ključem s diska, bez provjere TPM-a',
      clearKeyOnDisk: 'suspendiran: čisti ključ leži na disku',
      resealedNote: 'ponovno zapečaćen uz vrijednosti ovog podizanja',
      ignored: 'ne provjerava se',

      // settings
      setTitle: 'Postavke ovog podizanja',
      setAtSeal: 'pri pečaćenju',
      setNow: 'sada',
      setFirmware: 'Firmver',
      setSecureBoot: '*Secure Boot*',
      setBootmgr: 'Boot Manager',
      setMachine: 'Računalo',
      setBitlocker: 'BitLocker',
      vOn: 'uključen',
      vOff: 'isključen',
      vActive: 'aktivan',
      vSuspended: 'suspendiran',

      // the screen
      scrTitle: 'Zaslon',
      scrOff: '(računalo je isključeno)',
      scrBooting: '(podizanje…)',
      scrWindows: 'Windows se pokreće.',
      scrRecTitle: 'BitLocker: oporavak',
      scrRecAsk: 'Unesite ključ za oporavak za ovaj pogon (48 znamenki).',
      scrRecWhere: 'Ključ je spremljen pri uključivanju BitLockera (ispis, račun, AD ili Entra ID).',

      // params
      pProfile: 'Profil pečaćenja (PCR)',
      pSecureBoot: 'Secure Boot u firmveru',
      pFirmwareUpdate: 'Ažuriran firmver',
      pBootManager: 'Boot Manager',
      optOriginal: 'izvorni',
      optChanged: 'noviji',
      pSuspend: 'BitLocker suspendiran prije promjene',
      pOtherMachine: 'Disk u drugom računalu',

      // presets
      presetNormal: 'Ništa nije promijenjeno',
      presetNormalHint: 'Sve se poklapa, ključ se otpušta.',
      presetSbOff: 'Secure Boot isključen',
      presetSbOffHint: 'Mijenja se PCR 7, koji je u profilu.',
      presetFw: 'Ažuriran firmver',
      presetFwHint: 'PCR 0 nije u profilu 7, 11; probaj profil 0, 2, 4, 11.',
      presetSusp: 'Suspendiran prije ažuriranja',
      presetSuspHint: 'Profil 0, 2, 4, 11: otključava čisti ključ, zatim ponovno pečaćenje.',
      presetMoved: 'Disk u drugom računalu',
      presetMovedHint: 'Vrijednosti se poklapaju, ali čip je drugi.',

      // legend
      legMeasured: 'izveden dio lanca',
      legProfile: 'PCR u profilu',
      legMismatch: 'ne poklapa se',
      legReleased: 'ključ otpušten',
      legHeld: 'ključ zaključan',
      legChanged: 'prošireno u ovom koraku',

      // captions
      capStart: 'Glavni ključ volumena (VMK) zapečaćen je TPM-om uz PCR {list} i spremljen na disk; otpečatiti ga može samo taj TPM. Promijeni postavke, zatim → pokreće računalo.',
      capStartSusp: ' BitLocker je suspendiran: ključ je dok traje suspenzija zaštićen i čistim ključem na disku.',
      capPower: 'Uključenje: TPM se resetira i svi su PCR-ovi nula. Odsad se mijenjaju samo proširenjem (*extend*): novi = H(stari ‖ H(mjera)).',
      capFirmware: 'Firmver je izmjeren u PCR 0, a dodatni ROM-ovi kartica u PCR 2; tek tada firmver radi dalje.',
      capFirmwareDiff: ' PCR 0 sada nije ono što je bio pri pečaćenju: firmver je drugi.',
      capFirmwareOther: ' Ovo je drugo računalo s drugim firmverom: PCR 0 i PCR 2 su drugačiji.',
      capSecureOn: 'Stanje *Secure Boota* (sigurno podizanje) izmjereno je u PCR 7: uključeno. Firmver zatim provjerava potpis Boot Managera.',
      capSecureOff: '*Secure Boot* (sigurno podizanje) je isključen: PCR 7 to bilježi kao drugu vrijednost, a potpis Boot Managera se ne provjerava.',
      capBootmgr: 'Boot Manager je izmjeren u PCR 4 prije nego što je pokrenut.',
      capBootmgrNew: ' Noviji Boot Manager daje drugi PCR 4; potpisan je istim ključem, pa PCR 7 ostaje isti.',
      capUnlock: 'TPM uspoređuje PCR {list} sa zapečaćenim vrijednostima: sve se poklapa i TPM otpušta ključ. Boot Manager zatim proširuje PCR 11, pa ključ do kraja ovog podizanja nitko više ne može otpečatiti.',
      capOutside: [' Promijenio se i PCR {list}, ali on nije u profilu, pa se ne gleda.', ' Promijenili su se i PCR {list}, ali nisu u profilu, pa se ne gledaju.', ' Promijenili su se i PCR {list}, ali nisu u profilu, pa se ne gledaju.'],
      capMismatch: ['PCR {list} se ne poklapa sa zapečaćenom vrijednošću: TPM ne otpušta ključ, traži se ključ za oporavak.', 'PCR {list} se ne poklapaju sa zapečaćenim vrijednostima: TPM ne otpušta ključ, traži se ključ za oporavak.', 'PCR {list} se ne poklapaju sa zapečaćenim vrijednostima: TPM ne otpušta ključ, traži se ključ za oporavak.'],
      capOtherTpm: 'Ovo je drugi TPM. Zapečaćeni ključ može otvoriti samo čip koji ga je zapečatio, jer njegovi ključevi ne napuštaju čip, pa ga ovaj ne bi otpustio ni kad bi se sve vrijednosti poklapale. Traži se ključ za oporavak.',
      capClear: 'BitLocker je suspendiran: ključ se čita čistim ključem s diska, bez provjere TPM-a.',
      capClearWould: [' Usporedba bi pala na PCR {list}.', ' Usporedba bi pala na PCR {list}.', ' Usporedba bi pala na PCR {list}.'],
      capClearOther: ' Zato suspendiran disk otvara i drugo računalo.',
      capWindows: 'winload učitava Windows s otključanog volumena. Windows se pokreće.',
      capResealed: ' BitLocker zatim ponovno pečati ključ uz vrijednosti ovog podizanja i nastavlja zaštitu: sljedeće podizanje je obično.',
      capRecovery: 'Bez ključa nema ni Windowsa: zaslon traži ključ za oporavak od 48 znamenki. Bez njega volumen ostaje nečitljiv.',
      and: ' i ',

      explain: '<p><b>Izmjereno podizanje</b> (<i lang="en">measured boot</i>): svaki dio lanca prije pokretanja izmjeri sljedeći ' +
        'i njegov sažetak upiše u registar čipa TPM (<i lang="en">Trusted Platform Module</i>, sigurnosni čip). Registar ' +
        '(<i lang="en">platform configuration register</i>, PCR) se ne može postaviti, samo proširiti: novi = H(stari ‖ H(mjera)). ' +
        'Isti lanac zato uvijek daje iste vrijednosti, a bilo koja promjena daje druge.</p>' +
        '<p>BitLocker glavni ključ volumena (VMK) TPM-om <i>zapečati</i> (<i lang="en">seal</i>) uz popis registara, profil, i zapečaćeni ključ spremi na disk; otpečatiti ga može samo isti TPM. ' +
        'Uz UEFI i <i lang="en">Secure Boot</i> to je PCR 7 i 11, bez njega PCR 0, 2, 4 i 11. Pri podizanju TPM otpušta ključ samo ' +
        'ako je <b>svaki</b> registar iz profila jednak zapečaćenoj vrijednosti; inače se traži <b>ključ za oporavak</b> od ' +
        '48 znamenki. Promjena izvan profila ne smeta. Nakon otpuštanja Boot Manager proširi PCR 11, pa kasniji kod ključ ne može ' +
        'ponovno dobiti.</p>' +
        '<p>Prije planirane promjene (firmver, Boot Manager) BitLocker se <b>suspendira</b>: ključ je tada zaštićen i čistim ključem ' +
        'na disku, sljedeće podizanje ne pita TPM, a BitLocker ponovno pečati uz nove vrijednosti.</p>' +
        '<p><b>Česte zablude.</b> TPM ne čuva lozinku diska i ne provjerava je: otpečaćuje ključ samo u stanju koje je izmjereno pri pečaćenju. ' +
        '<i lang="en">Secure Boot</i> i BitLocker nisu isto: prvi odbija nepotpisani kod, drugi šifrira disk i ključ dobiva samo ako se zabilježena mjerenja poklapaju. ' +
        'Ne izaziva svaka promjena u firmveru oporavak: samo ona koja promijeni registar iz profila.</p>' +
        '<p>Windows Boot Manager ovdje je [[boot loader]].</p>'
    },

    en: {
      stage: 'Boot chain, TPM and the sealed key',

      chainTitle: 'Boot chain',
      st_firmware: 'UEFI firmware',
      st_secureboot: 'Signature check',
      st_bootmgr: 'Windows Boot Manager',
      st_bitlocker: 'BitLocker unlock',
      st_winload: 'winload',
      sub_secureboot: 'Secure Boot',
      sub_bitlocker: 'TPM unseals the VMK',
      sub_winload: 'loads Windows',
      measuresInto: 'measured into',
      measuresNone: 'not measured',
      capsInto: 'then locks',
      mDone: 'done',
      mNow: 'measured, running',
      mRun: 'running',
      mNoCheck: 'measured, no check',
      mWait: 'waiting',
      mNever: 'never ran',
      mOff: 'off',

      tpmTitle: 'TPM: PCR registers',
      tpmOf: 'chip of machine {m}',
      pcr: 'PCR',
      pcrWhat0: 'firmware code',
      pcrWhat2: 'option ROMs',
      pcrWhat4: 'Boot Manager code',
      pcrWhat7: 'Secure Boot state',
      pcrWhat11: 'BitLocker access control',
      pcrOff: 'power off',

      sealTitle: 'Sealed volume master key (VMK)',
      sealProfile: 'sealed to PCR {list}, TPM of machine {m}',
      colPcr: 'PCR',
      colSealed: 'at seal time',
      colNow: 'now',
      colAtCompare: 'at the compare',
      colMatch: 'equal?',
      matchYes: 'yes',
      matchNo: 'no',
      tpmRow: 'TPM',
      tpmSame: 'same chip',
      tpmOther: 'another chip',
      lockHeld: 'key held',
      lockReleased: 'key released',
      lockWaiting: 'waiting for the compare',
      byTpm: 'unsealed by the TPM',
      byClear: 'opened with the clear key on the disk, no TPM check',
      clearKeyOnDisk: 'suspended: a clear key lies on the disk',
      resealedNote: 'resealed to the values of this boot',
      ignored: 'not checked',

      setTitle: 'Settings of this boot',
      setAtSeal: 'at seal time',
      setNow: 'now',
      setFirmware: 'Firmware',
      setSecureBoot: 'Secure Boot',
      setBootmgr: 'Boot Manager',
      setMachine: 'Machine',
      setBitlocker: 'BitLocker',
      vOn: 'on',
      vOff: 'off',
      vActive: 'active',
      vSuspended: 'suspended',

      scrTitle: 'Screen',
      scrOff: '(the machine is off)',
      scrBooting: '(booting…)',
      scrWindows: 'Windows is starting.',
      scrRecTitle: 'BitLocker recovery',
      scrRecAsk: 'Enter the recovery key for this drive (48 digits).',
      scrRecWhere: 'The key was saved when BitLocker was turned on (printout, account, AD or Entra ID).',

      pProfile: 'Seal profile (PCRs)',
      pSecureBoot: 'Secure Boot in firmware',
      pFirmwareUpdate: 'Firmware updated',
      pBootManager: 'Boot Manager',
      optOriginal: 'original',
      optChanged: 'newer',
      pSuspend: 'BitLocker suspended before the change',
      pOtherMachine: 'Disk in another machine',

      presetNormal: 'Nothing changed',
      presetNormalHint: 'Everything matches, the key is released.',
      presetSbOff: 'Secure Boot off',
      presetSbOffHint: 'PCR 7 changes, and it is in the profile.',
      presetFw: 'Firmware updated',
      presetFwHint: 'PCR 0 is not in profile 7, 11; try profile 0, 2, 4, 11.',
      presetSusp: 'Suspended before the update',
      presetSuspHint: 'Profile 0, 2, 4, 11: the clear key unlocks, then a reseal.',
      presetMoved: 'Disk in another machine',
      presetMovedHint: 'The values match, but the chip is another one.',

      legMeasured: 'stage ran',
      legProfile: 'PCR in the profile',
      legMismatch: 'mismatch',
      legReleased: 'key released',
      legHeld: 'key held',
      legChanged: 'extended in this step',

      capStart: 'The volume master key (VMK) is sealed by the TPM to PCR {list} and stored on the disk; only that TPM can unseal it. Change the settings, then → powers the machine on.',
      capStartSusp: ' BitLocker is suspended: while it is, the key is also protected by a clear key on the disk.',
      capPower: 'Power on: the TPM resets and every PCR is zero. From now on they change only by extend: new = H(old ‖ H(measurement)).',
      capFirmware: 'The firmware is measured into PCR 0 and the option ROMs into PCR 2; only then does the firmware go on.',
      capFirmwareDiff: ' PCR 0 is not what it was at seal time: the firmware is different.',
      capFirmwareOther: ' This is another machine with other firmware: PCR 0 and PCR 2 differ.',
      capSecureOn: 'The Secure Boot state is measured into PCR 7: on. The firmware then checks the Boot Manager\'s signature.',
      capSecureOff: 'Secure Boot is off: PCR 7 records that as another value, and the Boot Manager\'s signature is not checked.',
      capBootmgr: 'The Boot Manager is measured into PCR 4 before it runs.',
      capBootmgrNew: ' A newer Boot Manager gives another PCR 4; it is signed with the same key, so PCR 7 stays the same.',
      capUnlock: 'The TPM compares PCR {list} with the sealed values: all match and the TPM releases the key. The Boot Manager then extends PCR 11, so nothing can unseal the key again for the rest of this boot.',
      capOutside: [' PCR {list} changed too, but it is not in the profile, so it does not count.', ' PCR {list} changed too, but they are not in the profile, so they do not count.'],
      capMismatch: ['PCR {list} does not match the sealed value: the TPM keeps the key and asks for the recovery key.', 'PCR {list} do not match the sealed values: the TPM keeps the key and asks for the recovery key.'],
      capOtherTpm: 'This is another TPM. Only the chip that sealed the key can open it, because its keys never leave the chip, so this one would keep it even if every value matched. The recovery key is needed.',
      capClear: 'BitLocker is suspended: the key is read with the clear key on the disk, without the TPM check.',
      capClearWould: [' The compare would have failed on PCR {list}.', ' The compare would have failed on PCR {list}.'],
      capClearOther: ' That is why a suspended disk opens in another machine too.',
      capWindows: 'winload loads Windows from the unlocked volume. Windows starts.',
      capResealed: ' BitLocker then reseals the key to the values of this boot and resumes protection: the next boot is a normal one.',
      capRecovery: 'No key, no Windows: the screen asks for the 48-digit recovery key. Without it the volume stays unreadable.',
      and: ' and ',

      explain: '<p><b>Measured boot</b>: before it runs, each stage of the chain is measured and its hash recorded in a register ' +
        'of the TPM (Trusted Platform Module). A platform configuration register (PCR) cannot be set, only extended: ' +
        'new = H(old ‖ H(measurement)). The same chain always gives the same values; any change gives others.</p>' +
        '<p>BitLocker has the TPM <i>seal</i> the volume master key (VMK) to a list of registers, the profile, and stores the sealed key on the disk; only the same TPM can unseal it. With UEFI and ' +
        'Secure Boot that is PCR 7 and 11; without it PCR 0, 2, 4 and 11. At boot the TPM releases the key only if <b>every</b> ' +
        'register of the profile equals its sealed value; otherwise Windows asks for the 48-digit <b>recovery key</b>. A change ' +
        'outside the profile does not matter. After the release the Boot Manager extends PCR 11, so later code cannot get the ' +
        'key again.</p>' +
        '<p>Before a planned change (firmware, Boot Manager) BitLocker is <b>suspended</b>: the key is then also protected by a ' +
        'clear key on the disk, the next boot does not ask the TPM, and BitLocker reseals to the new values.</p>' +
        '<p><b>Misconceptions.</b> The TPM does not store the disk password and check it: it unseals the key only in the ' +
        'state measured at seal time. Secure Boot and BitLocker are not the same: the first refuses unsigned code, the second encrypts ' +
        'the disk and gets its key only if the recorded measurements match. Not every firmware change triggers recovery: only one that changes a register in the profile.</p>' +
        '<p>Here the Windows Boot Manager is the [[boot loader]].</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
