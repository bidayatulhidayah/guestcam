import './boot';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './i18n';
import { startServiceWorker } from './lib/device/serviceWorker';
import './styles/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Missing #root element');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

startServiceWorker();
