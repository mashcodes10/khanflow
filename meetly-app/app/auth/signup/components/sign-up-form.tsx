"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Command } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { registerMutationFn, loginWithGoogleMutationFn } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: registerMutationFn,
  });

  const { mutate: mutateGoogle } = useMutation({
    mutationFn: loginWithGoogleMutationFn,
    onSuccess: (data) => {
      const { user, accessToken, expiresAt } = data;
      
      // Store in localStorage for Next.js
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('expiresAt', expiresAt.toString());
      
      toast.success("Google sign up successful");
      router.push("/");
    },
    onError: (error) => {
      toast.error(error.message || "Google sign up failed");
    },
  });

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: SignUpFormValues) => {
    if (isPending) return;
    setIsLoading(true);

    mutate(values, {
      onSuccess: () => {
        toast.success("Account created successfully! Please sign in.");
        router.push("/auth/signin");
      },
      onError: (error) => {
        console.log(error);
        toast.error(error.message || "Failed to create account");
      },
      onSettled: () => {
        setIsLoading(false);
      }
    });
  };

  return (
    <div className={cn("flex flex-col gap-6 w-full", className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Top Header */}
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Command className="size-5" />
              </div>
              <span className="sr-only">Khanflow</span>
            </Link>
            <h2 className="text-xl font-bold text-foreground">
              Create your Khanflow account
            </h2>
          </div>

          {/* Form Card */}
          <Card className="border border-border shadow-sm w-full">
            <CardHeader className="pb-4 text-center">
              <CardTitle className="text-xl">Sign up</CardTitle>
              <CardDescription>Create your account to get started</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {/* Name Field */}
              <FormField
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <Label className="font-semibold !text-sm">
                      Full Name
                    </Label>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="John Doe"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email Field */}
              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <Label className="font-semibold !text-sm">
                      Email address
                    </Label>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="user@example.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                name="password"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <Label className="font-semibold !text-sm">Password</Label>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="***********"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button disabled={isPending || isLoading} type="submit" className="w-full rounded-md">
                {isPending || isLoading ? "Creating account..." : "Create account"}
              </Button>

              {/* Google OAuth - Only show if properly configured */}
              {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && 
               process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID !== "your_google_client_id_here" && (
                <>
                  {/* OR Divider */}
                  <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                    <span className="relative z-10 bg-background px-2 text-muted-foreground">
                      Or
                    </span>
                  </div>

                  {/* Google Sign Up */}
                  <div className="grid gap-1 sm:grid-cols-1 -mt-3">
                    <GoogleLogin
                      onSuccess={(credentialResponse: CredentialResponse) => {
                        if (credentialResponse.credential) {
                          mutateGoogle(credentialResponse.credential);
                        }
                      }}
                      onError={() => toast.error("Google sign up failed")}
                      size="large"
                      width="100%"
                      shape="rectangular"
                      text="signup_with"
                      logo_alignment="left"
                    />
                  </div>
                </>
              )}

              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link
                  href="/auth/signin"
                  className="underline underline-offset-4 text-primary"
                >
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}