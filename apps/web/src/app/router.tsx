import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { MainDashboardPage } from "@/features/dashboard/pages/MainDashboardPage";
import { CaraCrachaPage } from "@/features/showcase";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainDashboardPage />,
  },
  {
    path: "/dashboard",
    element: <MainDashboardPage />,
  },
  {
    path: "/cara-cracha",
    element: <CaraCrachaPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
