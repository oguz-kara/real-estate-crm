import { type CSSProperties, type SyntheticEvent, useState } from 'react';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  closeSidePanel,
  enqueueSnackbar,
  openSidePanelPage,
  SidePanelPages,
  unmountFrontComponent,
  useSelectedRecordIds,
} from 'twenty-sdk/front-component';

import { INTAKE_MIN_TEXT_LENGTH } from 'src/constants/intake-limits';
import { TALEP_CIKAR_FORM_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/intake-ids';
import { canSubmitIntake, intakeSuccessMessage, selectionHint } from 'src/intake/intake-form-state';
import type { IntakeResult, IntakeSource } from 'src/intake/run-intake';

// CSS variables instead of twenty-ui imports: the SDK mocks the UI package
// during manifest extraction.
const theme = {
  spacing2: 'var(--t-spacing-2)',
  spacing3: 'var(--t-spacing-3)',
  spacing4: 'var(--t-spacing-4)',
  spacing8: 'var(--t-spacing-8)',
  bgPrimary: 'var(--t-background-primary)',
  bgSecondary: 'var(--t-background-secondary)',
  borderMedium: 'var(--t-border-color-medium)',
  borderLight: 'var(--t-border-color-light)',
  radiusSm: 'var(--t-border-radius-sm)',
  fontPrimary: 'var(--t-font-color-primary)',
  fontSecondary: 'var(--t-font-color-secondary)',
  fontTertiary: 'var(--t-font-color-tertiary)',
  fontInverted: 'var(--t-font-color-inverted)',
  fontFamily: 'var(--t-font-family)',
  sizeXs: 'var(--t-font-size-xs)',
  sizeSm: 'var(--t-font-size-sm)',
  sizeMd: 'var(--t-font-size-md)',
  weightMedium: 'var(--t-font-weight-medium)',
  weightSemiBold: 'var(--t-font-weight-semi-bold)',
  blue: 'var(--t-color-blue)',
  accent: 'var(--t-accent-accent4060)',
};

const SOURCE_OPTIONS: Array<{ value: IntakeSource | ''; label: string }> = [
  { value: '', label: 'Belirtilmedi' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'TELEFON', label: 'Telefon' },
  { value: 'YUZ_YUZE', label: 'Yüz yüze' },
  { value: 'DEFTER', label: 'Defter' },
  { value: 'DIGER', label: 'Diğer' },
];

const field: CSSProperties = {
  background: theme.bgSecondary,
  border: `1px solid ${theme.borderMedium}`,
  borderRadius: theme.radiusSm,
  padding: `${theme.spacing2} ${theme.spacing3}`,
  color: theme.fontPrimary,
  fontSize: theme.sizeSm,
  fontFamily: theme.fontFamily,
  width: '100%',
  boxSizing: 'border-box',
};

const styles: Record<string, CSSProperties> = {
  container: {
    fontFamily: theme.fontFamily,
    fontSize: theme.sizeSm,
    color: theme.fontPrimary,
    background: theme.bgPrimary,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    boxSizing: 'border-box',
  },
  header: { padding: theme.spacing4, borderBottom: `1px solid ${theme.borderLight}` },
  title: { fontSize: theme.sizeMd, fontWeight: theme.weightSemiBold, margin: 0 },
  subtitle: { fontSize: theme.sizeSm, color: theme.fontTertiary, margin: `${theme.spacing2} 0 0` },
  body: {
    flex: 1,
    minHeight: 0,
    padding: theme.spacing4,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing2,
  },
  label: { fontSize: theme.sizeXs, fontWeight: theme.weightMedium, color: theme.fontSecondary },
  textarea: { ...field, flex: 1, minHeight: '160px', resize: 'none', lineHeight: 1.5 },
  select: { ...field, height: theme.spacing8, cursor: 'pointer' },
  helper: { fontSize: theme.sizeXs, color: theme.fontTertiary },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing2,
    padding: theme.spacing3,
    borderTop: `1px solid ${theme.borderLight}`,
  },
  button: {
    height: theme.spacing8,
    padding: `0 ${theme.spacing3}`,
    borderRadius: theme.radiusSm,
    fontSize: theme.sizeSm,
    fontFamily: theme.fontFamily,
    fontWeight: theme.weightMedium,
    cursor: 'pointer',
    border: '1px solid transparent',
  },
  secondary: {
    background: theme.bgSecondary,
    color: theme.fontSecondary,
    border: `1px solid ${theme.borderMedium}`,
  },
  primary: { background: theme.blue, color: theme.fontInverted },
  primaryDisabled: { background: theme.accent, cursor: 'not-allowed' },
};

// Remote DOM events carry the value in detail; plain DOM events in target.
const readValue = (event: SyntheticEvent<HTMLElement>): string | undefined => {
  const object = event as { detail?: { value?: string }; target?: { value?: string } };

  return object.detail?.value ?? object.target?.value;
};

const TalepCikarForm = () => {
  const selectedRecordIds = useSelectedRecordIds();
  const personId = selectedRecordIds.length === 1 ? selectedRecordIds[0] : null;
  const [text, setText] = useState('');
  const [source, setSource] = useState<IntakeSource | ''>('');
  const [submitting, setSubmitting] = useState(false);

  const handleTextChange = (event: SyntheticEvent<HTMLElement>) => {
    const value = readValue(event);
    if (typeof value === 'string') {
      setText(value);
    }
  };

  const handleClose = () => {
    unmountFrontComponent();
    closeSidePanel();
  };

  const canSubmit = canSubmitIntake({ text, selectedCount: selectedRecordIds.length, submitting });

  const handleSubmit = async () => {
    if (!canSubmit || personId === null) {
      return;
    }
    setSubmitting(true);
    try {
      const result = await new RestApiClient().post<IntakeResult>('/s/talep/cikar', {
        personId,
        text,
        ...(source === '' ? {} : { source }),
      });
      await enqueueSnackbar({
        message: intakeSuccessMessage(result),
        variant: result.outcome === 'ok' ? 'success' : 'warning',
      });
      await openSidePanelPage({
        page: SidePanelPages.ViewRecord,
        recordId: result.draftId,
        objectNameSingular: 'buyerRequest',
      });
    } catch {
      // the text stays in the form so nothing typed is lost
      await enqueueSnackbar({ message: 'Taslak oluşturulamadı, tekrar deneyin.', variant: 'error' });
      setSubmitting(false);
    }
  };

  const hint = selectionHint(selectedRecordIds.length);
  const remaining = INTAKE_MIN_TEXT_LENGTH - text.trim().length;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Metinden talep çıkar</h2>
        <p style={styles.subtitle}>
          Telefon numarası, e-posta ve kişinin adı yapay zekaya gönderilmeden önce gizlenir. Sonuç onay
          bekleyen bir taslak olur.
        </p>
      </div>

      <div style={styles.body}>
        <label htmlFor="talep-metni" style={styles.label}>
          Metin
        </label>
        <textarea
          id="talep-metni"
          value={text}
          placeholder="WhatsApp mesajı, görüşme notu ya da transkript metnini yapıştırın"
          onInput={handleTextChange}
          onChange={handleTextChange}
          disabled={submitting}
          style={styles.textarea}
        />
        <span style={styles.helper}>
          {remaining > 0 ? `En az ${INTAKE_MIN_TEXT_LENGTH} karakter (${remaining} kaldı)` : `${text.trim().length} karakter`}
        </span>

        <label htmlFor="talep-kaynagi" style={styles.label}>
          Kaynak
        </label>
        <select
          id="talep-kaynagi"
          value={source}
          onChange={(event) => {
            const value = readValue(event);
            const option = SOURCE_OPTIONS.find((candidate) => candidate.value === value);
            if (option !== undefined) {
              setSource(option.value);
            }
          }}
          disabled={submitting}
          style={styles.select}
        >
          {SOURCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {hint !== null && <span style={styles.helper}>{hint}</span>}
      </div>

      <div style={styles.footer}>
        <button
          type="button"
          style={{ ...styles.button, ...styles.secondary }}
          onClick={handleClose}
          disabled={submitting}
        >
          Vazgeç
        </button>
        <button
          type="button"
          style={{ ...styles.button, ...styles.primary, ...(canSubmit ? {} : styles.primaryDisabled) }}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? 'Çıkarılıyor…' : 'Taslak çıkar'}
        </button>
      </div>
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier: TALEP_CIKAR_FORM_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'talep-cikar-form',
  description: 'Serbest metinden taslak talep çıkarma formu.',
  component: TalepCikarForm,
});
