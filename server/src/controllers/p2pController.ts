import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import P2POrder from '../models/P2POrder';
import { placeP2POrder, getOrderBook, cancelP2POrder } from '../services/p2pEngine';

// @route  POST /api/p2p/orders
// @access Private
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { matchId, market, selection, shares } = req.body;
    const result = await placeP2POrder({
      userId: req.user._id.toString(),
      matchId,
      market,
      selection,
      shares,
    });
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// @route  GET /api/p2p/orderbook/:matchId
// @access Public / Private
export const getMatchOrderBook = async (req: any, res: Response) => {
  try {
    const { matchId } = req.params;
    const market = (req.query.market as string) || 'MATCH_OUTCOME';
    const result = await getOrderBook(matchId, market);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// @route  GET /api/p2p/my-orders
// @access Private
export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    const query: any = { user: req.user?._id };
    if (status && status !== 'ALL') {
      if (status === 'PENDING') query.status = { $in: ['OPEN', 'PARTIALLY_MATCHED'] };
      else if (status === 'MATCHED') query.status = 'MATCHED';
      else if (status === 'SETTLED') query.status = 'SETTLED';
      else if (status === 'BRIDGED') query.isBridged = true;
    }

    const total = await P2POrder.countDocuments(query);
    const orders = await P2POrder.find(query)
      .populate('match')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      orders,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @route  POST /api/p2p/cancel/:orderId
// @access Private
export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const orderId = req.params.orderId as string;
    const result = await cancelP2POrder(req.user._id.toString(), orderId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
