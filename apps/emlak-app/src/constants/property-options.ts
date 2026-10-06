// Single source of truth for every SELECT / MULTI_SELECT on property.
// The object manifest and the sahibinden import mapper both read from here,
// so the schema and the importer cannot drift apart. Labels are sahibinden's
// raw Turkish strings; values are stable SCREAMING_SNAKE identifiers.
import {
  type LocalizedText,
  resolveLabel,
  trLabel,
} from 'src/constants/app-locale';

const OPTION_COLOR_PALETTE = [
  'blue',
  'green',
  'yellow',
  'purple',
  'orange',
  'turquoise',
  'pink',
  'sky',
  'red',
  'gray',
] as const;

type SelectOptionColor = (typeof OPTION_COLOR_PALETTE)[number];

export type SelectOption = {
  value: string;
  label: string;
  position: number;
  color: SelectOptionColor;
};

type OptionEntry = readonly [
  value: string,
  label: LocalizedText,
  color?: SelectOptionColor,
];

const buildOptions = (entries: ReadonlyArray<OptionEntry>): readonly SelectOption[] =>
  entries.map(([value, label, color], index) => ({
    value,
    label: resolveLabel(label),
    position: index,
    color: color ?? OPTION_COLOR_PALETTE[index % OPTION_COLOR_PALETTE.length],
  }));

const mapEntries = (
  entrySets: Record<string, ReadonlyArray<OptionEntry>>,
): Record<string, readonly SelectOption[]> =>
  Object.fromEntries(
    Object.entries(entrySets).map(([fieldName, entries]) => [
      fieldName,
      buildOptions(entries),
    ]),
  );

const PROPERTY_SELECT_ENTRIES: Record<string, ReadonlyArray<OptionEntry>> = {
  externalSource: [
    ['SAHIBINDEN', 'Sahibinden', 'orange'],
    ['MANUAL', 'Elle Giriş', 'gray'],
  ],
  category: [
    ['KONUT', 'Konut', 'blue'],
    ['ISYERI', 'İşyeri', 'purple'],
    ['ARSA', 'Arsa', 'yellow'],
    ['BINA', 'Bina', 'orange'],
    ['DEVREMULK', 'Devremülk', 'turquoise'],
    ['TURISTIK_TESIS', 'Turistik Tesis', 'pink'],
  ],
  subType: [
    ['DAIRE', 'Daire'],
    ['REZIDANS', 'Rezidans'],
    ['MUSTAKIL_EV', 'Müstakil Ev'],
    ['VILLA', 'Villa'],
    ['YAZLIK', 'Yazlık'],
    ['CIFTLIK_EVI', 'Çiftlik Evi'],
    ['KOSK', 'Köşk'],
    ['YALI', 'Yalı'],
    ['DUKKAN_MAGAZA', 'Dükkan & Mağaza'],
    ['TICARI', 'Ticari'],
    ['OFIS', 'Ofis'],
    ['BURO', 'Büro'],
    ['DEPO', 'Depo'],
    ['FABRIKA', 'Fabrika'],
    ['ATOLYE', 'Atölye'],
    ['PLAZA', 'Plaza'],
    ['BINA', 'Bina'],
    ['IS_HANI', 'İş Hanı'],
    ['TARLA', 'Tarla'],
    ['BAG_BAHCE', 'Bağ & Bahçe'],
    ['IMARLI_ARSA', 'İmarlı Arsa'],
    ['OTEL', 'Otel'],
    ['APART', 'Apart'],
    ['BUTIK_OTEL', 'Butik Otel'],
    ['DEVREMULK', 'Devremülk'],
    ['DIGER', 'Diğer'],
  ],
  listingType: [
    ['SATILIK', 'Satılık', 'green'],
    ['KIRALIK', 'Kiralık', 'blue'],
    ['DEVREN_SATILIK', 'Devren Satılık', 'orange'],
    ['DEVREN_KIRALIK', 'Devren Kiralık', 'yellow'],
  ],
  status: [
    ['ACTIVE', 'Aktif', 'green'],
    ['OPTIONED', 'Opsiyonlu', 'yellow'],
    ['SOLD', 'Satıldı', 'gray'],
    ['RENTED', 'Kiralandı', 'purple'],
    ['PASSIVE', 'Pasif', 'gray'],
  ],
  rooms: [
    ['R1_0', '1+0'],
    ['R1_1', '1+1'],
    ['R2_1', '2+1'],
    ['R2_2', '2+2'],
    ['R3_1', '3+1'],
    ['R3_2', '3+2'],
    ['R4_1', '4+1'],
    ['R4_2', '4+2'],
    ['R5_1', '5+1'],
    ['R5_2', '5+2'],
    ['R6_1', '6+1'],
    ['R6_2', '6+2'],
    ['R7_PLUS', '7+ ve üzeri'],
  ],
  buildingAge: [
    ['AGE_0', '0'],
    ['AGE_1', '1'],
    ['AGE_2', '2'],
    ['AGE_3', '3'],
    ['AGE_4', '4'],
    ['AGE_5', '5'],
    ['AGE_6_10', '6-10 arası'],
    ['AGE_11_15', '11-15 arası'],
    ['AGE_16_20', '16-20 arası'],
    ['AGE_21_25', '21-25 arası'],
    ['AGE_26_30', '26-30 arası'],
    ['AGE_31_PLUS', '31 ve üzeri'],
  ],
  floorLocation: [
    ['BODRUM_KAT', 'Bodrum Kat'],
    ['ZEMIN_KAT', 'Zemin Kat'],
    ['BAHCE_KATI', 'Bahçe Katı'],
    ['GIRIS_KATI', 'Giriş Katı'],
    ['YUKSEK_GIRIS', 'Yüksek Giriş'],
    ['CATI_KATI', 'Çatı Katı'],
    ...Array.from({ length: 20 }, (_, floorIndex) => {
      const floor = String(floorIndex + 1);
      return [`FLOOR_${floor}`, floor] as const;
    }),
    ['FLOOR_21_PLUS', '21 ve üzeri'],
  ],
  heating: [
    ['YOK', 'Yok'],
    ['SOBA', 'Soba'],
    ['DOGALGAZ_SOBASI', 'Doğalgaz Sobası'],
    ['KAT_KALORIFERI', 'Kat Kaloriferi'],
    ['MERKEZI', 'Merkezi'],
    ['MERKEZI_PAY_OLCER', 'Merkezi (Pay Ölçer)'],
    ['KOMBI_DOGALGAZ', 'Kombi (Doğalgaz)'],
    ['KOMBI_ELEKTRIK', 'Kombi (Elektrik)'],
    ['YERDEN_ISITMA', 'Yerden Isıtma'],
    ['KLIMA', 'Klima'],
    ['FANCOIL', 'Fancoil Ünitesi'],
    ['GUNES_ENERJISI', 'Güneş Enerjisi'],
    ['ELEKTRIKLI_RADYATOR', 'Elektrikli Radyatör'],
    ['JEOTERMAL', 'Jeotermal'],
    ['SOMINE', 'Şömine'],
    ['VRV', 'VRV'],
    ['ISI_POMPASI', 'Isı Pompası'],
  ],
  creditEligible: [
    ['UYGUN', 'Uygun', 'green'],
    ['UYGUN_DEGIL', 'Uygun Değil', 'red'],
    ['BILINMIYOR', 'Bilinmiyor', 'gray'],
  ],
  deedStatus: [
    ['KAT_MULKIYETLI', 'Kat Mülkiyetli'],
    ['KAT_IRTIFAKLI', 'Kat İrtifaklı'],
    ['HISSELI_TAPU', 'Hisseli Tapu'],
    ['MUSTAKIL_TAPULU', 'Müstakil Tapulu'],
    ['ARSA_TAPULU', 'Arsa Tapulu'],
    ['KOOPERATIF_HISSELI_TAPU', 'Kooperatif Hisseli Tapu'],
    ['MUSTAKIL_PARSEL', 'Müstakil Parsel'],
    ['BILINMIYOR', 'Bilinmiyor'],
  ],
  fromWho: [
    ['SAHIBINDEN', 'Sahibinden'],
    ['EMLAK_OFISINDEN', 'Emlak Ofisinden'],
    ['INSAAT_FIRMASINDAN', 'İnşaat Firmasından'],
    ['BANKADAN', 'Bankadan'],
  ],
  usageStatus: [
    ['BOS', 'Boş'],
    ['KIRACILI', 'Kiracılı'],
    ['MULK_SAHIBI', 'Mülk Sahibi'],
  ],
  zoningStatus: [
    ['IMARLI', 'İmarlı'],
    ['IMARSIZ', 'İmarsız'],
    ['ARSA', 'Arsa'],
    ['TARLA', 'Tarla'],
    ['BAG_BAHCE', 'Bağ & Bahçe'],
    ['KONUT_IMARLI', 'Konut İmarlı'],
    ['TICARI_IMARLI', 'Ticari İmarlı'],
    ['SANAYI_IMARLI', 'Sanayi İmarlı'],
    ['TURIZM_IMARLI', 'Turizm İmarlı'],
    ['SIT_ALANI', 'Sit Alanı'],
    ['ZEYTINLIK', 'Zeytinlik'],
    ['ARAZI', 'Arazi'],
    ['KONUT', 'Konut'],
    ['VILLA', 'Villa'],
    ['DIGER', 'Diğer'],
  ],
  kitchenType: [
    ['ACIK_AMERIKAN', 'Açık (Amerikan)'],
    ['KAPALI', 'Kapalı'],
  ],
  buildingCondition: [
    ['SIFIR', 'Sıfır'],
    ['IKINCI_EL', 'İkinci El'],
  ],
};

const PROPERTY_MULTI_SELECT_ENTRIES: Record<string, ReadonlyArray<OptionEntry>> = {
  interiorFeatures: [
    ['KLIMA', 'Klima'],
    ['BEYAZ_ESYA', 'Beyaz Eşya'],
    ['ANKASTRE_FIRIN', 'Ankastre Fırın'],
    ['EBEVEYN_BANYOSU', 'Ebeveyn Banyosu'],
    ['GIYINME_ODASI', 'Giyinme Odası'],
    ['GOMME_DOLAP', 'Gömme Dolap'],
    ['HILTON_BANYO', 'Hilton Banyo'],
    ['LAMINAT_ZEMIN', 'Laminat Zemin'],
    ['PARKE_ZEMIN', 'Parke Zemin'],
    ['SOMINE', 'Şömine'],
    ['CELIK_KAPI', 'Çelik Kapı'],
    ['DUSAKABIN', 'Duşakabin'],
    ['KUVET', 'Küvet'],
    ['PANJUR', 'Panjur'],
    ['PANJUR_JALUZI', 'Panjur/Jaluzi'],
    ['WIFI', 'Wi-Fi'],
    ['INTERNET', 'İnternet'],
    ['ADSL', 'ADSL'],
    ['FIBER_INTERNET', 'Fiber İnternet'],
    ['KABLO_TV', 'Kablo TV'],
    ['UYDU', 'Uydu'],
    ['TELEFON_HATTI', 'Telefon Hattı'],
    ['FAKS_TELEFON_HATTI', 'Faks - Telefon Hattı'],
    ['AMERIKAN_KAPI', 'Amerikan Kapı'],
    ['MUTFAK_ANKASTRE', 'Mutfak (Ankastre)'],
    ['MUTFAK_LAMINAT', 'Mutfak (Laminat)'],
    ['MUTFAK_DOGALGAZI', 'Mutfak Doğalgazı'],
    ['PVC_DOGRAMA', 'PVC Doğrama'],
    ['AHSAP_DOGRAMA', 'Ahşap Doğrama'],
    ['ALUMINYUM_DOGRAMA', 'Alüminyum Doğrama'],
    ['ISICAM', 'Isıcam'],
    ['KARTONPIYER', 'Kartonpiyer'],
    ['SPOT_AYDINLATMA', 'Spot Aydınlatma'],
    ['SERAMIK_ZEMIN', 'Seramik Zemin'],
    ['MOBILYA', 'Mobilya'],
    ['VESTIYER', 'Vestiyer'],
    ['KILER', 'Kiler'],
    ['TERAS', 'Teras'],
    ['DUBLEKS', 'Dubleks'],
    ['TRIPLEKS', 'Tripleks'],
    ['BAHCE_DUBLEKSI', 'Bahçe Dubleksi'],
    ['ARA_KAT', 'Ara Kat'],
    ['EN_UST_KAT', 'En Üst Kat'],
    ['BULASIK_MAKINESI', 'Bulaşık Makinesi'],
    ['BUZDOLABI', 'Buzdolabı'],
    ['CAMASIR_MAKINESI', 'Çamaşır Makinesi'],
    ['CAMASIR_KURUTMA_MAKINESI', 'Çamaşır Kurutma Makinesi'],
    ['CAMASIR_ODASI', 'Çamaşır Odası'],
    ['FIRIN', 'Fırın'],
    ['SET_USTU_OCAK', 'Set Üstü Ocak'],
    ['TELEVIZYON', 'Televizyon'],
    ['SAC_KURUTMA_MAKINESI', 'Saç Kurutma Makinesi'],
    ['CAY_KAHVE_MAKINESI', 'Çay & Kahve Makinesi'],
    ['MINIBAR', 'Minibar'],
    ['UTU', 'Ütü'],
    ['EK_YATAK', 'Ek Yatak'],
    ['ESYA_DOLABI', 'Eşya Dolabı'],
    ['MINDER', 'Minder'],
    ['DUS', 'Duş'],
    ['TUVALET', 'Tuvalet'],
    ['WC', 'WC'],
    ['ALATURKA_TUVALET', 'Alaturka Tuvalet'],
    ['BOYALI', 'Boyalı'],
    ['SOFBEN', 'Şofben'],
    ['TERMOSIFON', 'Termosifon'],
    ['SICAK_SU_24_SAAT', '24 Saat Sıcak Su'],
    ['SPLIT_KLIMA', 'Split Klima'],
  ],
  exteriorFeatures: [
    ['ASANSOR', 'Asansör'],
    ['OTOPARK', 'Otopark'],
    ['KAPALI_OTOPARK', 'Kapalı Otopark'],
    ['YUZME_HAVUZU_ACIK', 'Yüzme Havuzu (Açık)'],
    ['YUZME_HAVUZU_KAPALI', 'Yüzme Havuzu (Kapalı)'],
    ['SPOR_SALONU', 'Spor Salonu'],
    ['SAUNA', 'Sauna'],
    ['BAHCE', 'Bahçe'],
    ['COCUK_OYUN_PARKI', 'Çocuk Oyun Parkı'],
    ['GUVENLIK_24_SAAT', '24 Saat Güvenlik'],
    ['KAMERA_SISTEMI', 'Kamera Sistemi'],
    ['JENERATOR', 'Jeneratör'],
    ['KAPICI', 'Kapıcı'],
    ['TENIS_KORTU', 'Tenis Kortu'],
    ['ISI_YALITIMI', 'Isı Yalıtımı'],
    ['SIDING', 'Siding'],
    ['ARAC_PARK_YERI', 'Araç Park Yeri'],
    ['ARAC_SARJ_ISTASYONU', 'Araç Şarj İstasyonu'],
    ['HIDROFOR', 'Hidrofor'],
    ['BARBEKU', 'Barbekü'],
    ['MUSTAKIL_HAVUZLU', 'Müstakil Havuzlu'],
    ['YUZME_HAVUZU', 'Yüzme Havuzu'],
    ['HAMAM', 'Hamam'],
    ['BUHAR_ODASI', 'Buhar Odası'],
    ['APARTMAN_GOREVLISI', 'Apartman Görevlisi'],
    ['ALARM_HIRSIZ', 'Alarm (Hırsız)'],
    ['ALARM_YANGIN', 'Alarm (Yangın)'],
    ['GORUNTULU_DIYAFON', 'Görüntülü Diyafon'],
    ['INTERCOM_SISTEMI', 'Intercom Sistemi'],
    ['SES_YALITIMI', 'Ses Yalıtımı'],
    ['ENGELLIYE_UYGUN_ASANSOR', 'Engelliye Uygun Asansör'],
    ['ENGELLIYE_UYGUN_PARK', 'Engelliye Uygun Park'],
    ['GIRIS_RAMPA', 'Giriş / Rampa'],
    ['GENIS_KORIDOR', 'Geniş Koridor'],
    ['MERDIVEN', 'Merdiven'],
    ['TUTAMAK_KORKULUK', 'Tutamak / Korkuluk'],
    ['SPOR_ALANI', 'Spor Alanı'],
  ],
  neighborhoodFeatures: [
    ['ALISVERIS_MERKEZI', 'Alışveriş Merkezi'],
    ['BELEDIYE', 'Belediye'],
    ['CAMI', 'Cami'],
    ['ECZANE', 'Eczane'],
    ['HASTANE', 'Hastane'],
    ['ILKOKUL_ORTAOKUL', 'İlkokul-Ortaokul'],
    ['LISE', 'Lise'],
    ['MARKET', 'Market'],
    ['PARK', 'Park'],
    ['POLIS_MERKEZI', 'Polis Merkezi'],
    ['SAHIL', 'Sahil'],
    ['SEMT_PAZARI', 'Semt Pazarı'],
    ['SPOR_SALONU', 'Spor Salonu'],
    ['UNIVERSITE', 'Üniversite'],
    ['SEHIR_MERKEZI', 'Şehir Merkezi'],
    ['SAGLIK_OCAGI', 'Sağlık Ocağı'],
    ['ITFAIYE', 'İtfaiye'],
    ['EGLENCE_MERKEZI', 'Eğlence Merkezi'],
    ['KRES', 'Kreş'],
    ['ATM', 'ATM'],
    ['BANKA', 'Banka'],
    ['BENZIN_ISTASYONU', 'Benzin İstasyonu'],
    ['KILISE', 'Kilise'],
    ['POSTANE', 'Postane'],
    ['TAKSI_DURAGI', 'Taksi Durağı'],
    ['PLAJ', 'Plaj'],
    ['KUM_PLAJ', 'Kum Plaj'],
    ['DENIZE_SIFIR', 'Denize Sıfır'],
    ['DENIZE_YAKIN', 'Denize Yakın'],
    ['ANA_YOLA_YAKIN', 'Ana Yola Yakın'],
    ['HAVAALANINA_YAKIN', 'Havaalanına Yakın'],
  ],
  transportFeatures: [
    ['ANAYOL', 'Anayol'],
    ['AVRASYA_TUNELI', 'Avrasya Tüneli'],
    ['BOGAZ_KOPRULERI', 'Boğaz Köprüleri'],
    ['CADDE', 'Cadde'],
    ['DENIZ_OTOBUSU', 'Deniz Otobüsü'],
    ['DOLMUS', 'Dolmuş'],
    ['E5', 'E-5'],
    ['HAVAALANI', 'Havaalanı'],
    ['ISKELE', 'İskele'],
    ['METRO', 'Metro'],
    ['METROBUS', 'Metrobüs'],
    ['MINIBUS', 'Minibüs'],
    ['OTOBUS_DURAGI', 'Otobüs Durağı'],
    ['SAHIL', 'Sahil'],
    ['TEM', 'TEM'],
    ['TRAMVAY', 'Tramvay'],
    ['TREN_ISTASYONU', 'Tren İstasyonu'],
    ['OTOBUS', 'Otobüs'],
    ['DENIZ_YOLU', 'Deniz Yolu'],
    ['TOPLU_ULASIMA_YAKIN', 'Toplu Ulaşıma Yakın'],
  ],
  view: [
    ['BOGAZ', 'Boğaz'],
    ['DENIZ', 'Deniz'],
    ['DOGA', 'Doğa'],
    ['GOL', 'Göl'],
    ['HAVUZ', 'Havuz'],
    ['PARK_YESIL_ALAN', 'Park & Yeşil Alan'],
    ['SEHIR', 'Şehir'],
  ],
  infrastructure: [
    ['ELEKTRIK', 'Elektrik'],
    ['SANAYI_ELEKTRIGI', 'Sanayi Elektriği'],
    ['SU', 'Su'],
    ['TELEFON', 'Telefon'],
    ['DOGALGAZ', 'Doğalgaz'],
    ['KANALIZASYON', 'Kanalizasyon'],
    ['ARITMA', 'Arıtma'],
    ['SONDAJ_KUYU', 'Sondaj & Kuyu'],
    ['YOLU_ACILMIS', 'Yolu Açılmış'],
    ['YOLU_ACILMAMIS', 'Yolu Açılmamış'],
    ['ZEMIN_ETUDU', 'Zemin Etüdü'],
    ['PARSELLI', 'Parselli'],
    ['PROJELI', 'Projeli'],
    ['KOSE_PARSEL', 'Köşe Parsel'],
  ],
  facade: [
    ['KUZEY', 'Kuzey'],
    ['GUNEY', 'Güney'],
    ['DOGU', 'Doğu'],
    ['BATI', 'Batı'],
  ],
  businessFeatures: [
    ['ODA_SERVISI', 'Oda Servisi'],
    ['STANDART_ODA', 'Standart'],
    ['MUTFAK', 'Mutfak'],
    ['KAHVALTI_SALONU', 'Kahvaltı Salonu'],
    ['KAPALI_RESTORAN', 'Kapalı Restoran'],
    ['CANLI_MUZIK', 'Canlı Müzik'],
    ['SNACK_BAR', 'Snack Bar'],
    ['TERAS_BAR', 'Teras Bar'],
    ['TOPLANTI_ODASI', 'Toplantı Odası'],
    ['CAY_OCAGI', 'Çay Ocağı'],
    ['ALKOL_IZNI', 'Alkol İzni'],
    ['KAFETERYA', 'Kafeterya'],
    ['SEMSIYE', 'Şemsiye'],
    ['SEZLONG', 'Şezlong'],
    ['OYUN_CAFE', 'Oyun Cafe'],
    ['MUAYENEHANE', 'Muayenehane'],
    ['TAMIRHANE', 'Tamirhane'],
    ['OTOMOTIV', 'Otomotiv'],
    ['MOTOSIKLET_SERVIS_BAKIM', 'Motosiklet Servis & Bakım'],
    ['AYAKKABICI_LOSTRA', 'Ayakkabıcı & Lostra'],
    ['MEFRUSATCI_PERDECI', 'Mefruşatçı & Perdeci'],
    ['PROVA_KAYIT_STUDYOSU', 'Prova & Kayıt Stüdyosu'],
    ['KUAFOR', 'Kuaför'],
    ['SU_BAYI', 'Su Bayi'],
    ['TEKEL_BAYI', 'Tekel Bayi'],
    ['TUP_BAYI', 'Tüp Bayi'],
  ],
};

export const PROPERTY_SELECT_OPTIONS: Record<string, readonly SelectOption[]> =
  mapEntries(PROPERTY_SELECT_ENTRIES);

export const PROPERTY_MULTI_SELECT_OPTIONS: Record<string, readonly SelectOption[]> =
  mapEntries(PROPERTY_MULTI_SELECT_ENTRIES);

// Shared amenity resolution: a label/value appearing in several groups
// (SAHIL, SPOR_SALONU) resolves FIRST-WINS here, and both the import mapper
// and the filter builder consume these indexes — import placement and
// search target can never diverge. Keys are the fixed TURKISH labels
// (trLabel), never the UI locale, so switching the UI to en cannot break
// the sahibinden import.
export const AMENITY_LABEL_TO_FIELD_VALUE: Record<
  string,
  readonly [fieldName: string, value: string]
> = {};
export const AMENITY_VALUE_TO_FIELD: Record<string, string> = {};

for (const [fieldName, entries] of Object.entries(PROPERTY_MULTI_SELECT_ENTRIES)) {
  for (const [value, label] of entries) {
    AMENITY_LABEL_TO_FIELD_VALUE[trLabel(label)] ??= [fieldName, value];
    AMENITY_VALUE_TO_FIELD[value] ??= fieldName;
  }
}

const buildTurkishLabelLookup = (
  entrySets: Record<string, ReadonlyArray<OptionEntry>>,
): Record<string, Record<string, string>> =>
  Object.fromEntries(
    Object.entries(entrySets).map(([fieldName, entries]) => [
      fieldName,
      Object.fromEntries(
        entries.map(([value, label]) => [trLabel(label), value]),
      ),
    ]),
  );

// raw export spellings that differ from the canonical label only by case
// or punctuation; keys are compared after trimming
export const AMENITY_LABEL_ALIASES: Record<string, string> = {
  'Wi-Fİ': 'Wi-Fi',
};

export const SAHIBINDEN_LABEL_TO_VALUE: Record<string, Record<string, string>> =
  buildTurkishLabelLookup({
    ...PROPERTY_SELECT_ENTRIES,
    ...PROPERTY_MULTI_SELECT_ENTRIES,
  });
