import { Response } from "express";
import { Request } from "express";
import {
    companyRegisterSchema,

    companyUpdateSchema,
    companyIdSchema,
} from "../schemas/companySchema";
import { CompanyServices } from "../services/comapnyServices";
import { AuthenticatedRequest } from "../types/index";

const companyServiceController = new CompanyServices();

export class CompanyControllers {
    async registerCompany(req: Request, res: Response, next: Function) {
        try {
            const data = companyRegisterSchema.parse(req.body);

            const company = await companyServiceController.registerCompany(data,);
            res.status(201).json(company);
        } catch (err) {
            next(err);
        }
    }


    async updatedCompanyDetails(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const data = companyUpdateSchema.parse(req.body);
            const company = await companyServiceController.updateCompanyDetails(data);
            res.status(200).json(company);
        } catch (err) {
            next(err);
        }
    }

    async getAllCompnay(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const companies = await companyServiceController.getCompanyallDetails(page, limit,);
            res.status(200).json(companies);
        } catch (err) {
            next(err);
        }
    }

    async getCompanyById(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const data = companyIdSchema.parse(req.query);
            const company = await companyServiceController.getCompanyById(data,);
            res.status(200).json(company);
        } catch (err) {
            next(err);
        }
    }

    async requestListApproval(req: AuthenticatedRequest, res: Response, next: Function) {
        try {

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const companies = await companyServiceController.requestListApproval(page, limit,);
            res.status(200).json(companies);
        } catch (err) {
            next(err);
        }
    }



    async searchCompany(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const data = req.query.search;
            const searchData = await companyServiceController.searchCompany(data, page, limit,);
            res.status(200).json(searchData);
        } catch (err) {
            next(err);
        }
    }


}
