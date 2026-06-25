"use strict";
// src/services/deviceServices.ts
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
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const responseMessages_1 = require("../constants/responseMessages");
const templates_1 = require("../helpers/templates");
const utils_1 = require("../helpers/utils");
const customError_1 = require("../types/customError");
class DeviceServices {
    updateDeviceToken(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                let user;
                let email = "";
                // 🔍 Identify USER / COMPANY
                if (data.user_type === "COMPANY") {
                    const company = yield prismaClient_1.default.company.findFirst({
                        where: {
                            id,
                            status: "ACTIVE",
                            user_type: data.user_type,
                        },
                    });
                    if (!company) {
                        throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 404, "Company not found");
                    }
                    user = company;
                    email = company.email;
                }
                else {
                    const foundUser = yield prismaClient_1.default.user.findFirst({
                        where: {
                            id,
                            status: "ACTIVE",
                            user_type: data.user_type,
                        },
                    });
                    if (!foundUser) {
                        throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "User not found");
                    }
                    user = foundUser;
                    email = foundUser.email;
                }
                // 🔍 Check existing device
                const existingDevice = yield prismaClient_1.default.device.findFirst({
                    where: {
                        userId: user.id,
                        deviceToken: data.deviceToken,
                    },
                });
                const isNewDevice = !existingDevice;
                // 🧠 Detect unusual activity
                const isUnusualActivity = isNewDevice ||
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
                    device = yield prismaClient_1.default.device.update({
                        where: { id: existingDevice.id },
                        data: deviceData,
                    });
                }
                else {
                    device = yield prismaClient_1.default.device.create({
                        data: deviceData,
                    });
                }
                // 🔐 Fetch notification settings
                const settings = yield prismaClient_1.default.notificationSetting.findUnique({
                    where: { userId: user.id },
                });
                const allowEmail = (_a = settings === null || settings === void 0 ? void 0 : settings.emailEnabled) !== null && _a !== void 0 ? _a : true; // fallback true
                const allowNewDevice = (_b = settings === null || settings === void 0 ? void 0 : settings.newDeviceLogin) !== null && _b !== void 0 ? _b : true;
                const allowUnusualActivity = (_c = settings === null || settings === void 0 ? void 0 : settings.unusualActivity) !== null && _c !== void 0 ? _c : true;
                // 📧 Send Email for New Device
                if (isNewDevice && allowEmail && allowNewDevice) {
                    const html = (0, templates_1.newDeviceTemplate)(user.name || user.companyName || "User", deviceData.deviceName, deviceData.deviceType, deviceData.osVersion, deviceData.lastLogin.toLocaleString());
                    yield (0, utils_1.sendMail)(email, "Scaff Snap - New Device Login Alert", html);
                }
                // 🚨 Send Email for Unusual Activity (extra security)
                if (isUnusualActivity && allowEmail && allowUnusualActivity) {
                    const html = (0, templates_1.unusualActivityTemplate)(user.name || user.companyName || "User", deviceData.deviceName, deviceData.deviceType, deviceData.osVersion, deviceData.lastLogin.toLocaleString());
                    yield (0, utils_1.sendMail)(email, "⚠️ Scaff Snap - Unusual Activity Detected", html);
                }
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.DEVICE.DEVICE_SUCCESS,
                    data: Object.assign(Object.assign({}, device), { id: device.id.toString(), userId: device.userId.toString() }),
                };
            }
            catch (error) {
                console.error("❗ Error in updateDeviceToken:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.DEVICE.FETCH_FAILED, 500, error.message);
            }
        });
    }
}
exports.DeviceServices = DeviceServices;
