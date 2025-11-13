import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Heart, Mail } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface AuthLoginProps {
  onLogin: () => void;
}

export function AuthLogin({ onLogin }: AuthLoginProps) {
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#FAF8F5] via-[#F5F1EC] to-[#EDE8E2]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4 text-primary">
            <Heart className="w-10 h-10 fill-current" />
          </div>
          <h1 className="text-4xl mb-2">Bem-vindo ao seu Cofre</h1>
          <p className="text-muted-foreground">Entre para começar a guardar memórias</p>
        </div>

        <Card className="p-6 sm:p-8 shadow-xl border-border">
          <div className="space-y-3 sm:space-y-4 mb-6">
            <Button 
              variant="outline" 
              className="w-full h-12 sm:h-14 rounded-xl active:scale-[0.98] transition-all"
              onClick={onLogin}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar com Google
            </Button>

            <Button 
              variant="outline" 
              className="w-full h-12 sm:h-14 rounded-xl active:scale-[0.98] transition-all"
              onClick={onLogin}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              Continuar com Apple
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-card text-muted-foreground">ou com e-mail</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-input-background"
                />
              </div>
            </div>

            <Button 
              className="w-full h-12 sm:h-14 rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all"
              onClick={onLogin}
            >
              Continuar
            </Button>
          </div>

          <p className="text-sm text-muted-foreground text-center mt-6">
            Ao continuar, você concorda com nossos{" "}
            <a href="#" className="text-primary hover:underline">Termos de Uso</a> e{" "}
            <a href="#" className="text-primary hover:underline">Política de Privacidade</a>
          </p>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Possui um vale-presente?{" "}
          <button className="text-primary hover:underline">Resgatar aqui</button>
        </p>
      </motion.div>
    </div>
  );
}
