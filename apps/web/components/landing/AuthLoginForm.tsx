"use client";

import { useForm } from "react-hook-form";
import { authLoginSchema, AuthLoginTypes } from "@repo/types";
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
import { LoaderCircle, LogIn } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { authLoginAction } from "@/lib/actions/authActions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const AuthLoginForm = () => {
  const form = useForm<AuthLoginTypes>({
    resolver: zodResolver(authLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const router = useRouter();

  const { isPending, mutate } = useMutation({
    mutationFn: authLoginAction,
    onSuccess: (data) => {
      if (!data.success) {
        toast.error(data.error || "Login failed. Please try again.");
        return;
      }

      toast.success(data.message || "Login successful!");
      router.push(`/${data.data?.user.id}/dashboard`);
      router.refresh();
    },
    onError: (error) => {
      console.error("Mutation failed unexpectedly:", error);

      if (error instanceof Error) {
        toast(`An unexpected error occurred: ${error.message}`);
      } else {
        toast(
          "An unexpected error occurred. Please check your connection and try again."
        );
      }
    },
  });

  const formInputs = Object.keys(form.getValues()) as (keyof AuthLoginTypes)[];

  const disabled =
    isPending || form.formState.isValidating || form.formState.isSubmitting;

  function handleSubmission(values: AuthLoginTypes) {
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
                <FormLabel className="capitalize">{input}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type={input === "email" ? "text" : "password"}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <div className="flex mt-12">
          <Button disabled={disabled} className=" ml-auto min-w-32">
            {isPending && <LoaderCircle className="animate-spin" />}
            <LogIn /> Sign in
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AuthLoginForm;
