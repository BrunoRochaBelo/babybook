/**
 * Partner Breadcrumbs
 *
 * Componente de navegação em breadcrumbs para o Portal do Parceiro.
 * Usado em páginas mais profundas para facilitar navegação.
 */

import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PartnerBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumbs para navegação hierárquica.
 * 
 * @example
 * <PartnerBreadcrumbs
 *   items={[
 *     { label: "Entregas", href: "/partner/deliveries" },
 *     { label: "Ensaio Newborn - Maria" },
 *   ]}
 * />
 */
export function PartnerBreadcrumbs({
  items,
  className,
}: PartnerBreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("hidden md:flex items-center gap-1 text-sm mb-4", className)}
    >
      {/* Home sempre é o primeiro */}
      <Link
        to="/partner"
        className="text-gray-400 dark:text-gray-500 hover:text-pink-600 dark:hover:text-pink-400 transition-colors p-1 -ml-1 rounded-md"
        aria-label="Portal do Parceiro"
      >
        <Home className="w-4 h-4" />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center gap-1">
            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
            {isLast || !item.href ? (
              <span
                className={cn(
                  "px-1 py-0.5",
                  isLast
                    ? "font-medium text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400",
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href}
                className="text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors px-1 py-0.5 rounded-md"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export default PartnerBreadcrumbs;
