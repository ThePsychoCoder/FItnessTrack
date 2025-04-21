import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage"; // localStorage for persistence
import userReducer from "./reducers/userSlice";

// Redux Persist configuration
const persistConfig = {
  key: "root", // root state key for persist
  version: 1, // version number for state migration
  storage, // storage type (localStorage in this case)
};

// Combine reducers
const rootReducer = combineReducers({
  user: userReducer, // Adding userReducer for user-related state management
});

// Wrap rootReducer with persistReducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store with persistedReducer and custom middleware
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoreActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER], // Ignore specific persistence actions for serializable checks
      },
    }),
});

// Initialize persistor to control the persistence
export const persistor = persistStore(store);

// You can call persistor.purge() on logout to clear persisted state if necessary
// Example: persistor.purge();
