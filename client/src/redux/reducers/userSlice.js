import { createSlice } from "@reduxjs/toolkit";

// Check if a token exists in localStorage and set initialState accordingly
const token = localStorage.getItem("fittrack-app-token");

const initialState = {
  currentUser: token ? { token } : null, // If token exists, set currentUser, else null
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.currentUser = action.payload.user;
      localStorage.setItem("fittrack-app-token", action.payload.token);
    },
    logout: (state) => {
      state.currentUser = null;
      localStorage.removeItem("fittrack-app-token");
    },
  },
});

export const { loginSuccess, logout } = userSlice.actions;

export default userSlice.reducer;
