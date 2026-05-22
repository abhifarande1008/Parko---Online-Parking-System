"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, FormProvider } from "react-hook-form"
import { z } from "zod"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { useAuthContext } from "@/context/auth-context" // Correct import path with @ prefix
import { Button } from "@/components/ui/button"
import { LoaderCircleIcon, LogOut, Moon, SunDim } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { redirect } from "next/navigation"
import useLogOut from "@/hooks/use-logout"

// Define the OTP validation schema with Zod
const otpSchema = z.object({
  otp: z.string().length(6, { message: "OTP must be 6 digits" }),
})

type OtpFormValues = z.infer<typeof otpSchema>

const VerifyEmail = () => {
  const { theme, setTheme } = useTheme()
  const { authUser, loadSession } = useAuthContext()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { triggerLogOut, logoutLoading } = useLogOut();
  const hasSentOtp = useRef(false);

  const sendOtp = async () => {
    try {
      const response = await fetch("/api/auth/send-email-otp", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          email: authUser?.email,
        }),
        headers: {
          "Content-Type": "application/json",
          "credentials": "include",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to send OTP")
      }
      const data = await response.json()
      toast.success(data.message || "OTP sent successfully")
    } catch (error) {
      console.error("Error sending OTP:", error)
      toast.error(error instanceof Error ? error.message : "Failed to send OTP")
    }
  }

  useEffect(() => {
    if (authUser?.emailVerified) {
      return redirect("/home");
    }
    if (authUser?.email && !hasSentOtp.current) {
      hasSentOtp.current = true;
      sendOtp()
    }
  }, [authUser?.email])

  // Initialize react-hook-form with Zod resolver
  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  })

  const handleVerifyOTP = async (data: OtpFormValues) => {
    if (!authUser?.email) {
      toast.error("No email found for verification")
      return
    }

    try {
      setIsSubmitting(true)

      // Call the verifyEmail function from your auth context
      const resposne = await fetch("/api/auth/verify-email-otp", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          email: authUser.email,
          otp: data.otp
        }),
        headers: {
          "Content-Type": "application/json",
          "credentials": "include",
        },
      }
      )

      if (!resposne.ok) {
        const errorData = await resposne.json()
        throw new Error(errorData.message || "Failed to verify email")
      }
      toast.success("Email verified successfully!");
      loadSession() // Reload session to update user state
    } catch (error) {
      console.error("Verification error:", error)
      toast.error(error instanceof Error ? error.message : "Please try again with a valid OTP")
    } finally {
      setIsSubmitting(false)
    }
  }

  // This function handles OTP changes and updates the form value
  const handleOTPChange = (value: string) => {
    otpForm.setValue("otp", value, { shouldValidate: true })
  }

  return (
    <FormProvider {...otpForm}>
      <form
        className="flex flex-col gap-4 p-4 transition-all animate-fade-in max-w-md mx-auto mt-10"
        onSubmit={otpForm.handleSubmit(handleVerifyOTP)}
      >
        <div className="flex items-center text-center mb-6">
          <div className="text-2xl font-semibold flex-1">Verify Email</div>
          <div className="ml-auto">
            <Button
              variant="ghost"
              type="button"
              size="icon"
              className="w-8 h-8 p-0 rounded-full bg-accent/80 hover:bg-accent dark:hover:bg-slate-800 transition-colors duration-200 ease-in-out"
              onClick={triggerLogOut}
            >
              {logoutLoading ? <LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              type="button"
              size="icon"
              className="w-8 h-8 p-0 rounded-full bg-accent/80 hover:bg-accent dark:hover:bg-slate-800 transition-colors duration-200 ease-in-out"
              onClick={() => {
                setTheme(theme === "dark" ? "light" : "dark")
              }}
            >
              <SunDim className="h-4 w-4 dark:hidden" />
              <Moon className="h-4 w-4 hidden dark:inline" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>

        {authUser?.email && (
          <p className="text-sm text-muted-foreground text-center mb-4">
            We&apos;ve sent a verification code to <span className="font-medium">{authUser.email}</span>
          </p>
        )}

        <div className="space-y-4 w-full flex flex-col items-center">
          <InputOTP maxLength={6} name="otp" onChange={handleOTPChange} value={otpForm.watch("otp")}>
            <InputOTPGroup className="gap-2">
              <InputOTPSlot index={0} className="border-2" />
              <InputOTPSlot index={1} className="border-2 rounded-sm" />
              <InputOTPSlot index={2} className="border-2 rounded-sm" />
              <InputOTPSlot index={3} className="border-2 rounded-sm" />
              <InputOTPSlot index={4} className="border-2 rounded-sm" />
              <InputOTPSlot index={5} className="border-2" />
            </InputOTPGroup>
          </InputOTP>

          {otpForm.formState.errors.otp && (
            <p className="text-sm text-red-500 mt-1">{otpForm.formState.errors.otp.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full mt-4" disabled={isSubmitting || !otpForm.formState.isValid}>
          {isSubmitting ? "Verifying..." : "Verify Email"}
        </Button>

        <div className="text-center mt-4">
          <Button
            variant="link"
            type="button"
            className="text-sm text-muted-foreground"
            onClick={() => {
              // Implement resend OTP functionality here
              sendOtp()
            }}
          >
            Didn&apos;t receive the code? Resend
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}

export default VerifyEmail;