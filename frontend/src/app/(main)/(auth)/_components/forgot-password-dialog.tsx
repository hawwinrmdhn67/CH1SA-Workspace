"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { resetPassword } from "@/lib/api/auth";
import { verifyRecoveryCodeFormat } from "@/lib/recovery";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const verifySchema = z.object({
  recoveryCode: z.string().min(1, { message: "Recovery code is required." }),
});

const resetSchema = z
  .object({
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
    confirmPassword: z.string().min(1, { message: "Please confirm your password." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState<"verify" | "reset">("verify");
  const [isLoading, setIsLoading] = useState(false);
  const { logout } = useAuth();

  const verifyForm = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema),
    defaultValues: { recoveryCode: "" },
  });

  const resetForm = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onVerifySubmit = (data: z.infer<typeof verifySchema>) => {
    if (!verifyRecoveryCodeFormat(data.recoveryCode)) {
      setIsLoading(false);
      verifyForm.setError("recoveryCode", { message: "Invalid recovery code format." });
      return;
    }

    setIsLoading(false);
    setStep("reset");
  };

  async function onResetSubmit(data: z.infer<typeof resetSchema>) {
    setIsLoading(true);
    try {
      await resetPassword(verifyForm.getValues().recoveryCode, data.password);
      
      setIsLoading(false);
      toast.success("Password reset successfully");
      
      onOpenChange(false);
      router.push("/login");
    } catch (e) {
      setIsLoading(false);
      toast.error("Failed to reset password. Recovery code might be invalid.");
      setStep("verify");
      verifyForm.setError("recoveryCode", { message: "Invalid recovery code." });
    }
  }

  const handleCancel = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("verify");
      verifyForm.reset();
      resetForm.reset();
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        {step === "verify" ? (
          <>
            <DialogHeader>
              <DialogTitle>Verify recovery code</DialogTitle>
              <DialogDescription>Enter your recovery code to reset your workspace password.</DialogDescription>
            </DialogHeader>
            <form id="verify-form" noValidate onSubmit={verifyForm.handleSubmit(onVerifySubmit)} className="py-4">
              <Controller
                control={verifyForm.control}
                name="recoveryCode"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5 flex flex-col" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="recovery-code">Recovery Code</FieldLabel>
                    <Input
                      {...field}
                      id="recovery-code"
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      autoComplete="off"
                      autoCapitalize="characters"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </form>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" form="verify-form" disabled={isLoading}>
                Verify
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Reset workspace password</DialogTitle>
            </DialogHeader>
            <form
              id="reset-form"
              noValidate
              onSubmit={resetForm.handleSubmit(onResetSubmit)}
              className="flex flex-col gap-4 py-4"
            >
              <Controller
                control={resetForm.control}
                name="password"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="new-password">New Password</FieldLabel>
                    <Input
                      {...field}
                      id="new-password"
                      type="password"
                      placeholder="Enter new password"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={resetForm.control}
                name="confirmPassword"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
                    <Input
                      {...field}
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm new password"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </form>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" form="reset-form" disabled={isLoading}>
                Reset Password
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
