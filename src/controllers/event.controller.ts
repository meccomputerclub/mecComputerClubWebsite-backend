// controllers/event.controller.ts
import { Request, Response } from "express";
import * as EventService from "../services/event.service";

export const handleCreateEvent = async (req: Request, res: Response) => {
  try {
    const event = await EventService.createEvent(req.body);
    res.status(201).json({ success: true, data: event });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const handleGetEvents = async (req: Request, res: Response) => {
  try {
    const { category, status } = req.query;
    const filter: any = {};

    if (category) filter.category = category;
    if (status) filter.status = status;

    const events = await EventService.getAllEvents(filter);
    res.status(200).json({ success: true, count: events.length, data: events });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const handleGetEventById = async (req: Request, res: Response) => {
  try {
    const event = await EventService.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    res.status(200).json({ success: true, data: event });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const handleUpdateEvent = async (req: Request, res: Response) => {
  try {
    const updatedEvent = await EventService.updateEvent(req.params.id, req.body);
    if (!updatedEvent) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    res.status(200).json({ success: true, data: updatedEvent });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const handleDeleteEvent = async (req: Request, res: Response) => {
  try {
    const deletedEvent = await EventService.deleteEvent(req.params.id);
    if (!deletedEvent) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    res.status(200).json({ success: true, message: "Event deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
