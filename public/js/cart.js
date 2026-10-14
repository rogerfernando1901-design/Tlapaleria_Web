/**
 * public/js/cart.js
 * Utilidad de carrito de compras en JavaScript Vanilla.
 * Historias: HU-06, HU-07.
 * Almacena en localStorage únicamente identificadores y cantidades,
 * delegando la validación de precios y existencias reales al backend.
 */

const CART_STORAGE_KEY = 'tlapaleria_cart_items';

const Cart = {
  /**
   * Obtiene los artículos del carrito
   * @returns {Array<{id: number, quantity: number, name: string, price_cents: number}>}
   */
  getItems() {
    try {
      const data = localStorage.getItem(CART_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error al leer carrito:', e);
      return [];
    }
  },

  /**
   * Guarda los artículos en localStorage y actualiza badges
   */
  saveItems(items) {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      this.updateBadge();
    } catch (e) {
      console.error('Error al guardar carrito:', e);
    }
  },

  /**
   * [HU-06] Agrega un producto al carrito acumulando cantidades sin duplicar renglones
   */
  addItem(product, quantity = 1) {
    const items = this.getItems();
    const existingIndex = items.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
      items[existingIndex].quantity += quantity;
    } else {
      items.push({
        id: product.id,
        name: product.name,
        price_cents: product.price_cents,
        image_url: product.image_url,
        unit: product.unit,
        quantity: quantity
      });
    }

    this.saveItems(items);
    return items;
  },

  /**
   * [HU-07] Modifica la cantidad de un producto
   */
  updateQuantity(productId, quantity) {
    let items = this.getItems();
    const qty = parseInt(quantity, 10);

    if (isNaN(qty) || qty <= 0) {
      items = items.filter(item => item.id !== productId);
    } else {
      const item = items.find(item => item.id === productId);
      if (item) {
        item.quantity = qty;
      }
    }

    this.saveItems(items);
    return items;
  },

  /**
   * [HU-07] Elimina un producto del carrito
   */
  removeItem(productId) {
    const items = this.getItems().filter(item => item.id !== productId);
    this.saveItems(items);
    return items;
  },

  /**
   * Vacía el carrito
   */
  clear() {
    localStorage.removeItem(CART_STORAGE_KEY);
    this.updateBadge();
  },

  /**
   * Total de piezas sumadas
   */
  getTotalCount() {
    return this.getItems().reduce((sum, item) => sum + (item.quantity || 0), 0);
  },

  /**
   * Actualiza el badge visual en la barra de navegación
   */
  updateBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const count = this.getTotalCount();
    badges.forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    });
  }
};

// Actualizar badge al cargar script
document.addEventListener('DOMContentLoaded', () => {
  Cart.updateBadge();
});
