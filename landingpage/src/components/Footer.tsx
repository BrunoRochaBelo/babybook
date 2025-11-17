import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-12 bg-gray-900 text-white">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#D97757]" />
            <span>Baby Book</span>
          </div>
          
          <p className="text-sm text-gray-400">
            © 2025 Baby Book. Feito com carinho para famílias.
          </p>
          
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Privacidade
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Termos
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Contato
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
