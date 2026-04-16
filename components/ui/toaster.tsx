'use client'

import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'

import { useToast } from '@/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const variant = props.variant ?? 'default'
        const Icon = variant === 'destructive' ? AlertTriangle : variant === 'success' ? CheckCircle2 : Info

        return (
          <Toast key={id} {...props}>
            <div className="flex flex-1 items-start gap-3">
              <Icon
                className={
                  variant === 'destructive'
                    ? 'mt-0.5 h-5 w-5 text-destructive-foreground/90'
                    : variant === 'success'
                      ? 'mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-300'
                      : 'mt-0.5 h-5 w-5 text-primary'
                }
              />

              <div className="grid flex-1 gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>

            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
