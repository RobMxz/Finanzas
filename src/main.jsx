import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";
import { ToastProvider } from "./components/ui/Toast";
import App from "./App.jsx";
import "./index.css";
import useAppStore from "./store/useAppStore";

const system = createSystem(defaultConfig);

useAppStore.getState().initAuth();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ChakraProvider value={system}>
      <ThemeProvider attribute="class" disableTransitionOnChange>
        <ToastProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </ChakraProvider>
  </StrictMode>,
);
