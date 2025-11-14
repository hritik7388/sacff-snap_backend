"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageKeySchema = exports.uploadImageSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.uploadImageSchema = zod_1.default.object({
    filename: zod_1.default.string(),
    contentType: zod_1.default.string()
});
exports.ImageKeySchema = zod_1.default.object({
    key: zod_1.default.string(),
});
