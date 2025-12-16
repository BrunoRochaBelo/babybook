/**
 * Partner Skeleton
 *
 * Componente de skeleton loading reutilizável para o Portal do Parceiro.
 * Pode ser usado para criar estados de carregamento consistentes em todas as páginas.
 */

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/**
 * Componente base de Skeleton.
 * Use com className para definir width e height.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200 dark:bg-gray-700",
        className,
      )}
    />
  );
}

/**
 * Skeleton para texto (uma linha).
 */
export function SkeletonText({
  className,
  width = "w-32",
}: SkeletonProps & { width?: string }) {
  return <Skeleton className={cn("h-4", width, className)} />;
}

/**
 * Skeleton para títulos.
 */
export function SkeletonTitle({
  className,
  width = "w-48",
}: SkeletonProps & { width?: string }) {
  return <Skeleton className={cn("h-6", width, className)} />;
}

/**
 * Skeleton para avatares/ícones circulares.
 */
export function SkeletonAvatar({
  className,
  size = "w-10 h-10",
}: SkeletonProps & { size?: string }) {
  return <Skeleton className={cn("rounded-full", size, className)} />;
}

/**
 * Skeleton para botões.
 */
export function SkeletonButton({
  className,
  size = "h-10 w-24",
}: SkeletonProps & { size?: string }) {
  return <Skeleton className={cn("rounded-lg", size, className)} />;
}

/**
 * Skeleton para cards de estatísticas (StatCard).
 */
export function SkeletonStatCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700",
        className,
      )}
    >
      <Skeleton className="w-10 h-10 rounded-lg mb-3" />
      <Skeleton className="h-7 w-16 mb-2" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-28 mt-2" />
    </div>
  );
}

/**
 * Skeleton para linha de tabela/lista de entregas.
 */
export function SkeletonDeliveryRow({ className }: SkeletonProps) {
  return (
    <div className={cn("flex items-center gap-4 p-4", className)}>
      <Skeleton className="w-10 h-10 rounded-lg" />
      <div className="flex-1">
        <Skeleton className="h-4 w-44 mb-2" />
        <Skeleton className="h-3 w-64" />
      </div>
      <Skeleton className="h-6 w-24 rounded-full hidden sm:block" />
    </div>
  );
}

/**
 * Skeleton para o card de créditos principal.
 */
export function SkeletonCreditCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-6 bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-700",
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-20 mb-2" />
          <Skeleton className="h-3 w-40 hidden sm:block" />
        </div>
        <Skeleton className="h-12 w-36 rounded-xl" />
      </div>
    </div>
  );
}

export default Skeleton;
