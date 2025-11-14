"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceSchema = void 0;
const zod_1 = require("zod");
exports.deviceSchema = zod_1.z.object({
    deviceToken: zod_1.z.string().min(1, 'Device token is required'),
    deviceType: zod_1.z.enum(['ios', 'android', 'web']),
    deviceName: zod_1.z.string().optional(),
    appVersion: zod_1.z.string().optional(),
    osVersion: zod_1.z.string().optional(),
});
