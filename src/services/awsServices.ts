// src/services/awsServices.ts

import { CustomError } from "../types/customError";
import { RESPONSE_MESSAGES } from "../constants/responseMessages";
import dotenv from "dotenv";
import { generatePresignedUrl, generateReadUrl, imageGenerator } from "../helpers/utils";
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
      if (error instanceof CustomError) {
        throw error;
      }
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
      if (error instanceof CustomError) {
        throw error;
      }
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

  // src/services/awsServices.ts

  async scaffHoldPdf(data: ScaffHoldDetailsDTO) {

    try {

      // ======================================================
      // GET REQUEST
      // ======================================================

      const request =
        await prisma.projectScaffholdRequest.findFirst({
          where: {
            id: data.id,
          },

          include: {

            project: {
              include: {
                createdBy: true,
              },
            },

            createdBy: {
              include: {
                user: true,
              },
            },
          },
        });

      if (!request) {

        throw new CustomError(
          RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND,
          404,
          "Request not found"
        );
      }

      // ======================================================
      // FORMAT RESPONSE
      // ======================================================

      const formattedResponse = {

        id: request.id,
        uuid: request.uuid,

        PJT:
          request.project?.PJT || null,

        CMPID:
          request.project?.createdBy?.CMPId || null,

        companyName:
          request.project?.createdBy?.name || null,

        address:
          request.address ||
          request.project?.clientAddress ||
          null,

        startDate: request.startDate,
        endDate: request.endDate,

        latitude: request.latitude,
        longitude: request.longitude,

        description: request.description,

        craft: request.craft,

        length: request.length,
        width: request.width,
        height: request.height,

        priority: request.priority,

        tag: request.tag,

        SCAFFID: request.SCAFFID,
        REQID: request.REQID,

        notes: request.notes,

        status: request.status,

        lightDuty: request.lightDuty,
        mediumDuty: request.mediumDuty,
        heavyDuty: request.heavyDuty,
        fallProtection: request.fallProtection,
        handRail: request.handRail,
        toeBoard: request.toeBoard,
        platform: request.platform,
        midRail: request.midRail,
        ladder: request.ladder,
        note: request.note,
        other: request.other,
        tradesmanUserType:
          request.createdBy?.user?.user_type || null,

        projectId: request.projectId,

        createdAt: request.createdAt,
        updatedAt: request.updatedAt,

        // ==========================================
        // Tradesman
        // ==========================================

        tradesmanName:
          request.createdBy?.user?.name || null,

        tradesmanEmail:
          request.createdBy?.user?.email || null,

        tradesmanMobile:
          request.createdBy?.user?.mobileNumber || null,

        // ==========================================
        // Project
        // ==========================================

        projectName:
          request.project?.projectName || null,

        clientName:
          request.project?.clientName || null,

        clientMobile:
          request.project?.clientMobile || null,

        clientEmail:
          request.project?.clientEmail || null,
      };

      // ======================================================
      // GENERATE IMAGE
      // ======================================================

      const imageBuffer =
        await imageGenerator(formattedResponse);

      // ======================================================
      // UPLOADS FOLDER
      // ======================================================

      const uploadsPath = path.join(
        process.cwd(),
        "uploads"
      );

      if (!fs.existsSync(uploadsPath)) {

        fs.mkdirSync(uploadsPath, {
          recursive: true,
        });
      }

      // ======================================================
      // FILE NAME
      // ======================================================

      const fileName =
        `scaffhold-request-${request.id}.png`;

      const imagePath = path.join(
        uploadsPath,
        fileName
      );

      // ======================================================
      // SAVE IMAGE
      // ======================================================

      fs.writeFileSync(
        imagePath,
        imageBuffer
      );

      // ======================================================
      // SERVER URL
      // ======================================================

      const SERVER_URL =
        process.env.SERVER_URL ||
        "http://50.19.99.226:3001";

      // ======================================================
      // IMAGE URL
      // ======================================================

      const imageUrl =
        `${SERVER_URL}/uploads/${fileName}`;

      // ======================================================
      // RESPONSE
      // ======================================================

      return {

        message:
          RESPONSE_MESSAGES.SCAFFHOLD
            .FETCH_BY_ID_SUCCESS,

        imageUrl,
      };

    } catch (error: any) {

      console.error(
        "❌ Get scaffhold request IMAGE error:",
        error
      );

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(
        RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED,
        500,
        error.message
      );
    }
  }

}



