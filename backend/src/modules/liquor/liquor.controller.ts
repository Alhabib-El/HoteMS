import { Request, Response } from "express";
import * as service from "./liquor.service";

export async function getStores(_req: Request, res: Response) {
  res.json(await service.listStores());
}
export async function postStore(req: Request, res: Response) {
  res.status(201).json(await service.createStore(req.body));
}

export async function getProducts(req: Request, res: Response) {
  res.json(await service.listProducts(req.params.storeId));
}
export async function postProduct(req: Request, res: Response) {
  res.status(201).json(await service.createProduct(req.params.storeId, req.body));
}
export async function getTransfers(req: Request, res: Response) {
  res.json(await service.listTransfers(req.params.storeId));
}
export async function postTransfer(req: Request, res: Response) {
  res.status(201).json(
    await service.transferToRestaurant(req.params.storeId, req.params.productId, {
      ...req.body,
      staffId: req.staff!.id,
    })
  );
}

export async function postStockAdjustment(req: Request, res: Response) {
  res.status(201).json(await service.adjustStock(req.params.id, req.body));
}

export async function getLowStock(_req: Request, res: Response) {
  res.json(await service.listLowStock());
}
