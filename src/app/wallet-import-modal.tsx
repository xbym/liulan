'use client'

import { X } from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/Checkbox"
import { useState } from 'react';

interface WalletImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (apiKey: string, privateKeys: string, onlyImportApiKey: boolean) => Promise<void>;
  isImporting: boolean;
}

export default function Component({
  isOpen,
  onClose,
  onImport,
  isImporting = false
}: WalletImportModalProps) {
  const [onlyImportApiKey, setOnlyImportApiKey] = useState(false);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const apiKey = formData.get('apiKey') as string;
    const privateKeys = formData.get('privateKeys') as string;
    await onImport(apiKey, privateKeys, onlyImportApiKey);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-6 border bg-white p-8 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-2xl">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-2xl font-semibold">导入钱包</Dialog.Title>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full opacity-70 ring-offset-background transition-opacity hover:opacity-100"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">关闭</span>
              </Button>
            </Dialog.Close>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="apiKey" className="text-sm font-medium">
                API Key
              </Label>
              <Input
                id="apiKey"
                name="apiKey"
                className="h-11"
                placeholder="请输入您的 API Key"
                required
              />
            </div>
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                checked={onlyImportApiKey}
                onChange={() => setOnlyImportApiKey(!onlyImportApiKey)}
                label="仅导入 API Key"
              />
            </div>
            {!onlyImportApiKey && (
              <div className="grid gap-2">
                <Label htmlFor="privateKeys" className="text-sm font-medium">
                  私钥
                </Label>
                <Textarea
                  id="privateKeys"
                  name="privateKeys"
                  className="min-h-[120px] resize-none"
                  placeholder="每行输入一个私钥"
                  required={!onlyImportApiKey}
                />
              </div>
            )}
            <Button
              type="submit"
              disabled={isImporting}
              className="h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            >
              {isImporting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent" />
                  导入中...
                </>
              ) : (
                "确认导入"
              )}
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}