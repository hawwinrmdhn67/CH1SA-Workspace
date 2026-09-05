"use client";

import { useEffect, useState } from "react";

import { Copy, Eye, EyeOff, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchRecoveryCode, generateRecoveryCode } from "@/lib/recovery";

interface AccountSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountSettingsDialog({ open, onOpenChange }: AccountSettingsDialogProps) {
  const [recoveryCode, setRecoveryCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (open) {
      async function load() {
        const savedCode = await fetchRecoveryCode();
        if (savedCode) {
          setRecoveryCode(savedCode);
        }
      }
      load();
      setShowCode(false);
      setConfirmRegenerate(false);
    }
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCode);
      toast.success("Recovery code copied.");
    } catch (err) {
      toast.error("Failed to copy recovery code.");
    }
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    try {
      const newCode = await generateRecoveryCode();
      setRecoveryCode(newCode);
      setConfirmRegenerate(false);
      setShowCode(true);
      toast.success("Recovery code regenerated successfully.");
    } catch (e) {
      toast.error("Failed to regenerate recovery code.");
    } finally {
      setIsGenerating(false);
    }
  };

  const cancelRegenerate = () => {
    setConfirmRegenerate(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>Manage your workspace security and preferences.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6 py-4">
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Recovery Code
            </h4>
            <p className="text-sm text-muted-foreground">
              Your recovery code can be used to reset your workspace password if you forget it.
            </p>

            {!showCode ? (
              <Button variant="outline" className="w-fit mt-2" onClick={() => setShowCode(true)}>
                <Eye className="mr-2 h-4 w-4" />
                Show recovery code
              </Button>
            ) : (
              <div className="mt-2 flex flex-col gap-3">
                <div className="rounded-md bg-muted px-4 py-3 font-mono text-lg tracking-widest text-center select-all border border-border/50">
                  {recoveryCode}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="flex-1" onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setShowCode(false)}>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Hide
                  </Button>
                </div>

                <div className="mt-4 border-t pt-4">
                  {confirmRegenerate ? (
                    <div className="flex flex-col gap-3 p-3 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
                      <p className="text-sm font-medium">Regenerate recovery code?</p>
                      <p className="text-xs">
                        Your current recovery code will stop working once a new one is generated.
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                          onClick={cancelRegenerate}
                        >
                          Cancel
                        </Button>
                        <Button variant="destructive" size="sm" className="flex-1" onClick={handleRegenerate}>
                          Regenerate
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      className="w-full text-muted-foreground hover:text-foreground"
                      onClick={() => setConfirmRegenerate(true)}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate recovery code
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
