"use strict";
// src/app.ts
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
const dotenv_1 = __importDefault(require("dotenv"));
const node_cron_1 = __importDefault(require("node-cron"));
dotenv_1.default.config();
require("reflect-metadata");
require("dotenv/config");
BigInt.prototype.toJSON = function () {
    return this.toString();
};
const https = require('https');
const fs = require('fs');
// const sslOptions = {
//     key: fs.readFileSync(
//         "/etc/letsencrypt/live/api.scaffsnapp.com/privkey.pem"
//     ),
//     cert: fs.readFileSync(
//         "/etc/letsencrypt/live/api.scaffsnapp.com/fullchain.pem"
//     ),
// };
const uuid_1 = require("uuid");
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const prismaClient_1 = __importDefault(require("./config/prismaClient"));
const routes_1 = __importDefault(require("./routes/routes"));
const errorMiddleware_1 = require("./middlewares/errorMiddleware");
const socket_io_1 = require("socket.io");
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("./helpers/utils");
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
const server = https.createServer(app);
// const server = https.createServer( app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    },
});
app.use((0, cors_1.default)());
app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.set("io", io);
app.use("/api", routes_1.default);
app.use(express_1.default.static(path_1.default.join(__dirname, ".well-known")));
app.use(errorMiddleware_1.errorMiddleware);
node_cron_1.default.schedule("0 8 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("⏰ CRON: Sending Daily Inspection Reminder to Competent Persons...");
    try {
        const competentPersons = yield prismaClient_1.default.user.findMany({
            where: {
                user_type: "COMPETENT_PERSON",
                status: "ACTIVE"
            },
            select: {
                id: true,
                name: true
            }
        });
        if (!competentPersons.length) {
            console.log("ℹ No competent persons found");
            return;
        }
        for (const user of competentPersons) {
            const devices = yield prismaClient_1.default.device.findMany({
                where: {
                    userId: user.id,
                    deviceToken: { not: null }
                },
                select: { deviceToken: true }
            });
            const message = `Daily Inspection Reminder.\n` +
                `Hello ${user.name}, please perform your scaffold inspection.\n` +
                `Action: Open Daily Inspection Timeline.`;
            yield prismaClient_1.default.notification.create({
                data: {
                    uuid: (0, uuid_1.v4)(),
                    title: "Daily Inspection Reminder",
                    message: message,
                    type: "DAILY_INSPECTION_REMINDER",
                    role: "COMPETENT_PERSON",
                    receiverId: user.id,
                    senderId: "SYSTEM",
                    isRead: false,
                    notificationImage: "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/reminder.png"
                }
            });
            for (const d of devices) {
                if (!d.deviceToken)
                    continue;
                yield (0, utils_1.pushNotificationDelhi)(d.deviceToken, "Daily Inspection Reminder", message);
            }
        }
        console.log("✅ Daily Inspection Reminder sent successfully to competent persons.");
    }
    catch (error) {
        console.error("❌ CRON ERROR:", error);
    }
}));
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
exports.default = app;
