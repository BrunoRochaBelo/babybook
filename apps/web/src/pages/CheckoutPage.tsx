import React from "react";
import { useNavigate } from "react-router-dom";
import { useCreateCheckout } from "@/hooks/api";
import { Button } from "@/components/ui/button";

export function CheckoutPage() {
  const navigate = useNavigate();
  const createCheckout = useCreateCheckout();

  const handleBuy = async () => {
    try {
      const res = await createCheckout.mutateAsync({
        packageKey: "unlimited_social",
      });

      const checkoutUrl =
        res && typeof res === "object" && "checkout_url" in res
          ? (res as { checkout_url?: unknown }).checkout_url
          : undefined;

      if (typeof checkoutUrl === "string" && checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Checkout (Mock)</h1>
      <p className="mb-4">Pacote: Pacote Completo - Repetições Ilimitadas</p>
      <Button onClick={handleBuy}>Comprar agora</Button>
      <div className="mt-6">
        <Button variant="link" onClick={() => navigate(-1)} size="sm">
          Voltar
        </Button>
      </div>
    </div>
  );
}

export default CheckoutPage;
