
import { CustomError } from "../types/customError";
import { RESPONSE_MESSAGES } from "../constants/responseMessages";
import dotenv from "dotenv";
import { generatePresignedUrl, generateReadUrl } from "../helpers/utils";
import { ImageKeyDTO, uploadImageDTO } from "../schemas/uploadImageSChema";
dotenv.config();
const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png"];
const allowedDocumentTypes = ["application/pdf", "image/jpg", "image/png"];


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
}

