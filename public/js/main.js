/**
 * public/js/main.js
 * Script común para control de sesión en cabecera, navegación y utilidades.
 */

const App = {
  currentUser: null,

  /**
   * Consulta el estado de autenticación actual
   */
  async checkAuth() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      this.currentUser = data.authenticated ? data.user : null;
      this.renderNav();
      return this.currentUser;
    } catch (err) {
      console.error('Error verificando sesión:', err);
      this.currentUser = null;
      this.renderNav();
      return null;
    }
  },

  /**
   * Renderiza la cabecera según el estado del usuario (Visitante vs Autenticado vs Admin)
   */
  renderNav() {
    const navActions = document.getElementById('headerActions');
    if (!navActions) return;

    if (this.currentUser) {
      const isAdmin = this.currentUser.role === 'ADMINISTRADOR';
      navActions.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 0.88rem; color: var(--color-primary); font-weight: 600;">
            Hola, ${escapeHtml(this.currentUser.name.split(' ')[0])}
          </span>
          <a href="/perfil.html" class="user-nav-link" title="Mi Cuenta y Pedidos">
            👤 Mi Cuenta
          </a>
          ${isAdmin ? `
            <a href="/admin/index.html" class="btn btn-sm btn-secondary" style="border-color: var(--color-accent); color: var(--color-accent);">
              ⚙ Panel Admin
            </a>
          ` : ''}
          <a href="/carrito.html" class="cart-nav-link">
            🛒 Carrito <span class="cart-badge" style="display: none;">0</span>
          </a>
          <button id="logoutBtn" class="btn btn-sm btn-secondary" style="padding: 4px 10px; font-size: 0.8rem;">
            Salir
          </button>
        </div>
      `;

      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => this.logout());
      }
    } else {
      navActions.innerHTML = `
        <a href="/carrito.html" class="cart-nav-link" style="margin-right: 8px;">
          🛒 Carrito <span class="cart-badge" style="display: none;">0</span>
        </a>
        <a href="/login.html" class="btn btn-secondary btn-sm">Iniciar sesión</a>
        <a href="/registro.html" class="btn btn-primary btn-sm">Crear cuenta</a>
      `;
    }

    if (window.Cart) {
      window.Cart.updateBadge();
    }
  },

  /**
   * Cierra la sesión activa
   */
  async logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      this.currentUser = null;
      window.location.href = '/login.html';
    } catch (e) {
      console.error('Error cerrando sesión:', e);
      window.location.reload();
    }
  }
};

/**
 * Escapar cadenas HTML para prevenir vulnerabilidades XSS
 */
function escapeHtml(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Formatear importes a formato de moneda mexicana ($ 00.00 MXN)
 */
function formatMXN(amount) {
  const num = parseFloat(amount);
  if (isNaN(num)) return '$0.00';
  return '$' + num.toFixed(2);
}

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  App.checkAuth();
});
