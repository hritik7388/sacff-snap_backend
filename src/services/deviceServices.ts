// src/services/deviceServices.ts

import prisma from "../config/prismaClient";
import { RESPONSE_MESSAGES } from "../constants/responseMessages";
import { newDeviceTemplate, unusualActivityTemplate } from "../helpers/templates";
import { sendMail } from "../helpers/utils";
import { CustomError } from "../types/customError";

export class DeviceServices {
    async updateDeviceToken(id: number, data: any) {
        try {
            let user: any;
            let email: string = "";

            // 🔍 Identify USER / COMPANY
            if (data.user_type === "COMPANY") {
                const company = await prisma.company.findFirst({
                    where: {
                        id,
                        status: "ACTIVE",
                        user_type: data.user_type,
                    },
                });

                if (!company) {
                    throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 404);
                }

                user = company;
                email = company.email;
            } else {
                const foundUser = await prisma.user.findFirst({
                    where: {
                        id,
                        status: "ACTIVE",
                        user_type: data.user_type,
                    },
                });

                if (!foundUser) {
                    throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 404);
                }

                user = foundUser;
                email = foundUser.email;
            }

            // 🔍 Check existing device
            const existingDevice = await prisma.device.findFirst({
                where: {
                    userId: user.id,
                    deviceToken: data.deviceToken,
                },
            });

            const isNewDevice = !existingDevice;

            // 🧠 Detect unusual activity
            const isUnusualActivity =
                isNewDevice ||
                (existingDevice &&
                    (existingDevice.deviceType !== data.deviceType ||
                        existingDevice.osVersion !== data.osVersion));

            const deviceData = {
                userId: user.id,
                deviceToken: data.deviceToken,
                deviceType: data.deviceType,
                deviceName: data.deviceName,
                appVersion: data.appVersion,
                osVersion: data.osVersion,
                user_type: data.user_type,
                lastLogin: new Date(),
            };

            let device;

            // 🔄 Update or Create device
            if (existingDevice) {
                device = await prisma.device.update({
                    where: { id: existingDevice.id },
                    data: deviceData,
                });
            } else {
                device = await prisma.device.create({
                    data: deviceData,
                });
            }

            // 🔐 Fetch notification settings
            const settings = await prisma.notificationSetting.findUnique({
                where: { userId: user.id },
            });

            const allowEmail =
                settings?.emailEnabled ?? true; // fallback true
            const allowNewDevice =
                settings?.newDeviceLogin ?? true;
            const allowUnusualActivity =
                settings?.unusualActivity ?? true;

            // 📧 Send Email for New Device
            if (isNewDevice && allowEmail && allowNewDevice) {
                const html = newDeviceTemplate(
                    user.name || user.companyName || "User",
                    deviceData.deviceName,
                    deviceData.deviceType,
                    deviceData.osVersion,
                    deviceData.lastLogin.toLocaleString()
                );

                await sendMail(
                    email,
                    "Scaff Snap - New Device Login Alert",
                    html
                );
            }

            // 🚨 Send Email for Unusual Activity (extra security)
            if (isUnusualActivity && allowEmail && allowUnusualActivity) {
                const html = unusualActivityTemplate(
                    user.name || user.companyName || "User",
                    deviceData.deviceName,
                    deviceData.deviceType,
                    deviceData.osVersion,
                    deviceData.lastLogin.toLocaleString()
                );

                await sendMail(
                    email,
                    "⚠️ Scaff Snap - Unusual Activity Detected",
                    html
                );
            }

            return {
                message: RESPONSE_MESSAGES.DEVICE.DEVICE_SUCCESS,
                data: {
                    ...device,
                    id: device.id.toString(),
                    userId: device.userId.toString(),
                },
            };
        } catch (error: any) {
            console.error("❗ Error in updateDeviceToken:", error);

            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError(
                RESPONSE_MESSAGES.DEVICE.FETCH_FAILED,
                500,
                error.message
            );
        }
    }
}