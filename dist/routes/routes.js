"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/routes.ts
const express_1 = require("express");
const superAdminRoutes_1 = __importDefault(require("./superAdminRoutes"));
const companyRoutes_1 = __importDefault(require("./companyRoutes"));
const deviceRoutes_1 = __importDefault(require("./deviceRoutes"));
const awsRoutes_1 = __importDefault(require("./awsRoutes"));
const subAdminRoutes_1 = __importDefault(require("./subAdminRoutes"));
const tradesManRoutes_1 = __importDefault(require("./tradesManRoutes"));
const projectManagerRoutes_1 = __importDefault(require("./projectManagerRoutes"));
const passwordRoutes_1 = __importDefault(require("./passwordRoutes"));
const scaffHoldRoutes_1 = __importDefault(require("./scaffHoldRoutes"));
const competentPersonRoutes_1 = __importDefault(require("./competentPersonRoutes"));
const router = (0, express_1.Router)();
router.use('/v1/company', companyRoutes_1.default);
router.use('/v1/device', deviceRoutes_1.default);
router.use('/v1/superAdmin', superAdminRoutes_1.default);
router.use('/v1/aws', awsRoutes_1.default);
router.use('/v1/subAdmin', subAdminRoutes_1.default);
router.use('/v1/tradesMan', tradesManRoutes_1.default);
router.use('/v1/projectManager', projectManagerRoutes_1.default);
router.use('/v1/password', passwordRoutes_1.default);
router.use('/v1/scaffHold', scaffHoldRoutes_1.default);
router.use('/v1/competentPerson', competentPersonRoutes_1.default);
exports.default = router;
