import { Request, Response } from "express";
import * as service from "./restaurant.service";

export async function getCategories(_req: Request, res: Response) {
  res.json(await service.listCategories());
}
export async function postCategory(req: Request, res: Response) {
  res.status(201).json(await service.createCategory(req.body));
}
export async function postMenuItem(req: Request, res: Response) {
  res.status(201).json(await service.createMenuItem(req.body));
}

export async function getTables(_req: Request, res: Response) {
  res.json(await service.listTables());
}
export async function postTable(req: Request, res: Response) {
  res.status(201).json(await service.createTable(req.body));
}

export async function getRestaurantStaff(_req: Request, res: Response) {
  res.json(await service.listRestaurantStaff());
}

export async function getOrders(req: Request, res: Response) {
  res.json(await service.listOrders(req.query.open === "true"));
}
export async function postOrder(req: Request, res: Response) {
  res.status(201).json(await service.openOrder(req.body));
}
export async function postOrderLinkBooking(req: Request, res: Response) {
  res.json(await service.linkBooking(req.params.id, req.body.bookingId));
}
export async function postOrderAssign(req: Request, res: Response) {
  res.json(await service.assignStaff(req.params.id, req.body.staffId));
}
export async function postOrderItem(req: Request, res: Response) {
  res.status(201).json(await service.addOrderItem(req.params.id, req.body));
}
export async function patchOrderItemStatus(req: Request, res: Response) {
  res.json(await service.updateItemPrepStatus(req.params.id, req.params.itemId, req.body.status));
}
export async function postOrderItemVoid(req: Request, res: Response) {
  res.json(await service.voidOrderItem(req.params.id, req.params.itemId, req.body, req.staff?.id));
}
export async function postOrderPayment(req: Request, res: Response) {
  res.json(await service.addPayment(req.params.id, req.body));
}

export async function getIngredients(_req: Request, res: Response) {
  res.json(await service.listIngredients());
}
export async function postIngredient(req: Request, res: Response) {
  res.status(201).json(await service.createIngredient(req.body));
}
export async function postIngredientAdjustment(req: Request, res: Response) {
  res
    .status(201)
    .json(await service.adjustIngredientStock(req.params.id, { ...req.body, staffId: req.staff?.id }));
}
export async function getIngredientLowStock(_req: Request, res: Response) {
  res.json(await service.listLowStockIngredients());
}

export async function getRecipes(_req: Request, res: Response) {
  res.json(await service.listRecipes());
}
export async function postRecipeLine(req: Request, res: Response) {
  res.status(201).json(await service.upsertRecipeLine(req.body));
}
export async function deleteRecipeLine(req: Request, res: Response) {
  await service.deleteRecipeLine(req.params.id);
  res.status(204).end();
}
