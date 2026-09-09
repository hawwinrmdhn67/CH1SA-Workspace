"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { changePassword } from "@/lib/api/auth";
import { fetchRecoveryCode } from "@/lib/recovery";

const formSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "Current password is required." }),
    newPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
    confirmPassword: z.string().min(1, { message: "Please confirm your password." }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export default function ForceChangePasswordPage() {
  const { isAuthenticated, user, checkAuth } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"password" | "code">("password");
  const [recoveryCode, setRecoveryCode] = useState("");

  useEffect(() => {
    if (isAuthenticated === false) {
      router.replace("/login");
    } else if (isAuthenticated === true && user && !user.mustChangePassword && step === "password") {
      router.replace("/dashboard/productivity");
    }
  }, [isAuthenticated, user, router, step]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await changePassword(data.currentPassword, data.newPassword);
      toast.success("Password changed successfully");
      
      const code = await fetchRecoveryCode();
      if (code) {
        setRecoveryCode(code);
        setStep("code");
      } else {
        await checkAuth();
        router.replace("/dashboard/productivity");
      }
    } catch (e: any) {
      form.setError("currentPassword", { message: e.message || "Failed to change password." });
    } finally {
      setIsLoading(false);
    }
  }

  const handleSavedCode = async () => {
    await checkAuth();
    router.replace("/dashboard/productivity");
  };

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[350px]">
      {step === "password" ? (
        <>
          <div className="space-y-2 text-center">
            <h1 className="font-medium text-3xl">Change your password</h1>
            <p className="text-muted-foreground text-sm">
              Your account requires a password change before you can access the workspace.
            </p>
          </div>
          <div className="space-y-4">
            <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FieldGroup className="gap-4">
                <Controller
                  control={form.control}
                  name="currentPassword"
                  render={({ field, fieldState }) => (
                    <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="current-password">Current Password</FieldLabel>
                      <Input
                        {...field}
                        id="current-password"
                        type="password"
                        placeholder="Enter current password"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="newPassword"
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
                  control={form.control}
                  name="confirmPassword"
                  render={({ field, fieldState }) => (
                    <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="confirm-password">Confirm New Password</FieldLabel>
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
              </FieldGroup>
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2 text-center">
            <h1 className="font-medium text-3xl">Your recovery code</h1>
            <p className="text-muted-foreground text-sm">
              Save this code somewhere safe. You can also view or regenerate it later from Account settings while you're signed in.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <ShieldCheck className="size-12 text-primary" />
            <div className="rounded-md bg-muted px-6 py-4 font-mono text-xl tracking-widest text-center select-all">
              {recoveryCode}
            </div>
            <Button type="button" onClick={handleSavedCode} className="w-full mt-4">
              I've saved it
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
