"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

import { ForgotPasswordDialog } from "./forgot-password-dialog";

const formSchema = z.object({
  username: z.string().min(1, { message: "Username is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [showForgotDialog, setShowForgotDialog] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      await login(data.username, data.password);
      router.replace("/dashboard/productivity");
    } catch (e: any) {
      form.setError("password", { message: e.message || "Invalid username or password." });
    }
  }

  return (
    <>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FieldGroup className="gap-4">
          <Controller
            control={form.control}
            name="username"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="login-username">Username</FieldLabel>
                <Input
                  {...field}
                  id="login-username"
                  type="text"
                  placeholder="Enter your username"
                  autoComplete="username"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="login-password">Password</FieldLabel>
                <Input
                  {...field}
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>
        <Button className="w-full" type="submit">
          Login
        </Button>
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowForgotDialog(true)}
            className="text-muted-foreground text-sm hover:text-primary transition-colors"
          >
            Forgot password?
          </button>
        </div>
      </form>

      <ForgotPasswordDialog open={showForgotDialog} onOpenChange={setShowForgotDialog} />
    </>
  );
}
