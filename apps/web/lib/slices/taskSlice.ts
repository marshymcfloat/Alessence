import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isShown: false,
  isEditing: false,
};

export const taskSlice = createSlice({
  name: "task",
  initialState,
  reducers: {
    formVisibility(state, action) {
      state.isShown = action.payload;
    },
  },
});

export const taskSliceAction = taskSlice.actions;
