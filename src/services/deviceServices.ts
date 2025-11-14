import prisma from "../config/prismaClient";
import { RESPONSE_MESSAGES } from "../constants/responseMessages";
import { pushNotificationDelhi } from "../helpers/utils";
// import { pushNotificationDelhi } from "../helpers/utils";
import { CustomError } from "../types/customError";
// import { pushNotificationDelhi } from "../helpers/utils";

export class DeviceServices {
    async updateDeviceToken(id: number, data: any) {
        try {

            let company, user;

            if (data.user_type === "COMPANY") {

                company = await prisma.company.findFirst({
                    where: {
                        id: id,
                        status: "ACTIVE",
                        user_type: data.user_type,
                    },
                });

                if (!company) {
                    throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 500);
                }

                const deviceData = {
                    userId: company.id,
                    deviceToken: data.deviceToken,
                    deviceType: data.deviceType,
                    deviceName: data.deviceName,
                    appVersion: data.appVersion,
                    osVersion: data.osVersion,
                    user_type: company.user_type,
                };

                const existingDevice = await prisma.device.findFirst({
                    where: { userId: company.id },
                });

                const device = existingDevice
                    ? await prisma.device.update({
                        where: { id: existingDevice.id },
                        data: deviceData,
                    })
                    : await prisma.device.create({
                        data: deviceData,
                    });

                if (device.deviceToken) {
                    await pushNotificationDelhi(
                        device.deviceToken,
                        "Device Token Updated",
                        `🎉 Welcome back, ${company.name}! You’ve successfully signed in to your SCAFF-SNAP Journey account. 🚀`
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
            } else {

                user = await prisma.user.findFirst({
                    where: {
                        id: id,
                        status: "ACTIVE",
                        user_type: data.user_type,
                    },
                });


                if (!user) {
                    throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 500);
                }

                const deviceData = {
                    userId: user.id,
                    deviceToken: data.deviceToken,
                    deviceType: data.deviceType,
                    deviceName: data.deviceName,
                    appVersion: data.appVersion,
                    osVersion: data.osVersion,
                    user_type: user.user_type,
                };

                const existingDevice = await prisma.device.findFirst({
                    where: { userId: user.id },
                });

                const device = existingDevice
                    ? await prisma.device.update({
                        where: { id: existingDevice.id },
                        data: deviceData,
                    })
                    : await prisma.device.create({
                        data: deviceData,
                    });

                if (device.deviceToken) {
                    await pushNotificationDelhi(
                        device.deviceToken,
                        "Device Token Updated",
                        `🎉 Welcome back, ${user.name}! You’ve successfully signed in to your SCAFF_SNAP Journey account. 🚀`
                    );
                }

                return {
                    message: RESPONSE_MESSAGES.DEVICE.DEVICE_SUCCESS,
                    data:
                        device,


                };
            }
        } catch (error: any) {
            console.error("❗ Error in updateDeviceToken:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(RESPONSE_MESSAGES.DEVICE.FETCH_FAILED, 500, error.message);
        }
    }
}
