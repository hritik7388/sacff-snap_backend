"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/deviceRoutes.ts
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const deviceController_1 = require("../controllers/deviceController");
const router = (0, express_1.Router)();
const deviceControllers = new deviceController_1.DeviceController();
/**
 * @route   PUT /api/v1/device/updateDevice
 * @desc    Upadte a existing  device
 * @access  Public
 */
router.post("/updateDevice", authMiddleware_1.clientAuthMiddleware, authMiddleware_1.authMiddleware, deviceControllers.updateDevice.bind(deviceControllers));
exports.default = router;
