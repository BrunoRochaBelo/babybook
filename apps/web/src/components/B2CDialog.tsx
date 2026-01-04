import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * B2C Encapsulation of shadcn Dialog.
 * Ensures usage of B2C CSS variables for background, text, and borders.
 */

const B2CDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  React.ComponentPropsWithoutRef<typeof DialogContent>
>(({ className, style, children, ...props }, ref) => (
  <DialogContent
    ref={ref}
    className={cn("rounded-3xl border shadow-lg sm:rounded-3xl", className)}
    style={{
      backgroundColor: "var(--bb-color-surface)",
      borderColor: "var(--bb-color-border)",
      color: "var(--bb-color-ink)",
      ...style,
    }}
    {...props}
  >
    {children}
  </DialogContent>
));
B2CDialogContent.displayName = "B2CDialogContent";

const B2CDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <DialogHeader
    className={cn("text-left space-y-2", className)}
    {...props}
  />
);
B2CDialogHeader.displayName = "B2CDialogHeader";

const B2CDialogFooter = ({
    className,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) => (
    <DialogFooter
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
      {...props}
    />
  );
B2CDialogFooter.displayName = "B2CDialogFooter";

const B2CDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogTitle>,
  React.ComponentPropsWithoutRef<typeof DialogTitle>
>(({ className, style, ...props }, ref) => (
  <DialogTitle
    ref={ref}
    className={cn("text-xl font-serif font-bold leading-none tracking-tight", className)}
    style={{
        color: "var(--bb-color-ink)",
        ...style
    }}
    {...props}
  />
));
B2CDialogTitle.displayName = "B2CDialogTitle";

const B2CDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogDescription>,
  React.ComponentPropsWithoutRef<typeof DialogDescription>
>(({ className, style, ...props }, ref) => (
  <DialogDescription
    ref={ref}
    className={cn("text-sm", className)}
    style={{
        color: "var(--bb-color-ink-muted)",
        ...style
    }}
    {...props}
  />
));
B2CDialogDescription.displayName = "B2CDialogDescription";

export {
  Dialog as B2CDialog,
  DialogTrigger as B2CDialogTrigger,
  B2CDialogContent,
  B2CDialogHeader,
  B2CDialogFooter,
  B2CDialogTitle,
  B2CDialogDescription,
  DialogClose as B2CDialogClose,
};
