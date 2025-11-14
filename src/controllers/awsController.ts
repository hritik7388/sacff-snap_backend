import { Response } from "express";
import { Request } from "express";
import { awsCredentialServices } from "../services/awsServices"; 
import { ImageKeySchema, uploadImageDTO, uploadImageSchema } from "../schemas/uploadImageSChema";
const awsData = new awsCredentialServices();
export class awsCredentialController {
 

    async awsCredentials(req: Request, res: Response, next: Function) {
        try { 
            const data = await awsData.awsCredentials( ); // This is the service method
            res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    }
 async getProfileImageUrl(req: Request, res: Response, next: Function) {
        try {
            const data =uploadImageSchema.parse(req.body); // ✅ Zod validation
            const upload = await awsData.getProfileImageUrl(data);
            res.status(200).json(upload);
        } catch (err) {
            next(err);
        }
    }

    async generateReadUrl(req: Request, res: Response, next: Function) {
        try {
            const data  = ImageKeySchema.parse(req.body); // ✅ Zod validation
            const urlData = await awsData.generateReadUrl(data);
            res.status(200).json(urlData);
        } catch (err) {
            next(err);
        }
    }


 
}
