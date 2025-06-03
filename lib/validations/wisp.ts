import * as z from "zod";

export const WispValidation = z.object({
  wisp: z.string().nonempty().min(3, { message: "Mininum 3 characters" }),
  accountId: z.string(),
});

export const CommentValidation = z.object({
  wisp: z.string().nonempty().min(3, { message: "Mininum 3 characters" }),
});
