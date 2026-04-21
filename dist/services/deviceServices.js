"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceServices = void 0;
// src/services/deviceServices.ts
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const responseMessages_1 = require("../constants/responseMessages");
// import { pushNotificationDelhi } from "../helpers/utils";
const customError_1 = require("../types/customError");
// import { pushNotificationDelhi } from "../helpers/utils";
class DeviceServices {
    updateDeviceToken(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let company, user;
                if (data.user_type === "COMPANY") {
                    company = yield prismaClient_1.default.company.findFirst({
                        where: {
                            id: id,
                            status: "ACTIVE",
                            user_type: data.user_type,
                        },
                    });
                    if (!company) {
                        throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 500);
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
                    const existingDevice = yield prismaClient_1.default.device.findFirst({
                        where: { userId: company.id },
                    });
                    const device = existingDevice
                        ? yield prismaClient_1.default.device.update({
                            where: { id: existingDevice.id },
                            data: deviceData,
                        })
                        : yield prismaClient_1.default.device.create({
                            data: deviceData,
                        });
                    return {
                        message: responseMessages_1.RESPONSE_MESSAGES.DEVICE.DEVICE_SUCCESS,
                        data: Object.assign(Object.assign({}, device), { id: device.id.toString(), userId: device.userId.toString() }),
                    };
                }
                else {
                    user = yield prismaClient_1.default.user.findFirst({
                        where: {
                            id: id,
                            status: "ACTIVE",
                            user_type: data.user_type,
                        },
                    });
                    if (!user) {
                        throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 500);
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
                    const existingDevice = yield prismaClient_1.default.device.findFirst({
                        where: { userId: user.id },
                    });
                    const device = existingDevice
                        ? yield prismaClient_1.default.device.update({
                            where: { id: existingDevice.id },
                            data: deviceData,
                        })
                        : yield prismaClient_1.default.device.create({
                            data: deviceData,
                        });
                    return {
                        message: responseMessages_1.RESPONSE_MESSAGES.DEVICE.DEVICE_SUCCESS,
                        data: device,
                    };
                }
            }
            catch (error) {
                console.error("❗ Error in updateDeviceToken:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.DEVICE.FETCH_FAILED, 500, error.message);
            }
        });
    }
}
exports.DeviceServices = DeviceServices;
