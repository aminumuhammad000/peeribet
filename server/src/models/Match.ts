import mongoose, { Schema, Document } from 'mongoose';

export interface IMatch extends Document {
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
  fixtureId?: number; // External API fixture ID
}

const matchSchema = new Schema(
  {
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
    },
    poolAmount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const Match = mongoose.model<IMatch>('Match', matchSchema);
export default Match;
