"use client";

import { useState, useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { changePassword, updateUsername } from "@/lib/api/auth";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "Current password is required." }),
    newPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
    confirmPassword: z.string().min(1, { message: "Please confirm your password." }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

const usernameSchema = z.object({
  username: z.string().min(1, { message: "Username is required." }),
});

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileDialog({ open, onOpenChange }: UserProfileDialogProps) {
  const { user, checkAuth } = useAuth();
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isUsernameLoading, setIsUsernameLoading] = useState(false);

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const usernameForm = useForm<z.infer<typeof usernameSchema>>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: user?.username || "",
    },
  });

  useEffect(() => {
    if (open && user?.username) {
      usernameForm.reset({ username: user.username });
      passwordForm.reset();
    }
  }, [open, user, usernameForm, passwordForm]);

  async function onPasswordSubmit(data: z.infer<typeof passwordSchema>) {
    setIsPasswordLoading(true);
    try {
      await changePassword(data.currentPassword, data.newPassword);
      toast.success("Password changed successfully");
      passwordForm.reset();
      onOpenChange(false);
    } catch (e: any) {
      passwordForm.setError("currentPassword", { message: e.message || "Failed to change password." });
    } finally {
      setIsPasswordLoading(false);
    }
  }

  async function onUsernameSubmit(data: z.infer<typeof usernameSchema>) {
    setIsUsernameLoading(true);
    try {
      await updateUsername(data.username);
      await checkAuth();
      toast.success("Username updated successfully");
      onOpenChange(false);
    } catch (e: any) {
      usernameForm.setError("username", { message: e.message || "Failed to update username." });
    } finally {
      setIsUsernameLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>Update your username and password.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="username" className="w-full py-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="username">Profile</TabsTrigger>
            <TabsTrigger value="password">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="username" className="mt-4">
            <form noValidate onSubmit={usernameForm.handleSubmit(onUsernameSubmit)} className="flex flex-col gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium leading-none">Update Username</h3>
                <p className="text-[13px] text-muted-foreground">Change your unique account login username.</p>
              </div>
              <FieldGroup>
                <Controller
                  control={usernameForm.control}
                  name="username"
                  render={({ field, fieldState }) => (
                    <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="username">Username</FieldLabel>
                      <Input
                        {...field}
                        id="username"
                        type="text"
                        placeholder="Enter new username"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </FieldGroup>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isUsernameLoading}>
                  {isUsernameLoading ? "Updating..." : "Update Username"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="password" className="mt-4">
            <form noValidate onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="flex flex-col gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium leading-none">Change Password</h3>
                <p className="text-[13px] text-muted-foreground">Update your password to keep your account secure.</p>
              </div>
              <FieldGroup className="gap-3">
                <Controller
                  control={passwordForm.control}
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
                  control={passwordForm.control}
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
                  control={passwordForm.control}
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
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isPasswordLoading}>
                  {isPasswordLoading ? "Changing..." : "Change Password"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
