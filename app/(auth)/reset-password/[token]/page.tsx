"use client";

import React, { use, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KeyRound } from "lucide-react";

const resetSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetFormData) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Something went wrong.");
        return;
      }

      toast.success("Password reset successfully.");
      router.push("/login");
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
          <CardTitle className="text-2xl font-bold">Set a new password</CardTitle>
          <CardDescription>
            Create a strong password for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                {...register("password")}
                error={errors.password?.message}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" loading={isLoading}>
              <KeyRound className="h-4 w-4" />
              Reset password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
