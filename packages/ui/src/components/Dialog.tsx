import * as RadixDialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import { PropsWithChildren } from "react";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;

export function DialogContent({ children }: PropsWithChildren) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <RadixDialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-slate-100 bg-white p-8 shadow-xl">
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export function DialogTitle({
  children,
  className
}: PropsWithChildren<{ className?: string }>) {
  return (
    <RadixDialog.Title
      className={clsx("text-2xl font-semibold text-slate-900", className)}
    >
      {children}
    </RadixDialog.Title>
  );
}
