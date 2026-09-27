"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Only follow callback URLs that stay on this site. Rejects "//evil.com" and
 * "/evil.com" (browsers treat a backslash like a slash) and absolute URLs.
 */
function safeCallback(cb: string | null): string {
  if (!cb || !cb.startsWith("/") || cb.includes("\\")) return "/dashboard";
  try {
    const url = new URL(cb, window.location.origin);
    return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : "/dashboard";
  } catch {
    return "/dashboard";
  }
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: true },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Login failed. Please try again.");
        return;
      }

      toast.success("Welcome back!");
      const cb = searchParams.get("callbackUrl");
      router.push(safeCallback(cb));
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <Card className="shadow-sm border-[var(--border)]">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Log in to your TravelDoc Pro account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                {...register("email")}
                error={errors.email?.message}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[var(--primary)] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  {...register("password")}
                  error={errors.password?.message}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              {/* Radix checkbox is a <button>; drive it explicitly so the schema gets a boolean. */}
              <Checkbox
                id="remember"
                checked={watch("remember") ?? false}
                onCheckedChange={(v) => setValue("remember", v === true)}
              />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                Remember me for 30 days
              </Label>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isLoading}
            >
              <LogIn className="h-4 w-4" />
              Log in
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-[var(--muted-foreground)]">
                 New to TravelDoc Pro?
              </span>
            </div>
          </div>

          <Link href="/signup">
            <Button variant="outline" className="w-full">
              Create a free account
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
