import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import PoolContract from '../models/PoolContract';
import { enterPool, getPoolDetails } from '../services/poolEngine';

// @route  POST /api/pool/enter
// @access Private
export const enterMatchPool = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { matchId, market, selection, amount } = req.body;
    const result = await enterPool({
      userId: req.user._id.toString(),
      matchId,
      market,
      selection,
      amount,
    });
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// @route  GET /api/pool/:matchId
// @access Public / Private
export const getPoolBreakdown = async (req: any, res: Response) => {
  try {
    const { matchId } = req.params;
    const market = (req.query.market as string) || 'MATCH_OUTCOME';
    const result = await getPoolDetails(matchId, market);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// @route  GET /api/pool/my-contracts
// @access Private
export const getMyPoolContracts = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const query: any = { user: req.user?._id };
    const isBridged = req.query.isBridged;
    if (isBridged !== undefined) {
      query.isBridged = isBridged === 'true';
    }

    const total = await PoolContract.countDocuments(query);
    const contracts = await PoolContract.find(query)
      .populate('match')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      contracts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
