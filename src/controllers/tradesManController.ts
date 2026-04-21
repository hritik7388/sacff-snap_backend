// src/controllers/tradesManController.ts
import { Response } from "express";
import { Request } from "express";
import { tradesManServices } from "../services/tradesManServices";
import { tradesManRegisterSchema, tradesManLoginSchema, tradesManCraftSchema, updateProfileSchema, seacrchJobSchema, requestScaffOldSchema, updateScaffOldSRequestchema, jobApplicationSchema, searchScaffHold, deleteRequest, requestSacffHold, GetTradesManDetailsSchema, scaffHoldDetailsById, getrequestSacffHold, searchFilter, } from "../schemas/tradesManSchema";
import { AuthenticatedRequest } from "../types/index";
const tradesMan = new tradesManServices();

export class tradesManController {

  async dashboard(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const id = req.user!.id;
      const result = await tradesMan.dashboard(id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async tradesManRegister(req: Request, res: Response, next: Function) {
    try {
      const data = tradesManRegisterSchema.parse(req.body);
      const user = await tradesMan.registerTradesManServices(data);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }

  async tradesManLogin(req: Request, res: Response, next: Function) {
    try {
      const data = tradesManLoginSchema.parse(req.body);
      const user = await tradesMan.tradesmanloginServices(data);
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  }
  async getTradesManDetails(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const id = req.user!.id;
      const result = await tradesMan.getTradesManDetails(id);

      res.status(200).json(result);

    } catch (err) {
      next(err);
    }

  }

  async getCraftManList(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const result = await tradesMan.getCraftListServices();

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getTradesManCraftList(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const craftName = tradesManCraftSchema.parse(req.query)

      const result = await tradesMan.getTradesManCraftListServices(craftName);

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: Function) {
    try {
      const data = updateProfileSchema.parse(req.body);
      const updatedUser = await tradesMan.updateTradesManProfile(data,);

      // Send response
      res.status(200).json(updatedUser);
    } catch (err) {
      next(err);
    }
  }

  async searchJob(req: Request, res: Response, next: Function) {
    try {
      const data = seacrchJobSchema.parse(req.body);
      const result = await tradesMan.searchJob(data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async requestScaffhold(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const id = req.user!.id;
      const data = requestScaffOldSchema.parse(req.body);
      const result = await tradesMan.requestScaffHoldServices(id, data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async updateScaffHoldRequestController(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const id = req.user!.id;
      const data = updateScaffOldSRequestchema.parse(req.body);
      const result = await tradesMan.updateScaffHoldRequest(id, data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getTrademanRequestList(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const id= req.user!.id;
      const data = searchFilter.parse(req.query);
      const result = await tradesMan.getTrademanRequestListServices(id,data, page, limit);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async joinProject(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const id = req.user!.id;
      const data = jobApplicationSchema.parse(req.body);
      const result = await tradesMan.joinProjectServices(id, data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }

  }

  async getJoinedScaffholds(req: AuthenticatedRequest, res: Response, next: Function) {
    try {

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const id = req.user!.id;
      const result = await tradesMan.getJoinedScaffholds(id, page, limit);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async filterScaffHolds(req: AuthenticatedRequest, res: Response, next: Function) {
    try {

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const data = searchScaffHold.parse(req.query);
      const result = await tradesMan.filterScaffHolds(data, page, limit);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async deleteScaffHoldRequest(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const data = deleteRequest.parse(req.body);
      const result = await tradesMan.deleteScaffHoldRequest(data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getScaffholdRequestDetails(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const id = requestSacffHold.parse(req.query);
      const result = await tradesMan.getRequestScaffHoldById(id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getModifiedRequestDetails(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const id = getrequestSacffHold.parse(req.query);
      const result = await tradesMan.getModifiedRequestsByParentId(id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
  async getAllModifiedRequestDetails(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const id=req.user!.id;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const data = searchFilter.parse(req.query);


      const result = await tradesMan.getAllModifiedRequestsByParentId(id,data, page, limit);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getTradesManScaffHoldDetailsById(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const id = req.user!.id;
      const data = scaffHoldDetailsById.parse(req.query);
      const scaffHoldData = await tradesMan.getTradesManScaffHoldDetailsById(id, data);
      res.status(200).json(scaffHoldData);
    } catch (err) {
      next(err);
    }

  }


  async getSearchFilterScaffHolds(req: AuthenticatedRequest, res: Response, next: Function) {
    try {

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const data = searchFilter.parse(req.body);
      const result = await tradesMan.getSearchFilterData(data, page, limit);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }



  async getFilterScaffHolds(req: AuthenticatedRequest, res: Response, next: Function) {
    try {

      const page = Number(req.body.page) || 1;
      const limit = Number(req.body.limit) || 10;

      const id = req.user!.id;
      const data = searchFilter.parse(req.body);
      const result = await tradesMan.getFilteredScaffHolds(id, data, page, limit);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async delteTradesManAccount(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const id = req.user!.id;
      const result = await tradesMan.deleteTradesman(id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }

  }
}