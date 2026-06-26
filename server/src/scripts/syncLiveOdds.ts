import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { footballApiService } from '../services/footballApiService';
import Match from '../models/Match';

dotenv.config();

const syncLiveOdds = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peeritrade';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    console.log('Fetching live odds...');
    const liveOddsData = await footballApiService.getLiveOdds();
    console.log(`Received live odds for ${liveOddsData.length} matches.`);

    for (const item of liveOddsData) {
      const { fixture, odds } = item;
      
      const updateData: any = { odds: {} };

      // Market: Match Winner / Fulltime Result
      const matchWinner = odds.find((b: any) => b.id === 1 || b.id === 59 || b.name === 'Match Winner' || b.name === 'Fulltime Result');
      if (matchWinner?.values) {
        const homeVal = matchWinner.values.find((v: any) => v.value === 'Home' || v.value === '1');
        const drawVal = matchWinner.values.find((v: any) => v.value === 'Draw' || v.value === 'X');
        const awayVal = matchWinner.values.find((v: any) => v.value === 'Away' || v.value === '2');

        // Check if market is suspended
        if (!homeVal?.suspended && !drawVal?.suspended && !awayVal?.suspended) {
          if (homeVal?.odd) updateData.odds.home = parseFloat(homeVal.odd);
          if (drawVal?.odd) updateData.odds.draw = parseFloat(drawVal.odd);
          if (awayVal?.odd) updateData.odds.away = parseFloat(awayVal.odd);
        }
      }

      // Market: Over/Under 2.5
      // Checks for ID 5 (standard), ID 25 (Match Goals), or ID 36 (Over/Under Line)
      const overUnder = odds.find((b: any) => 
        [5, 25, 36].includes(b.id) || 
        b.name?.includes('Over/Under') || 
        b.name === 'Match Goals'
      );
      if (overUnder?.values) {
        // Filter for specific 2.5 line if using handicap lines (ID 36)
        const overVal = overUnder.values.find((v: any) => 
          (v.value === 'Over' || v.value === 'Over 2.5') && 
          (v.handicap === '2.5' || v.handicap === null || v.main === true) &&
          (v.main !== false)
        );
        const underVal = overUnder.values.find((v: any) => 
          (v.value === 'Under' || v.value === 'Under 2.5') && 
          (v.handicap === '2.5' || v.handicap === null || v.main === true) &&
          (v.main !== false)
        );

        if (!overVal?.suspended && !underVal?.suspended) {
          if (overVal?.odd) updateData.odds.over25 = parseFloat(overVal.odd);
          if (underVal?.odd) updateData.odds.under25 = parseFloat(underVal.odd);
        }
      }

      // Market: Both Teams Score
      const btts = odds.find((b: any) => b.id === 8 || b.id === 69 || b.name?.includes('Both Teams to Score'));
      if (btts?.values) {
        const yesVal = btts.values.find((v: any) => v.value === 'Yes');
        const noVal = btts.values.find((v: any) => v.value === 'No');

        if (!yesVal?.suspended && !noVal?.suspended) {
          if (yesVal?.odd) updateData.odds.bttsYes = parseFloat(yesVal.odd);
          if (noVal?.odd) updateData.odds.bttsNo = parseFloat(noVal.odd);
        }
      }

      if (Object.keys(updateData.odds).length > 0) {
        await Match.findOneAndUpdate({ fixtureId: fixture.id }, updateData);
        console.log(`Updated detailed odds for fixture ${fixture.id} (Respected complex live IDs)`);
      }
    }

    console.log('Live odds sync completed');
    process.exit(0);
  } catch (error) {
    console.error('Live odds sync failed:', error);
    process.exit(1);
  }
};

syncLiveOdds();
