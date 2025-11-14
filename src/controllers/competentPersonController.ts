import { Response } from "express";
import { Request } from "express";

import { AuthenticatedRequest } from "../types/index";
import { CompetentPersonServices } from "../services/competentPersonServices";
import { GetInspectionsSchema, InspectionSchema, statusScahema, timeLine, timeLineTag } from "../schemas/competentPersonSchema";


const competentPerson = new CompetentPersonServices

export class competentPersonController {
    async dashboard(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const id = req.user!.id;
            const result = await competentPerson.dashboard(id);
            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    async createInspection(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const id = req.user!.id;
            const data = InspectionSchema.parse(req.body);
            const result = await competentPerson.createInspection(id, data);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    async getInspections(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const data = GetInspectionsSchema.parse(req.query);
            const result = await competentPerson.getInspectionsByScaffholdId(data);
            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    async competentPersonTimeline(req: AuthenticatedRequest, res: Response, next: Function) {
        try {

            const id = req.user!.id;
            const data = timeLine.parse(req.body);
            const result = await competentPerson.competentPersonTimeline(id, data);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }
    async TimelineTag(req: AuthenticatedRequest, res: Response, next: Function) {
        try {

            const id = req.user!.id;
            const data = timeLineTag.parse(req.body);
            const result = await competentPerson.Timelinetag(id, data);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    async getScaffholdTimeline(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const data = GetInspectionsSchema.parse(req.query);
            const result = await competentPerson.getScaffholdTimeline(data);
            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    async getAllTimelineImages(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const data = GetInspectionsSchema.parse(req.query);
            const result = await competentPerson.getAllTimelineImages(data);
            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    async getCompetentPersonScaffHold(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const id = req.user!.id;
            const result = await competentPerson.getScaffHoldListForCompetentPerson(id, page, limit);
            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
}