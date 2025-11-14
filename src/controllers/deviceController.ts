import {Response} from "express";
import {Request} from "express";
import {AuthenticatedRequest} from "../types/index";
import {deviceSchema} from "../schemas/deviceTokenSchema";
import {DeviceServices} from "../services/deviceServices";

const deviceServicesController = new DeviceServices();

export class DeviceController {
    async updateDevice(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const {id, user_type} = req.user!;
            const data = deviceSchema.parse(req.body);

            const user = await deviceServicesController.updateDeviceToken(Number(id), {...data, user_type});

            res.status(200).json(user);
        }catch (err) {
        next(err);
        }
    }
}
