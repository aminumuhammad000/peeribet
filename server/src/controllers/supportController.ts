import { Request, Response } from 'express';
import SupportTicket from '../models/SupportTicket';

// @desc    Create new support ticket
// @route   POST /api/support/tickets
export const createTicket = async (req: any, res: Response) => {
  try {
    const { subject, category, description } = req.body;
    
    if (!subject || !category || !description) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const ticket = await SupportTicket.create({
      user: req.user._id,
      subject,
      category,
      description
    });

    res.status(201).json(ticket);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user support tickets
// @route   GET /api/support/tickets
export const getMyTickets = async (req: any, res: Response) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
