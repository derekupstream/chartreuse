import { useReducer } from "react";

interface ErrorState {
  error?: string;
}
interface LoadingState extends ErrorState {
  isLoading: true;
}
interface LoadedState extends ErrorState {
  isLoading: false;
}

export default function useLoadingState<T>(initialState: Partial<T> = {}) {
  return useReducer(
    (
      state: T & (LoadingState | LoadedState),
      newState: Partial<T & (LoadingState | LoadedState)>
    ) => ({ ...state, ...newState }),
    { isLoading: true, ...initialState } as T & LoadingState
  );
}
