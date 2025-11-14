export function Footer() {
  return (
    <footer className="py-12 border-t border-border/50 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Baby Book
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Feito com carinho para famílias
            </p>
          </div>
          <div className="flex gap-6 text-sm">
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacidade
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Termos
            </a>
            <a
              href="#pricing"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Preços
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
