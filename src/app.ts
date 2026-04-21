// src/app.ts

import dotenv from "dotenv";
import cron from "node-cron";
dotenv.config();
import "reflect-metadata";
import "dotenv/config";
(BigInt.prototype as any).toJSON = function () {
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

import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import morgan from "morgan";
import prisma from "./config/prismaClient";
import routes from "./routes/routes";
import { errorMiddleware } from "./middlewares/errorMiddleware";
import { Server } from "socket.io";
import express from "express";
import path from "path";
import http from "http";
import { pushNotificationDelhi } from "./helpers/utils";
const app = express();
const port = process.env.PORT || 3001;
const server = https.createServer( app);
// const server = https.createServer( app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    },
});

app.use(cors());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));


app.use(morgan("dev"));
app.use(express.json());


app.set("io", io);
app.use("/api", routes);

app.use(errorMiddleware);

cron.schedule("0 8 * * *", async () => {
    console.log("⏰ CRON: Sending Daily Inspection Reminder to Competent Persons...");

    try {
        const competentPersons = await prisma.user.findMany({
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
            const devices = await prisma.device.findMany({
                where: {
                    userId: user.id,
                    deviceToken: { not: null }
                },
                select: { deviceToken: true }
            });
            const message =
                `Daily Inspection Reminder.\n` +
                `Hello ${user.name}, please perform your scaffold inspection.\n` +
                `Action: Open Daily Inspection Timeline.`;
            await prisma.notification.create({
                data: {
                    uuid: uuidv4(),
                    title: "Daily Inspection Reminder",
                    message: message,
                    type: "DAILY_INSPECTION_REMINDER",
                    role: "COMPETENT_PERSON",
                    receiverId: user.id,
                    senderId: "SYSTEM",
                    isRead: false,
                    notificationImage:
                        "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/reminder.png"
                }
            });
            for (const d of devices) {
                if (!d.deviceToken) continue;

                await pushNotificationDelhi(
                    d.deviceToken,
                    "Daily Inspection Reminder",
                    message,

                );
            }
        }

        console.log("✅ Daily Inspection Reminder sent successfully to competent persons.");

    } catch (error) {
        console.error("❌ CRON ERROR:", error);
    }
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

export default app;

