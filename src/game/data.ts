import type { CharacterProfile, NpcVoiceId, RumorEntry } from './types';

export const STUDIO_INFO = {
  studio: 'Worth-IT Studios',
  leadDev: 'Kangpcode (Dhafa Nazula Permadi)',
  title: 'RUMAH GURITA: DIMENSI GAIB',
  disclaimer:
    'Game ini fiksi. Rumah aslinya adalah hunian pribadi milik Sang Pemilik ("Pak Fransiskus") dan bukan tempat angker. Mohon tidak mengunjungi atau mengganggu penghuni dan warga sekitar.',
};

export const CHARACTERS: CharacterProfile[] = [
  {
    id: 'raka',
    name: 'Raka',
    grade: 'SMA Kelas 11',
    role: 'Ketua Klub · Rasional & Skeptis',
    skillName: 'Debunker',
    skillDesc: 'Fakta melemahkan Ambu Hideung 35% lebih kuat & Sanity lebih stabil.',
    accentColor: '#d99b4e',
    shirtColor: '#e4e7e2',
    bottomColor: '#4c5b69',
    speedMult: 1.0,
    crouchNoiseMult: 0.55,
    sanityResistMult: 0.8,
    batteryDrainMult: 1.0,
    canSenseGhosts: false,
    debunkBonusWeakening: 1.35,
  },
  {
    id: 'salsa',
    name: 'Salsa',
    grade: 'SMA Kelas 12',
    role: 'Jurnalis Sekolah · Pengumpul Arsip',
    skillName: 'Arsip',
    skillDesc: 'Petunjuk & bukti tersembunyi menyala lebih terang di jarak jauh.',
    accentColor: '#7ca982',
    shirtColor: '#e4e7e2',
    bottomColor: '#505e6a',
    speedMult: 1.0,
    crouchNoiseMult: 0.55,
    sanityResistMult: 0.9,
    batteryDrainMult: 0.9,
    canSenseGhosts: false,
    debunkBonusWeakening: 1.15,
  },
  {
    id: 'bima',
    name: 'Bima',
    grade: 'SMA Kelas 10',
    role: 'Teknisi & Perangkat Radio',
    skillName: 'Teknisi',
    skillDesc: 'Baterai senter & Kamera UV 40% lebih awet.',
    accentColor: '#5fa8c9',
    shirtColor: '#dfe3de',
    bottomColor: '#546472',
    speedMult: 0.98,
    crouchNoiseMult: 0.6,
    sanityResistMult: 0.95,
    batteryDrainMult: 0.6,
    canSenseGhosts: false,
    debunkBonusWeakening: 1.0,
  },
  {
    id: 'nadia',
    name: 'Nadia',
    grade: 'SMP Kelas 9',
    role: 'Pemberani · Kakak dari Rani',
    skillName: 'Lincah',
    skillDesc: 'Lari 15% lebih cepat dan langkah sangat senyap saat jongkok.',
    accentColor: '#c96256',
    shirtColor: '#e6e8e4',
    bottomColor: '#253954',
    speedMult: 1.15,
    crouchNoiseMult: 0.25,
    sanityResistMult: 0.95,
    batteryDrainMult: 1.0,
    canSenseGhosts: false,
    debunkBonusWeakening: 1.0,
  },
  {
    id: 'dito',
    name: 'Dito',
    grade: 'SMP Kelas 8',
    role: 'Sensitif · Peka Energi',
    skillName: 'Peka',
    skillDesc: 'Mendeteksi arah & jarak hantu terdekat secara langsung di HUD.',
    accentColor: '#a282c9',
    shirtColor: '#e4e6e1',
    bottomColor: '#294466',
    speedMult: 0.98,
    crouchNoiseMult: 0.5,
    sanityResistMult: 1.05,
    batteryDrainMult: 0.95,
    canSenseGhosts: true,
    debunkBonusWeakening: 1.0,
  },
];

export const INITIAL_RUMORS: RumorEntry[] = [
  {
    id: 'rumor_666',
    title: 'Segel I: Misteri Nomor 666',
    rumorText:
      'Kabar beredar nomor rumah "666" adalah penanda sekte pemujaan gelap di Sukajadi.',
    associatedGhost: 'Bayangan Pemuja & Ambu Hideung',
    factId: 'fact_akta',
    factTitle: 'Akta & Catatan Arsitektur 1984',
    factText:
      'Fakta: Nomor rumah tersebut hanya penanda blok/properti seni nyentrik era 1980-an milik Pak Fransiskus, bukan simbol ritual.',
    discoveredRumor: true,
    discoveredFact: false,
    debunked: false,
  },
  {
    id: 'rumor_gurita',
    title: 'Segel II: Patung Gurita Hidup',
    rumorText:
      'Warga luar menduga patung gurita hitam bermata merah di atap adalah berhala pemujaan yang bisa bergerak.',
    associatedGhost: 'Ilusi Tentakel Ambu Hideung',
    factId: 'fact_faktur_patung',
    factTitle: 'Faktur Properti Seni Kelautan',
    factText:
      'Fakta: Patung gurita di atap hanyalah karya seni fiberglass milik Pak Fransiskus yang mencintai dunia kelautan. Ia benda mati.',
    discoveredRumor: false,
    discoveredFact: false,
    debunked: false,
  },
  {
    id: 'rumor_penghuni',
    title: 'Segel III: Rumah Kosong Berhantu',
    rumorText:
      'Rumor menyebut rumah ini selalu kosong puluhan tahun dan dikuasai Kuntilanak serta Genderuwo.',
    associatedGhost: 'Kuntilanak & Genderuwo',
    factId: 'fact_buku_penjaga',
    factTitle: 'Buku Log Penjaga & Kerabat',
    factText:
      'Fakta: Rumah singgah akhir pekan ini rutin dirawat oleh kerabat dan penjaga resmi. Sepi bukan berarti tak berpenghuni.',
    discoveredRumor: false,
    discoveredFact: false,
    debunked: false,
  },
  {
    id: 'rumor_uci',
    title: 'Segel IV: Boneka Uci Pembawa Kutukan',
    rumorText:
      'Video viral mengklaim Boneka Uci di lantai 2 dirasuki roh dan mengejar siapa saja yang berpaling.',
    associatedGhost: 'Boneka Uci',
    factId: 'fact_kuitansi_boneka',
    factTitle: 'Catatan Koleksi Antik Keluarga',
    factText:
      'Fakta: Boneka porselen tua tersebut hanyalah barang koleksi pajangan antik tahun 1986 yang rusak karena usia.',
    discoveredRumor: false,
    discoveredFact: false,
    debunked: false,
  },
  {
    id: 'rumor_kolam',
    title: 'Segel V: Kolam Ritual Atap',
    rumorText:
      'Gosip internet menyebut kolam rooftop dipakai ritual pemanggilan Pocong dan Jurig Cai.',
    associatedGhost: 'Pocong & Jurig Cai',
    factId: 'fact_cetak_biru',
    factTitle: 'Cetak Biru Kolam & Menara Radio',
    factText:
      'Fakta: Kolam atap dan menara radio dibangun Pak Fransiskus sebagai hobi arsitektur unik dan radio amatir.',
    discoveredRumor: false,
    discoveredFact: false,
    debunked: false,
  },
  {
    id: 'rumor_gereja',
    title: 'Segel VI: Legenda "Ambu Hideung"',
    rumorText:
      'Sosok perempuan bergaun hitam bermata merah dipercaya sebagai pemimpin sekte gaib di rumah ini.',
    associatedGhost: 'Boss: Ambu Hideung',
    factId: 'fact_rekaman_rani',
    factTitle: 'Rekaman Siaran Terakhir Rani',
    factText:
      'Fakta: "Kak Nadia... rumahnya cuma rumah biasa! Yang mengerikan itu ketakutan kita sendiri yang membentuk Dimensi Gaib ini!"',
    discoveredRumor: false,
    discoveredFact: false,
    debunked: false,
  },
];

export interface NPCDialog {
  id: string;
  speaker: string;
  voiceId: NpcVoiceId;
  role: string;
  lines: string[];
  unlockRumorId?: string;
}

export const NPC_DIALOGS: Record<string, NPCDialog> = {
  satpam: {
    id: 'satpam',
    speaker: 'Pak Ujang (Satpam)',
    voiceId: 'satpam',
    role: 'Penjaga Pos Ronda & Gerbang Sukajadi',
    lines: [
      '"Berhenti, Nak! Tidak ada yang boleh masuk malam-malam. Ini rumah pribadi milik Pak Fransiskus, bukan tempat uji nyali!"',
      '"Saya dan kerabat beliau merawat bangunan besar ber-balkon lengkung itu. Banyak anak nekat masuk cuma gara-gara nomor rumah 666."',
      '"Tadi sore adik kalian, Rani, lari menyelinap lewat Celah Pagar Barat ke halaman rumah sambil live-streaming. Kalau mau menyusul, cari kunci tiap ruangan di dalam dan jangan termakan rasa takut!"',
    ],
    unlockRumorId: 'rumor_penghuni',
  },
  nasgor: {
    id: 'nasgor',
    speaker: 'Mang Asep (Tukang Nasi Goreng)',
    voiceId: 'nasgor',
    role: 'Pedagang Kaki Lima Sukajadi',
    lines: [
      '"Wah, hati-hati atuh, Nak! Malam Jumat begini di rumah gurita itu suka terasa aneh. Katanya patung gurita di atap matanya menyala merah!"',
      '"Di ruang tamu lantai 2 juga konon ada Boneka Uci yang berpindah posisi kalau tidak diawasi—tapi kalau terus ditatap, dia membeku."',
      '"Jangan lupa nyalakan Kamera UV [Q] kalau ketemu meja atau sudut ruangan yang tampak kosong—sering ada dokumen bukti asli Pak Fransiskus di sana!"',
    ],
    unlockRumorId: 'rumor_gurita',
  },
  pecel: {
    id: 'pecel',
    speaker: 'Mas Budi (Tukang Pecel Lele)',
    voiceId: 'pecel',
    role: 'Pedagang Kaki Lima Sukajadi',
    lines: [
      '"Dengar cerita orang kampung, kolam di rooftop itu katanya tempat ritual—padahal dulu Pak Fransiskus cuma suka arsitektur kelautan dan hobi radio amatir."',
      '"Rani sempat bawa walkie-talkie di frekuensi 104.6 MHz sebelum masuk. Coba cek menara radio di rooftop nanti."',
      '"Ingat: bawa garam [G], sembunyi di lemari kalau dikejar, dan selalu patahkan segel di Jurnal [J] memakai BUKTI NYATA!"',
    ],
    unlockRumorId: 'rumor_kolam',
  },
  warung_ibu: {
    id: 'warung_ibu',
    speaker: 'Ceu Titin (Pemilik Warung)',
    voiceId: 'warung_ibu',
    role: 'Pemilik Warung Ceu Titin · Jalan Sukajadi',
    lines: [
      '"Eh, anak-anak Klub Penasaran! Tadi sore adik kalian si Rani mampir beli teh botol di Warung Ceu Titin sebelum jalan ke utara melewati baliho Windah Basudara."',
      '"Katanya Rani mau membuktikan kalau rumah Pak Fransiskus itu cuma bangunan seni tahun 1984. Di pekarangan depan dalamnya bahkan ada kolam renang dan carport biasa."',
      '"Nanti susuri jalan ke utara melewati pos ronda Pak Ujang, buka Gerbang Utama atau selusup Celah Pagar Barat di dekat halaman dalam, ya!"',
    ],
    unlockRumorId: 'rumor_penghuni',
  },
  warung_pemuda: {
    id: 'warung_pemuda',
    speaker: 'Rizky & Anak Muda (Tongkrongan Warung)',
    voiceId: 'warung_pemuda',
    role: 'Pemuda Komplek Sukajadi · Warung Ceu Titin',
    lines: [
      '"Weh, kalian beneran mau nyusul Rani ke Rumah Gurita malam ini? Tadi pas kami ngopi di bangku Warung Ceu Titin, sinyal walkie-talkie sempat nyamber frekuensi 104.6 MHz!"',
      '"Info dari tukang renovasi dulu, lantai dasar punya akses tangga ke lantai 2, dan tangga menuju atap rooftop juga sudah dipasangi pintu keluar—jadi jalurnya nggak kehalang tembok."',
      '"Jangan lupa pakai Senter [F] dan Kamera UV [Q] bergantian, soalnya baterainya terpisah!"',
    ],
    unlockRumorId: 'rumor_uci',
  },
};

export const STORY_BEATS = {
  enterDimensiGaib:
    'BRAK! Pintu depan membanting tertutup di belakangmu! Kabut Dimensi Gaib menyelimuti Sukajadi—suara radio Rani berdesis: "Kak Nadia... tolong..."',
  enterSecondFloor:
    'Lantai 2 berderit dingin. Suara tawa samar dan langkah kecil terdengar dari Ruang Keluarga atas—temukan Kunci Kamar & Kunci Atap!',
  enterRooftop:
    'Rooftop Rumah Gurita! Patung gurita hitam itu hanyalah properti seni statis—yang memburu adalah ilusi AMBU HIDEUNG! Setel Menara Radio (104.6 MHz) & rebut Kujang Pamungkas!',
};
