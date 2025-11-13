import { jsx as _jsx } from "react/jsx-runtime";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { MainDashboardPage } from "@/features/dashboard/pages/MainDashboardPage";
import { CaraCrachaPage } from "@/features/showcase";
const router = createBrowserRouter([
    {
        path: "/",
        element: _jsx(MainDashboardPage, {}),
    },
    {
        path: "/dashboard",
        element: _jsx(MainDashboardPage, {}),
    },
    {
        path: "/cara-cracha",
        element: _jsx(CaraCrachaPage, {}),
    },
]);
export function AppRouter() {
    return _jsx(RouterProvider, { router: router });
}
