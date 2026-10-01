import { z } from "zod";

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
export const utcInstant = z.iso.datetime().transform((value) => new Date(value));