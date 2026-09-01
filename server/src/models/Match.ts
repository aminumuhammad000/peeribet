import mongoose, { Schema, Document } from 'mongoose';

export interface IMatchPool {
  totalPot: number;
  homePot: number;
  drawPot: number;
  awayPot: number;
  over25Pot?: number;
  under25Pot?: number;
  bttsYesPot?: number;
  bttsNoPot?: number;
  houseFeeCollected?: number;
  surplusCollected?: number;
}

export interface IMatchP2PStats {
  totalSharesTraded: number;
  openShares: number;
  matchedShares: number;
}

export interface IMatch extends Document {
  sport?: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  league: string;
  startTime: Date;
  status: 'UPCOMING' | 'LIVE' | 'FINISHED' | 'SUSPENDED';
  isPromoted: boolean;
  scoreHome: number;
  scoreAway: number;
  odds: {
    home: number;
    draw: number;
    away: number;
    over25?: number;
    under25?: number;
    bttsYes?: number;
    bttsNo?: number;
  };
  poolAmount: number;
  pool: IMatchPool;
  p2pStats: IMatchP2PStats;
  bridgeTriggered: boolean;
  fixtureId?: number; // External API fixture ID
}

const matchSchema = new Schema(
  {
    sport: { type: String, default: 'Football' },
    homeTeam: { type: String, required: true },
    awayTeam: { type: String, required: true },
    fixtureId: { type: Number, unique: true, sparse: true },
    homeLogo: { type: String },
    awayLogo: { type: String },
    league: { type: String, required: true },
    startTime: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ['UPCOMING', 'LIVE', 'FINISHED', 'SUSPENDED'], 
      default: 'UPCOMING' 
    },
    isPromoted: { type: Boolean, default: false },
    scoreHome: { type: Number, default: 0 },
    scoreAway: { type: Number, default: 0 },
    odds: {
      home: { type: Number, default: 1.0 },
      draw: { type: Number, default: 1.0 },
      away: { type: Number, default: 1.0 },
      over25: { type: Number, default: 1.0 },
      under25: { type: Number, default: 1.0 },
      bttsYes: { type: Number, default: 1.0 },
      bttsNo: { type: Number, default: 1.0 },
    },
    poolAmount: { type: Number, default: 0 },
    pool: {
      totalPot: { type: Number, default: 0 },
      homePot: { type: Number, default: 0 },
      drawPot: { type: Number, default: 0 },
      awayPot: { type: Number, default: 0 },
      over25Pot: { type: Number, default: 0 },
      under25Pot: { type: Number, default: 0 },
      bttsYesPot: { type: Number, default: 0 },
      bttsNoPot: { type: Number, default: 0 },
      houseFeeCollected: { type: Number, default: 0 },
      surplusCollected: { type: Number, default: 0 },
    },
    p2pStats: {
      totalSharesTraded: { type: Number, default: 0 },
      openShares: { type: Number, default: 0 },
      matchedShares: { type: Number, default: 0 },
    },
    bridgeTriggered: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Match = mongoose.model<IMatch>('Match', matchSchema);
export default Match;
