import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AppState {
    academicYearId: number | null;
}

const initialState: AppState = {
    academicYearId: null, // If null, backend defaults to current
};

const appSlice = createSlice({
    name: "app",
    initialState,
    reducers: {
        setAcademicYearId: (state, action: PayloadAction<number | null>) => {
            state.academicYearId = action.payload;
        },
    },
});

export const { setAcademicYearId } = appSlice.actions;
export const appReducer = appSlice.reducer;
