"use client";

import { useForm } from "react-hook-form";
import { authRegisterSchema, AuthRegisterTypes } from "@repo/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { LoaderCircle, UserPlus } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { authRegisterAction } from "@/lib/actions/authActions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type AuthRegisterFormProps = {
  onSuccess?: () => void;
};

const AuthRegisterForm = ({ onSuccess }: AuthRegisterFormProps = {}) => {
  const form = useForm<AuthRegisterTypes>({
    resolver: zodResolver(authRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const router = useRouter();

  const { isPending, mutate } = useMutation({
    mutationFn: authRegisterAction,
    onSuccess: (data) => {
      if (!data.success) {
        toast.error(data.error || "Registration failed. Please try again.");
        return;
      }

      toast.success(data.message || "Registration successful! Please sign in.");
      setTimeout(() => {
        onSuccess?.();
      }, 1000);
    },
    onError: (error) => {
      console.error("Mutation failed unexpectedly:", error);

      if (error instanceof Error) {
        toast.error(`An unexpected error occurred: ${error.message}`);
      } else {
        toast.error(
          "An unexpected error occurred. Please check your connection and try again."
        );
      }
    },
  });

  const formInputs = Object.keys(
    form.getValues()
  ) as (keyof AuthRegisterTypes)[];

  const disabled =
    isPending || form.formState.isValidating || form.formState.isSubmitting;

  function handleSubmission(values: AuthRegisterTypes) {
    mutate(values);
  }

  return (
    <Form {...form}>
      <form
        action=""
        onSubmit={form.handleSubmit(handleSubmission)}
        className="space-y-4"
      >
        {formInputs.map((input) => (
          <FormField
            key={input}
            control={form.control}
            name={input}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="capitalize">
                  {input === "confirmPassword" ? "Confirm Password" : input}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type={
                      input === "email"
                        ? "email"
                        : input === "password" || input === "confirmPassword"
                          ? "password"
                          : "text"
                    }
                    placeholder={
                      input === "name"
                        ? "Enter your name"
                        : input === "email"
                          ? "Enter your email"
                          : input === "password"
                            ? "Enter your password"
                            : "Confirm your password"
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <div className="flex mt-12">
          <Button disabled={disabled} className="ml-auto min-w-32">
            {isPending && <LoaderCircle className="animate-spin mr-2" />}
            <UserPlus className="mr-2 h-4 w-4" /> Sign up
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AuthRegisterForm;
