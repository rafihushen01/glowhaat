// app/reduxcomponents/cartSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  cartItems: [],
  isOpen: false,
  subtotal: 0,
};

const safeNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const recalculateSubtotal = (items = []) =>
  items.reduce((sum, item) => sum + safeNumber(item.totalprice), 0);

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Action to toggle cart visibility
    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },
    setCartItems: (state, action) => {
      const items = Array.isArray(action.payload) ? action.payload : [];
      state.cartItems = items;
      state.subtotal = recalculateSubtotal(items);
    },
    addToCart: (state, action) => {
      const incoming = action.payload;
      if (!incoming?._id) {
        return;
      }
      const existingIndex = state.cartItems.findIndex((item) => item._id === incoming._id);
      if (existingIndex >= 0) {
        state.cartItems[existingIndex] = incoming;
      } else {
        state.cartItems.unshift(incoming);
      }
      state.subtotal = recalculateSubtotal(state.cartItems);
    },
    updateCartItem: (state, action) => {
      const incoming = action.payload;
      if (!incoming?._id) return;
      const index = state.cartItems.findIndex((item) => item._id === incoming._id);
      if (index >= 0) {
        state.cartItems[index] = incoming;
        state.subtotal = recalculateSubtotal(state.cartItems);
      }
    },
    removeFromCart: (state, action) => {
      const id = action.payload;
      state.cartItems = state.cartItems.filter((item) => item._id !== id);
      state.subtotal = recalculateSubtotal(state.cartItems);
    },
    clearCart: (state) => {
      state.cartItems = [];
      state.subtotal = 0;
    },
  },
});

export const {
  toggleCart,
  setCartItems,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = cartSlice.actions;
export default cartSlice.reducer;
