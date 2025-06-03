"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";

import { WispValidation } from "@/lib/validations/wisp";
import { createWisp } from "@/lib/actions/wisp.actions";

export function PostWisp({ userId }: { userId: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const form = useForm({
    resolver: zodResolver(WispValidation),
    defaultValues: {
      wisp: "",
      accountId: userId,
    },
  });

  const onSubmit = async (values: z.infer<typeof WispValidation>) => {
    await createWisp({ text: values.wisp, authorId: userId, communityId: null, path: pathname });

    router.push("/");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-10 flex flex-col justify-start gap-10">
        <FormField
          control={form.control}
          name="wisp"
          render={({ field }) => (
            <FormItem className="flex flex-col w-full gap-3">
              <FormLabel className="text-base-semibold text-light-2">Content</FormLabel>
              <FormControl className="no-focus border border-dark-4 bg-dark-3 text-light-1">
                <Textarea rows={15} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="bg-primary-500">
          Post Wisp
        </Button>
      </form>
    </Form>
  );
}
