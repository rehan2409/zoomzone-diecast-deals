import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product } from '@/types';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number, maxStock?: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product: Product) => {
        set((state) => {
          const existingItem = state.items.find(item => item.product.id === product.id);
          const maxStock = product.stock || 1;
          
          if (existingItem) {
            // Don't exceed available stock
            const newQuantity = Math.min(existingItem.quantity + 1, maxStock);
            return {
              items: state.items.map(item =>
                item.product.id === product.id
                  ? { ...item, quantity: newQuantity, product: { ...item.product, stock: product.stock } }
                  : item
              ),
            };
          }
          return { items: [...state.items, { product, quantity: 1 }] };
        });
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter(item => item.product.id !== productId),
        }));
      },

      updateQuantity: (productId: string, quantity: number, maxStock?: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        const finalQuantity = maxStock ? Math.min(quantity, maxStock) : quantity;
        set((state) => ({
          items: state.items.map(item =>
            item.product.id === productId
              ? { ...item, quantity: finalQuantity }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.product.price * item.quantity, 0);
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'zoomzone-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
