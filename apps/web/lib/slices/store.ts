import { configureStore } from "@reduxjs/toolkit";
import { taskSlice } from "./taskSlice";

export const store = configureStore({
  reducer: { task: taskSlice.reducer },
});

export type RootState = ReturnType<typeof store.getState>;
