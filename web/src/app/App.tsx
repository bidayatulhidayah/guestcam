import { useTranslation } from 'react-i18next';
import { BrowserRouter } from 'react-router';
import { Button, LanguageToggle, Screen, Tile } from '../components/ui';

/** Temporary design check; replaced by the router in the routes step. */
export function App() {
  const { t } = useTranslation();
  return (
    <BrowserRouter>
      <Screen eyebrow={t('appName')} title="Zaim & Hidayah" bottom={<LanguageToggle />}>
        <div className="grid grid-cols-2 gap-4">
          <Tile icon="□" label={t('menu.snapshot')} />
          <Tile icon="□" label={t('menu.gallery')} wide />
        </div>
        <Button variant="primary">{t('pages.codeScreen.title')}</Button>
      </Screen>
    </BrowserRouter>
  );
}
