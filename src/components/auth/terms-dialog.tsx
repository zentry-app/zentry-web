"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { Label } from "@/components/ui/label";

interface TermsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export function TermsDialog({ isOpen, onClose, onAccept }: TermsDialogProps) {
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const handleAccept = () => {
    if (acceptTerms && acceptPrivacy) {
      onAccept();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Términos y Condiciones</DialogTitle>
          <DialogDescription>
            Para continuar con el registro, por favor acepta nuestros términos y condiciones y política de privacidad.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
            />
            <div className="space-y-1 leading-none">
              <Label htmlFor="terms" className="text-sm text-muted-foreground">
                Acepto los{" "}
                <Link href="/terminos" className="text-primary hover:underline" target="_blank">
                  términos y condiciones
                </Link>
              </Label>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="privacy"
              checked={acceptPrivacy}
              onCheckedChange={(checked) => setAcceptPrivacy(checked as boolean)}
            />
            <div className="space-y-1 leading-none">
              <Label htmlFor="privacy" className="text-sm text-muted-foreground">
                Acepto la{" "}
                <Link href="/privacidad" className="text-primary hover:underline" target="_blank">
                  política de privacidad
                </Link>
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAccept}
            disabled={!acceptTerms || !acceptPrivacy}
          >
            Continuar con Google
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 