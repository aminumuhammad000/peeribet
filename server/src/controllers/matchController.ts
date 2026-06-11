import { Request, Response } from 'express';
import Match from '../models/Match';

// @route  GET /api/matches
// @access Private
export const getMatches = async (req: Request, res: Response) => {
  try {
    const { status, isPromoted } = req.query;
    const filter: any = {};
    
    if (status) filter.status = status;
    if (isPromoted) filter.isPromoted = isPromoted === 'true';

    const matches = await Match.find(filter).sort({ startTime: 1 });
    res.json(matches);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/matches/:id
// @access Private
export const getMatchById = async (req: Request, res: Response) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    res.json(match);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Admin only routes would go here (createMatch, updateScore, etc.)
