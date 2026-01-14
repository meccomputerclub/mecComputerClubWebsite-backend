// services/event.service.ts
import { FilterQuery, UpdateQuery } from "mongoose";
import { Event, IEvent } from "../models/Event.model";

export const createEvent = async (data: Partial<IEvent>): Promise<IEvent> => {
  return await Event.create(data);
};

export const getAllEvents = async (filter: FilterQuery<IEvent> = {}) => {
  // We use populate to replace IDs with actual document data from other collections
  return await Event.find(filter).populate("attendees", "name email").sort({ date: 1 });
};

export const getEventById = async (id: string) => {
  return await Event.findById(id).populate("attendees media projects");
};

export const updateEvent = async (id: string, updateData: UpdateQuery<IEvent>) => {
  return await Event.findByIdAndUpdate(id, updateData, {
    new: true, // returns the updated document
    runValidators: true,
  });
};

export const deleteEvent = async (id: string) => {
  return await Event.findByIdAndDelete(id);
};
