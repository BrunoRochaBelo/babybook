import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Heart } from "lucide-react";
import { Button } from "./ui/button";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-[#FFFCF9] shadow-md"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-[#D97757]" />
              <span className={`transition-colors ${isScrolled ? "text-gray-900" : "text-white"}`}>
                Baby Book
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection("como-funciona")}
                className={`transition-colors hover:text-[#D97757] ${
                  isScrolled ? "text-gray-700" : "text-white"
                }`}
              >
                Como Funciona
              </button>
              <button
                onClick={() => scrollToSection("presentear")}
                className={`transition-colors hover:text-[#D97757] ${
                  isScrolled ? "text-gray-700" : "text-white"
                }`}
              >
                Presentear
              </button>
              <button
                onClick={() => scrollToSection("preco")}
                className={`transition-colors hover:text-[#D97757] ${
                  isScrolled ? "text-gray-700" : "text-white"
                }`}
              >
                Preço
              </button>
              <Button
                size="sm"
                onClick={() => scrollToSection("preco")}
                className="bg-[#D97757] hover:bg-[#C96647] text-white"
              >
                Começar minha história
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className={`w-6 h-6 ${isScrolled ? "text-gray-900" : "text-white"}`} />
              ) : (
                <Menu className={`w-6 h-6 ${isScrolled ? "text-gray-900" : "text-white"}`} />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-[#FFFCF9] md:hidden"
          >
            <div className="flex flex-col items-center justify-center h-full gap-8">
              <button
                onClick={() => scrollToSection("como-funciona")}
                className="text-2xl text-gray-700 hover:text-[#D97757]"
              >
                Como Funciona
              </button>
              <button
                onClick={() => scrollToSection("presentear")}
                className="text-2xl text-gray-700 hover:text-[#D97757]"
              >
                Presentear
              </button>
              <button
                onClick={() => scrollToSection("preco")}
                className="text-2xl text-gray-700 hover:text-[#D97757]"
              >
                Preço
              </button>
              <Button
                size="lg"
                onClick={() => scrollToSection("preco")}
                className="bg-[#D97757] hover:bg-[#C96647] text-white mt-4"
              >
                Começar minha história
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
