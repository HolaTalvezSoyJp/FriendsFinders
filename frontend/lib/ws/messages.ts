import { z } from "zod";

const nearbyFriendEntrySchema = z.object({
  friendId: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  lastUpdated: z.string(),
  distanceMiles: z.number(),
});

const initResponseSchema = z.object({
  type: z.literal("init.response"),
  friends: z.array(nearbyFriendEntrySchema),
});

const locationPushSchema = z.object({
  type: z.literal("location.push"),
  friendId: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  lastUpdated: z.string(),
  distanceMiles: z.number(),
});

export const inboundMessageSchema = z.discriminatedUnion("type", [
  initResponseSchema,
  locationPushSchema,
]);

export type InboundMessage = z.infer<typeof inboundMessageSchema>;
