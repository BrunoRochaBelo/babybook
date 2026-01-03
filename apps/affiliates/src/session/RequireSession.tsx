import { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { SessionRole, useSessionStore } from "./sessionStore";

export function RequireSession({
  role,
  children,
}: PropsWithChildren<{ role: SessionRole }>) {
  const session = useSessionStore((s) => s.session);

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.role !== role) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
