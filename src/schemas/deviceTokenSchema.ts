// src/schemas/deviceTokenSchema.ts
import { z } from "zod";

export const deviceSchema = z.object({
  deviceToken: z.string().min(1, 'Device token is required'),
  deviceType: z.enum(['iOS', 'android', 'web']),
  deviceName: z.string().optional(),
  appVersion: z.string().optional(),
  osVersion: z.string().optional(),

}); 