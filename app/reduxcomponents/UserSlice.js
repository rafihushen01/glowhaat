import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userData: null,
  loading: true,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload || null;
      state.loading = false;
    },
    clearUserData: (state) => {
      state.userData = null;
      state.loading = false;
    },
    setUserLoading: (state, action) => {
      state.loading = Boolean(action.payload);
    },
  },
});

export const { setUserData, clearUserData, setUserLoading } = userSlice.actions;
export default userSlice.reducer;
