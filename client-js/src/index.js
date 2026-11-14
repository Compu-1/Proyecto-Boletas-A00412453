import './styles/main.css';
import { Ice } from 'ice';
import './generated/BookingService.js';

console.log('[Icesi Live Arena] Inicializando frontend...');
console.log('[ZeroC Ice] Ice runtime version:', Ice.stringVersion ? Ice.stringVersion() : '3.7.x');

const app = document.getElementById('app');
if (app) {
  app.innerHTML = `
    <header style="padding: 1rem 0; border-bottom: 2px solid var(--border); margin-bottom: 1.5rem;">
      <h1 style="color: var(--primary);">Icesi Live Arena</h1>
      <p style="color: var(--text-muted);">Sistema Distribuido de Reserva de Boletas (ZeroC Ice & Vanilla JS)</p>
    </header>
    <main>
      <div style="background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border);">
        <h2>Frontend inicializado con éxito</h2>
        <p>Webpack y ZeroC Ice integrados correctamente. Listo para conectar al backend.</p>
      </div>
    </main>
  `;
}
