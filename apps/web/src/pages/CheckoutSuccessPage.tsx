import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMockComplete } from "@/hooks/api";
import { useUserProfile } from "@/hooks/api";
import { Button } from "@/components/ui/button";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const query = useQuery();
  const mockComplete = useMockComplete();
  const { refetch } = useUserProfile();

  useEffect(() => {
    (async () => {
      const accountId = query.get("account_id");
      const packageKey = query.get("package_key") || "unlimited_social";
      if (accountId) {
        try {
          await mockComplete.mutateAsync({ accountId, packageKey });
          // re-fetch profile and navigate to app
          await refetch();
          navigate("/jornada");
        } catch (err) {
          console.error(err);
        }
      }
    })();
  }, []);

  return (
    <div className="p-6 max-w-md mx-auto text-center">
      <h1 className="text-2xl font-semibold mb-4">Pagamento confirmado</h1>
      <p className="mb-4">Redirecionando para a aplicação...</p>
      <Button onClick={() => navigate("/jornada")}>Ir para a aplicação</Button>
    </div>
  );
}

export default CheckoutSuccessPage;
