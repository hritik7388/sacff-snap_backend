// src/services/awsServices.ts

import { CustomError } from "../types/customError";
import { RESPONSE_MESSAGES } from "../constants/responseMessages";
import dotenv from "dotenv";
import { generatePresignedUrl, generateReadUrl, pdfGenerator } from "../helpers/utils";
import { ImageKeyDTO, uploadImageDTO } from "../schemas/uploadImageSChema";
dotenv.config();
const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png"];
const allowedDocumentTypes = ["application/pdf", "image/jpg", "image/png"];
import { qrCodeGenerator } from "../helpers/utils";
import { ScaffHoldDetailsDTO } from "../schemas/tradesManSchema";
import prisma from "../config/prismaClient";
import fs from "fs";
import path from "path";



export class awsCredentialServices {

    async awsCredentials() {
        try {
            const credentials = {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                bucketName: process.env.AWS_BUCKET_NAME,
                region: process.env.AWS_REGION,
            };

            if (!credentials.accessKeyId || !credentials.secretAccessKey || !credentials.bucketName || !credentials.region) {
                throw new CustomError(RESPONSE_MESSAGES.AWS.NOT_SET, 500, "AWS credentials are not set");
            }

            return {
                message: RESPONSE_MESSAGES.AWS.FETCH_SUCCESS,
                data: credentials,
            };
        } catch (error: any) {
            console.error("❌ Error fetching AWS credentials:", error);
            throw error instanceof CustomError
                ? error
                : new CustomError(RESPONSE_MESSAGES.AWS.FETCH_FAILED, 500, error.message);
        }
    }
    async getProfileImageUrl(data: uploadImageDTO) {
        try {
            const { filename, contentType } = data;
            const result = await generatePresignedUrl(filename, contentType);

            return {
                message: RESPONSE_MESSAGES.AWS.PRESIGNED_URL_SUCCESS,
                data: { upload_url: result.url, image_key: result.key },
            };
        } catch (error: any) {
            throw error instanceof CustomError
                ? error
                : new CustomError(RESPONSE_MESSAGES.AWS.PRESIGNED_URL_FAILED, 500, error.message);
        }
    }

    async generateReadUrl(data: ImageKeyDTO) {
        try {
            const url = await generateReadUrl(data.key);
            return {
                message: RESPONSE_MESSAGES.AWS.READ_URL_SUCCESS,
                data: { url },
            };
        } catch (error: any) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(RESPONSE_MESSAGES.AWS.READ_URL_FAILED, 500, error.message);
        }
    }

    async scaffHoldPdf(data: ScaffHoldDetailsDTO) {
        try {
            const scaffhold = await prisma.scaffhold.findFirst({
                where: {
                    id: data.id,
                    isDeleted: false,
                    status: {
                        in: ["ACTIVE", "PRE_ERECTED", "ERECTED", "DISMANTLED"],
                    },
                },
                include: {
                    project: true,
                    company: true,
                },
            });

            if (!scaffhold) {
                throw new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND,
                    401,
                    "ScaffHold not found"
                );
            } 
            
            const formattedResponse = {
                id: scaffhold.id,
                uuid: scaffhold.uuid,
                startDate: scaffhold.startDate,
                endDate: scaffhold.endDate,
                latitude: scaffhold.latitude,
                longitude: scaffhold.longitude,
                priority: scaffhold.priority,
                tag: scaffhold.tag,
                SCAFFID: scaffhold.SCAFFID,
                address: scaffhold.address,
                projectName: scaffhold.projectName,
                status: scaffhold.status,
                projectId: scaffhold.projectId,
                companyId: scaffhold.companyId,
                createdById: scaffhold.createdById,
                createdAt: scaffhold.createdAt,
                updatedAt: scaffhold.updatedAt,
                CMPId: scaffhold.company?.CMPId || null,
                companyName: scaffhold.company?.name || null,
                clientName: scaffhold.project?.clientName || null,
                clientMobile: scaffhold.project?.clientMobile || null,
            };
        
            const pdfBuffer = await pdfGenerator(formattedResponse);
            

            // 3. Prepare uploads folder
            const fileName = `scaffhold-${scaffhold.id}.pdf`;
            const uploadsPath = path.join(process.cwd(), "uploads");
            if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });

            const pdfPath = path.join(uploadsPath, fileName);

            // 4. Save PDF
            fs.writeFileSync(pdfPath, pdfBuffer);

            // 5. Return URL
            const SERVER_URL = process.env.SERVER_URL || "http://localhost:3001";
            const pdfUrl = `${SERVER_URL}/uploads/${fileName}`;

            return {
                message: RESPONSE_MESSAGES.SCAFFHOLD.FETCH_BY_ID_SUCCESS,
                pdfUrl: pdfUrl
            };

        } catch (error: any) {
            console.error("❌ Get scaffhold by id error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED,
                    500,
                    error.message
                );
        }
    }

 
}



