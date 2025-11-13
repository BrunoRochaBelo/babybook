import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Separator } from "./ui/separator";
import { Heart, Check, CreditCard, Smartphone } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface CheckoutProps {
  onComplete: () => void;
}

export function Checkout({ onComplete }: CheckoutProps) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "pix">("card");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F5] via-[#F5F1EC] to-[#EDE8E2] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4 text-primary">
            <Heart className="w-8 h-8 fill-current" />
          </div>
          <h1 className="text-4xl mb-2">Finalize sua compra</h1>
          <p className="text-muted-foreground">Acesso vitalício ao Cofre de Memórias Digital</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Resumo do Pedido */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-1"
          >
            <Card className="p-6 sticky top-4">
              <h3 className="mb-4">Resumo do Pedido</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cofre de Memórias</span>
                  <span>R$ 199,00</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span>Total</span>
                  <span className="text-2xl text-primary">R$ 199,00</span>
                </div>
              </div>

              <div className="bg-secondary/20 rounded-xl p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Acesso vitalício completo</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">5 anos de streaming incluído</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Armazenamento ilimitado</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Exportação completa garantida</span>
                </div>
              </div>

              <Button variant="link" className="w-full mt-4 text-primary">
                Possui um vale-presente?
              </Button>
            </Card>
          </motion.div>

          {/* Formulário de Pagamento */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="p-8">
              <h3 className="mb-6">Forma de Pagamento</h3>

              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "card" | "pix")} className="mb-8">
                <div className="flex items-center space-x-2 border border-border rounded-xl p-4 cursor-pointer hover:bg-muted/50 transition-smooth">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <span>Cartão de Crédito</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border border-border rounded-xl p-4 cursor-pointer hover:bg-muted/50 transition-smooth">
                  <RadioGroupItem value="pix" id="pix" />
                  <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Smartphone className="w-5 h-5 text-primary" />
                    <span>PIX - Pagamento Instantâneo</span>
                  </Label>
                </div>
              </RadioGroup>

              {paymentMethod === "card" ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cardName">Nome no Cartão</Label>
                    <Input 
                      id="cardName"
                      placeholder="Como está no cartão"
                      className="mt-2 h-12 rounded-xl bg-input-background"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cardNumber">Número do Cartão</Label>
                    <Input 
                      id="cardNumber"
                      placeholder="0000 0000 0000 0000"
                      className="mt-2 h-12 rounded-xl bg-input-background"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry">Validade</Label>
                      <Input 
                        id="expiry"
                        placeholder="MM/AA"
                        className="mt-2 h-12 rounded-xl bg-input-background"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input 
                        id="cvv"
                        placeholder="123"
                        type="password"
                        maxLength={3}
                        className="mt-2 h-12 rounded-xl bg-input-background"
                      />
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div>
                    <Label htmlFor="email">E-mail para Recibo</Label>
                    <Input 
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="mt-2 h-12 rounded-xl bg-input-background"
                    />
                  </div>

                  <Button 
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 transition-smooth mt-6"
                    onClick={onComplete}
                  >
                    Finalizar Compra - R$ 199,00
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-muted rounded-xl p-6 text-center">
                    <div className="w-48 h-48 mx-auto bg-white rounded-xl flex items-center justify-center mb-4">
                      <div className="text-xs text-muted-foreground">QR Code PIX apareceria aqui</div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Escaneie o código QR com o app do seu banco</p>
                    <p className="text-sm">ou copie o código abaixo:</p>
                  </div>

                  <div className="flex gap-2">
                    <Input 
                      value="00020126580014BR.GOV.BCB.PIX..."
                      readOnly
                      className="h-12 rounded-xl bg-input-background font-mono text-sm"
                    />
                    <Button variant="outline" className="h-12 rounded-xl">
                      Copiar
                    </Button>
                  </div>

                  <div className="bg-secondary/20 rounded-xl p-4">
                    <p className="text-sm text-center text-muted-foreground">
                      Após o pagamento, você receberá acesso imediato ao seu Cofre de Memórias
                    </p>
                  </div>

                  <Button 
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 transition-smooth"
                    onClick={onComplete}
                  >
                    Já Fiz o Pagamento
                  </Button>
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center mt-6">
                Pagamento seguro processado via Stripe/Mercado Pago<br />
                Seus dados estão protegidos e criptografados
              </p>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
