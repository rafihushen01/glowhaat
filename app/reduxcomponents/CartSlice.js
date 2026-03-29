// app/reduxcomponents/cartSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  cartItems: [],
  isOpen: false,
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Action to toggle cart visibility
    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },
    // Action to add item
    addToCart: (state, action) => {
      state.cartItems.push(action.payload);
    },
  },
});

export const { toggleCart, addToCart } = cartSlice.actions;
export default cartSlice.reducer;