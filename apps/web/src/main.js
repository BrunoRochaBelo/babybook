import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@babybook/i18n";
import { AppRouter } from "./app/router";
import "./index.css";
const queryClient = new QueryClient();
ReactDOM.createRoot(document.getElementById("root")).render(_jsx(React.StrictMode, { children: _jsx(I18nProvider, { children: _jsx(QueryClientProvider, { client: queryClient, children: _jsx(AppRouter, {}) }) }) }));
