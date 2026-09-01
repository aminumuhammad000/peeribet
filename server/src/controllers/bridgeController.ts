import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { getPendingBridgeOffers, acceptBridgeOffer } from '../services/bridgeProtocol';

// @route  GET /api/bridge/pending-offers
// @access Private
export const getMyBridgeOffers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const offers = await getPendingBridgeOffers(req.user._id.toString());
    res.json({ offers });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @route  POST /api/bridge/accept/:orderId
// @access Private
export const acceptOffer = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const orderId = req.params.orderId as string;
    const result = await acceptBridgeOffer(req.user._id.toString(), orderId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
