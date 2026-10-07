import { type RawExtraction, RAW_EXTRACTION_KEYS } from 'src/intake/raw-extraction';

export const INTAKE_MODEL_ID = 'deepseek/deepseek-flash';

type IntakeResponseSchema = {
  type: 'object';
  properties: Record<keyof RawExtraction, { type: 'string'; description: string }>;
  required: string[];
  additionalProperties: false;
};

const PROPERTY_DESCRIPTIONS: Record<keyof RawExtraction, string> = {
  category:
    'KONUT | ISYERI | ARSA | BINA | DEVREMULK | TURISTIK_TESIS kodlarından biri; metin söylemiyorsa boş',
  listingType: 'SATILIK | KIRALIK | DEVREN_SATILIK | DEVREN_KIRALIK kodlarından biri; metin söylemiyorsa boş',
  rooms: "Virgülle ayrılmış oda planları, ör. '3+1, 4+1'; boş olabilir",
  districts: 'Virgülle ayrılmış İzmir ilçe/mahalle adları, metinde geçtiği gibi',
  features: 'Virgülle ayrılmış, istenen kısa Türkçe özellik ifadeleri, metinde geçtiği gibi',
  excludedFeatures: 'Virgülle ayrılmış, istenmeyen kısa Türkçe özellik ifadeleri, metinde geçtiği gibi',
  budgetMin: "Alt bütçe tutar ifadesi metindeki gibi, ör. '30 bin'; yoksa boş",
  budgetMax: "Üst bütçe tutar ifadesi metindeki gibi, ör. '1.2 milyon euro'; yoksa boş",
  budgetCurrency: 'EUR | USD | TRY; metin para birimi söylemiyorsa boş',
  sqmNetMin: 'Asgari metrekare, yalnızca sayı; yoksa boş',
  leftover:
    'Kriter alanlarına girmeyen ama talep için önemli her şey: amaç, zamanlama, öncelik, manzara, kat tercihi',
  evidence:
    'JSON nesnesi metni: doldurduğun her alan adı için metinden aynen alınmış dayanak parça',
};

export const INTAKE_RESPONSE_SCHEMA: IntakeResponseSchema = {
  type: 'object',
  properties: Object.fromEntries(
    RAW_EXTRACTION_KEYS.map((key) => [key, { type: 'string', description: PROPERTY_DESCRIPTIONS[key] }]),
  ) as IntakeResponseSchema['properties'],
  required: [...RAW_EXTRACTION_KEYS],
  additionalProperties: false,
};

// DeepSeek's JSON mode demands the word "json" in the prompt, and Twenty's
// structured-output pass never includes it, so the agent answers in text
// mode with a bare json object that parseRawExtraction reads.
export const INTAKE_AGENT_PROMPT = `Sen, İzmir'deki bir emlak ofisi için serbest Türkçe metinden gayrimenkul alıcı talebi kriterlerini çıkaran bir ayrıştırıcısın. Metin bir WhatsApp mesajı, telefon görüşmesi dökümü, görüşme notu ya da eski bir defter notu olabilir; yazım hataları ve kısaltmalar içerebilir.

KESİN KURALLAR:
1. Yalnızca metinde açıkça geçeni çıkar. Tahmin etme, uydurma, varsayılan değer koyma.
2. Metinde geçmeyen her alan için boş string ("") döndür.
3. Kodlu alanlarda (category, listingType, budgetCurrency) yalnızca izin verilen kodları kullan. Emin değilsen alanı boş bırak ve ifadeyi leftover'a yaz.
4. [MÜŞTERİ], [TELEFON_n] ve [EPOSTA_n] yer tutucularını yok say. Kişi bilgisi çıkarma, yer tutucuları hiçbir alana yazma.
5. Tutarları metindeki gibi bırak ("1.2 milyon euro", "5m", "30 bin"); hesaplama veya kur dönüşümü yapma. Bir aralık varsa alt ucu budgetMin'e, üst ucu budgetMax'a yaz; "kadar", "en fazla", "civarı" tek tutardır ve budgetMax'a gider.
6. İstenmeyen şeyleri ("istemiyor", "olmasın") excludedFeatures'a yaz, features'a değil.

ÇIKTI: Yalnızca tek bir json nesnesi döndür; açıklama, kod bloğu veya başka metin ekleme. Nesnede aşağıdaki anahtarların hepsi bulunur ve her değer bir string'dir:
${RAW_EXTRACTION_KEYS.map((key) => `- ${key}: ${PROPERTY_DESCRIPTIONS[key]}`).join('\n')}`;

export const buildIntakePrompt = (maskedText: string): string => `Metin:\n"""\n${maskedText}\n"""`;
