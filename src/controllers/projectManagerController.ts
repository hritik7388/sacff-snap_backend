// src/controllers/projectManagerController.ts
import { Response } from "express";
import { Request } from "express";
import { ProjectManagerServices } from "../services/projectManagerServices";
import { projectManagerLoginSchema, projectDetailById, GetUserDetailsSchema, requestedScaffolds, approveRejectRequestSchema, getJobCraftSchema, getScaffholdRequestsByCreator, uploadImage, ImageSchema } from "../schemas/projectManagerSchema";
import { AuthenticatedRequest } from "../types/index";
import { searchFilter } from "../schemas/tradesManSchema";
const projectManager = new ProjectManagerServices();

export class projectManagerController {

  async commonLogin(req: Request, res: Response, next: Function) {
    try {
      const data = projectManagerLoginSchema.parse(req.body);
      const user = await projectManager.commonLoginServices(data);
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  }

  async getProjectList(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const status = req.query.status as string | undefined;
      const id = req.user!.id;

      const result = await projectManager.getProjectListServices(id,page, limit, status);

      res.status(200).json(result);

    } catch (err) {
      next(err);
    }
  }

  async getUserDetails(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const id = req.user!.id;
      const result = await projectManager.getUserDetails(id);

      res.status(200).json(result);

    } catch (err) {
      next(err);
    }

  }

  async getRequestedScaffolds(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const scaffHoldId = requestedScaffolds.parse(req.query)
      const result = await projectManager.getRequestedScaffolds(scaffHoldId);

      res.status(200).json(result);

    } catch (err) {
      next(err);
    }
  }

  async approveRejectRequest(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const data = approveRejectRequestSchema.parse(req.body);
      const result = await projectManager.approveOrRejectScaffHoldRequest(data);
      res.status(200).json(result)

    } catch (err) {
      next(err);
    }


  }

  async getPendingTrademanRequestList(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const data = searchFilter.parse(req.query);
        const id = req.user!.id;
      const result = await projectManager.getTrademanPendingRequestListServices(id,data, page, limit);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getAllPendingModifiedRequestDetails(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const data = searchFilter.parse(req.query);

        const id = req.user!.id;


      const result = await projectManager.getAllPendingModifiedRequestsByParentId(id,data, page, limit);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getScaffHoldJobCraft(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const data = getJobCraftSchema.parse(req.query);


      const result = await projectManager.getScaffHoldJobAndCraftDetails(data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }


  async getScaffholdRequestsByCreator(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const data = getScaffholdRequestsByCreator.parse(req.query);


      const result = await projectManager.getScaffholdRequestsByCreator(data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async dashboard(req: AuthenticatedRequest, res: Response, next: Function) {
    try { 
       const id = req.user!.id;
      const result = await projectManager.getDashboardStats(id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

    async updateProfileImage(req: AuthenticatedRequest, res: Response, next: Function) {
    try { 

      const userId = req.user!.id;
      const data=uploadImage.parse(req.body)
      const result = await projectManager.updateProfileImage(userId,data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

     async updateUserProfileImage(req: AuthenticatedRequest, res: Response, next: Function) {
    try { 

      const userId = req.user!.id;
      const data=ImageSchema.parse(req.body)
      const result = await projectManager.updateUserProfileImage(userId,data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async generateProjectJobLink(
    req: AuthenticatedRequest,
    res: Response,
    next: Function
) {
    try {

          const PJT =
                String(req.params.PJT);
                console.log("PJT=============>>>",PJT)

        const data =
            await projectManager.generateProjectJobLink(
                PJT
            );

        res.status(200).json(data);

    } catch (err) {
        next(err);
    }
}


}