// src/controllers/scaffHoldController.ts
import { Response } from "express";
import { Request } from "express";
import { AuthenticatedRequest } from "../types/index";
import { ScaffHoldsServices } from "../services/scaffHoldServices";
import { changePriorityAndTagsSchema, projectScaffhold, removeScaffCompetentPerson, scaffCompetentPerson, ScaffCompetentPerson, scaffHoldDetailsById, scaffHoldSchema } from "../schemas/scaffHoldSchema";

const scaffHold = new ScaffHoldsServices();

export class scaffHoldController {
    async createScaffHold(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const userId = req.user!.id;
            const data = scaffHoldSchema.parse(req.body);
            const scaffHoldData = await scaffHold.createScaffHold(userId, data);
            res.status(201).json(scaffHoldData);
        } catch (err) {
            next(err);
        }

    }

    async getAllScaffHold(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const scaffHoldData = await scaffHold.getAllScaffHolds(page, limit,);
            res.status(200).json(scaffHoldData);
        } catch (err) {
            next(err);
        }
    }

    async getScaffHoldDetailsById(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const data = scaffHoldDetailsById.parse(req.query);
            const scaffHoldData = await scaffHold.getScaffHoldById(data);
            res.status(200).json(scaffHoldData);
        } catch (err) {
            next(err);
        }

    }
    async getProjectScaffHold(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const projectId = projectScaffhold.parse(req.query);
            const scaffHoldData = await scaffHold.getProjectScaffHold(projectId, page, limit);
            res.status(200).json(scaffHoldData);
        } catch (err) {
            next(err);
        }
    }

    async getScaffHoldCompetentPerson(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const data = scaffCompetentPerson.parse(req.query);
            const scaffHoldData = await scaffHold.scaffHoldCompetentPersons(data);
            res.status(200).json(scaffHoldData);
        } catch (err) {
            next(err);
        }
    }
    async getScaffCompetentPerson(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const data = scaffHoldDetailsById.parse(req.query);
            const scaffHoldData = await scaffHold.scaffAndCompetentPersons(data);
            res.status(200).json(scaffHoldData);
        } catch (err) {
            next(err);
        }
    }
    async addScaffHoldCompetentPerson(req: AuthenticatedRequest, res: Response, next: Function) {
        try {

            const data = ScaffCompetentPerson.parse(req.body);
            const userId = req.user!.id;
            
            const competentData = await scaffHold.addCompetentPersonToScaffHold(userId,data);
            res.status(200).json(competentData);

        } catch (err) {
            next(err);
        }
    }
    async removeScaffHoldCompetentPerson(req: AuthenticatedRequest, res: Response, next: Function) {
        try {

            const data = removeScaffCompetentPerson.parse(req.query);
            const competentData = await scaffHold.removeCompetentPersonFromScaffHold(data);
            res.status(200).json(competentData);

        } catch (err) {
            next(err);
        }
    }

    async changeTagsPriority(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const data = changePriorityAndTagsSchema.parse(req.body);
            const Chnages = await scaffHold.changePriorityAndTags(data)

            res.status(200).json(Chnages);

        } catch (err) {
            next(err);
        }
    }


    async companyNotifictaion(req: AuthenticatedRequest, res: Response, next: Function) {
        try {

            const userId = req.user!.id;
            const company = await scaffHold.getCompanyNotifications(userId);
            res.status(200).json(company);
        } catch (err) {
            next(err);
        }
    }


}