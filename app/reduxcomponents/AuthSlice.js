import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthUser: (state, action) => {
      state.user = action.payload || null;
      state.isAuthenticated = Boolean(action.payload);
      state.loading = false;
    },
    clearAuthUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
    },
    setAuthLoading: (state, action) => {
      state.loading = Boolean(action.payload);
    },
  },
});

export const { setAuthUser, clearAuthUser, setAuthLoading } = authSlice.actions;
export default authSlice.reducer;
