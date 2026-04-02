"use client";

import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./CartSlice";
import userReducer from "./UserSlice";

export const Store = configureStore({
  reducer: {
    cart: cartReducer, // add your reducers here
    user: userReducer,
  },
  devTools: true,
});
