import './boot';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './i18n';
import { startServiceWorker } from './lib/device/serviceWorker';
import { applyTextSize, readTextSize } from './lib/device/textSize';
import './styles/index.css';

// Before the first render, so a Besar choice never flashes at Biasa.
applyTextSize(readTextSize());

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Missing #root element');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

startServiceWorker();
