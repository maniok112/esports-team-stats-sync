import { syncPlayerStats } from './src/services/leagueApi';

const testSyncPlayerStats = async () => {
  const playerId = '9c424be9-e357-432c-a5de-68dc4c71e0d8'; // Replace with the correct player ID
  const summonerName = 'mdou#天04'; // Summoner name for mrozku

  try {
    console.log(`Testing syncPlayerStats for playerId: ${playerId}, summonerName: ${summonerName}`);
    await syncPlayerStats(playerId, summonerName);
    console.log('Player stats synced successfully!');
  } catch (error) {
    console.error('Error syncing player stats:', error);
  }
};

testSyncPlayerStats();
