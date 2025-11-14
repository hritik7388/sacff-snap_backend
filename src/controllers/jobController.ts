import { Response } from "express";
import { Request } from "express";
import { deleteJobCraftSchema, getJobCraftSchema, jobCraftSchema, jobSchema, updateJobCraftSchema } from "../schemas/jobSchema";
import { JobServices } from "../services/jobServices";
import { AuthenticatedRequest } from "../types";
const jobServicesController = new JobServices();

export class jobController {


    async updateDescreption(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const id = req.user!.id;
            const data = jobSchema.parse(req.body);
            const job = await jobServicesController.updateJobDescreption(id, data);
            res.status(200).json(job);
        } catch (err) {
            next(err);
        }
    }
    async addJobCraft(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const data = jobCraftSchema.parse(req.body);
            const job = await jobServicesController.addAndUpdateJobCraft(data);
            res.status(200).json(job);
        } catch (err) {
            next(err);
        }
    }



    async getJobCraft(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const data = getJobCraftSchema.parse(req.query);
            const job = await jobServicesController.getJobAndCraftDetails(data);
            res.status(200).json(job);
        } catch (err) {
            next(err);
        }
    }


    async getCraftandCountlist(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const result = await jobServicesController.getCraftandCountlist();
            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    async deleteJobCrfats(req: AuthenticatedRequest, res: Response, next: Function) {
        try { 
            const data = deleteJobCraftSchema.parse(req.body); 
            const result = await jobServicesController.deleteJobCrfats(data); 
            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
}
