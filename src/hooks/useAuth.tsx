// Re-export hook and provider from separate files to avoid
// react-refresh warnings about mixing components and hooks.
export { useAuth } from "./useAuth";
export { AuthProvider } from "./AuthProvider";
