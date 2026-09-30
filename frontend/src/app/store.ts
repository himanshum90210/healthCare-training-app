import {configureStore} from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";

export const store = configureStore ({
    reducer: {
    // will be adding here as we build auth first)
        auth: authReducer
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


