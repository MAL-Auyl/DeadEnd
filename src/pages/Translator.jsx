import { useLang } from '../context/LangContext';
import TranslatorPanel from '../components/TranslatorPanel';

export default function Translator() {
  const { t } = useLang();

  return (
    <div className="page" style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, color: 'var(--text)' }}>{t.trnsl_title}</h1>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{t.trnsl_subtitle}</p>
      </div>
      <TranslatorPanel />
    </div>
  );
}
