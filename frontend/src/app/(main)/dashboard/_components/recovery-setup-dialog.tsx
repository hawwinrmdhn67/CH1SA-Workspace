"use client";

import { useEffect, useState } from "react";

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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { fetchRecoveryCode, generateRecoveryCode } from "@/lib/recovery";

const passwordSchema = z
  .object({
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
    confirmPassword: z.string().min(1, { message: "Please confirm your password." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export function RecoverySetupDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"password" | "code">("password");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    // Check if recovery code exists when the dashboard loads
    async function initRecovery() {
      const existingCode = await fetchRecoveryCode();
      if (!existingCode) {
        setOpen(true);
      }
    }
    initRecovery();
  }, []);

  const onSubmitPassword = async (data: z.infer<typeof passwordSchema>) => {
    localStorage.setItem("workspace_password", data.password);
    setIsGenerating(true);
    try {
      const code = await generateRecoveryCode();
      setRecoveryCode(code);
      setStep("code");
    } catch (error) {
      console.error("Failed to generate recovery code:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavedCode = () => {
    // The API already saves the code upon generation
    setOpen(false);
    toast.success("Workspace security setup complete.");
  };

  // Prevent closing the modal by clicking outside or pressing Escape
  const onInteractOutside = (e: Event) => {
    e.preventDefault();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="sm:max-w-[425px]"
        onInteractOutside={onInteractOutside}
        onEscapeKeyDown={onInteractOutside}
      >
        {step === "password" ? (
          <>
            <DialogHeader>
              <DialogTitle>Secure your workspace</DialogTitle>
              <DialogDescription>
                Please set a secure password for your personal workspace before continuing.
              </DialogDescription>
            </DialogHeader>
            <form
              id="setup-password-form"
              noValidate
              onSubmit={form.handleSubmit(onSubmitPassword)}
              className="flex flex-col gap-4 py-4"
            >
              <Controller
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="setup-password">New Password</FieldLabel>
                    <Input
                      {...field}
                      id="setup-password"
                      type="password"
                      placeholder="Enter new password"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="confirmPassword"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="setup-confirm-password">Confirm Password</FieldLabel>
                    <Input
                      {...field}
                      id="setup-confirm-password"
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
              <Button type="submit" form="setup-password-form">
                Continue
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Your recovery code</DialogTitle>
              <DialogDescription>
                Save this code somewhere safe. You can also view or regenerate it later from Account settings while
                you&apos;re signed in.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-6 gap-4">
              <ShieldCheck className="size-12 text-primary" />
              <div className="rounded-md bg-muted px-6 py-4 font-mono text-xl tracking-widest text-center select-all">
                {recoveryCode}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleSavedCode} className="w-full">
                I&apos;ve saved it
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
