
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RIOT_API_KEY = Deno.env.get('RIOT_API_KEY');
const RIOT_API_REGIONS = {
  EUW: 'euw1',
  EUNE: 'eun1',
  NA: 'na1',
  KR: 'kr',
};

const RIOT_API_EUROPE = 'europe';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request data
    const { action, summonerName, region = 'EUW' } = await req.json();
    const regionCode = RIOT_API_REGIONS[region] || RIOT_API_REGIONS.EUW;
    
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    if (!RIOT_API_KEY) {
      throw new Error('Missing Riot API key');
    }

    console.log(`Processing ${action} for ${summonerName} in ${region}`);

    switch (action) {
      case 'syncSummoner':
        return await syncSummonerData(summonerName, regionCode, supabase);
      case 'syncMatches':
        return await syncMatchHistory(summonerName, regionCode, supabase);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Error in Riot API function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'Unknown error occurred'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function syncSummonerData(summonerName, region, supabase) {
  try {
    // Step 1: Get summoner data by name
    const summonerResponse = await fetch(
      `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY } }
    );
    
    if (!summonerResponse.ok) {
      throw new Error(`Failed to fetch summoner data: ${summonerResponse.status} ${summonerResponse.statusText}`);
    }
    
    const summonerData = await summonerResponse.json();
    console.log('Summoner data:', summonerData);
    
    // Step 2: Get league data for the summoner
    const leagueResponse = await fetch(
      `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerData.id}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY } }
    );
    
    if (!leagueResponse.ok) {
      throw new Error(`Failed to fetch league data: ${leagueResponse.status} ${leagueResponse.statusText}`);
    }
    
    const leagueData = await leagueResponse.json();
    console.log('League data:', leagueData);
    
    // Find Solo Queue ranked data
    const soloQueueData = leagueData.find(entry => entry.queueType === 'RANKED_SOLO_5x5') || {};
    
    // Step 3: Save or update player in the database
    const playerData = {
      summoner_name: summonerData.name,
      summoner_id: summonerData.id,
      profile_icon_id: summonerData.profileIconId,
      tier: soloQueueData.tier || null,
      rank: soloQueueData.rank || null,
      league_points: soloQueueData.leaguePoints || 0,
      wins: soloQueueData.wins || 0,
      losses: soloQueueData.losses || 0,
      updated_at: new Date()
    };
    
    // Check if player already exists
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('id')
      .eq('summoner_name', summonerData.name)
      .single();
    
    let result;
    if (existingPlayer) {
      // Update existing player
      result = await supabase
        .from('players')
        .update(playerData)
        .eq('id', existingPlayer.id)
        .select();
    } else {
      // Insert new player with default name and role
      result = await supabase
        .from('players')
        .insert({
          ...playerData,
          name: summonerData.name, // Default name same as summoner name
          role: 'Mid' // Default role
        })
        .select();
    }
    
    if (result.error) {
      throw new Error(`Database error: ${result.error.message}`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Summoner data synchronized successfully', 
        data: result.data
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in syncSummonerData:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'Failed to sync summoner data'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function syncMatchHistory(summonerName, region, supabase) {
  try {
    // Step 1: Get summoner data by name
    const summonerResponse = await fetch(
      `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY } }
    );
    
    if (!summonerResponse.ok) {
      throw new Error(`Failed to fetch summoner data: ${summonerResponse.status} ${summonerResponse.statusText}`);
    }
    
    const summonerData = await summonerResponse.json();
    
    // Step 2: Get the player ID from our database
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id')
      .eq('summoner_name', summonerData.name)
      .single();
    
    if (playerError) {
      throw new Error(`Player not found in database: ${playerError.message}`);
    }
    
    // Step 3: Get match IDs for the summoner
    const matchIdsResponse = await fetch(
      `https://${RIOT_API_EUROPE}.api.riotgames.com/lol/match/v5/matches/by-puuid/${summonerData.puuid}/ids?start=0&count=15`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY } }
    );
    
    if (!matchIdsResponse.ok) {
      throw new Error(`Failed to fetch match IDs: ${matchIdsResponse.status} ${matchIdsResponse.statusText}`);
    }
    
    const matchIds = await matchIdsResponse.json();
    console.log(`Found ${matchIds.length} matches`);
    
    // Step 4: Get match details and save to database
    const matchPromises = matchIds.map(async (matchId) => {
      // Fetch match details
      const matchResponse = await fetch(
        `https://${RIOT_API_EUROPE}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
        { headers: { 'X-Riot-Token': RIOT_API_KEY } }
      );
      
      if (!matchResponse.ok) {
        console.error(`Failed to fetch match ${matchId}: ${matchResponse.status} ${matchResponse.statusText}`);
        return null;
      }
      
      const matchData = await matchResponse.json();
      
      // Find player's participant data
      const participantIndex = matchData.metadata.participants.findIndex(id => id === summonerData.puuid);
      if (participantIndex === -1) {
        console.error(`Player not found in match ${matchId}`);
        return null;
      }
      
      const participantData = matchData.info.participants[participantIndex];
      const gameDurationMinutes = matchData.info.gameDuration / 60;
      
      // Create match record
      const matchRecord = {
        player_id: player.id,
        game_id: matchData.metadata.matchId,
        timestamp: matchData.info.gameCreation,
        champion: participantData.championName,
        champion_id: participantData.championId,
        result: participantData.win ? 'win' : 'loss',
        kills: participantData.kills,
        deaths: participantData.deaths,
        assists: participantData.assists,
        kda: participantData.deaths === 0 ? 
          participantData.kills + participantData.assists : 
          ((participantData.kills + participantData.assists) / participantData.deaths),
        cs: participantData.totalMinionsKilled + (participantData.neutralMinionsKilled || 0),
        cs_per_min: (participantData.totalMinionsKilled + (participantData.neutralMinionsKilled || 0)) / gameDurationMinutes,
        vision: participantData.visionScore,
        gold: participantData.goldEarned,
        duration: Math.round(gameDurationMinutes),
        role: mapRiotRoleToAppRole(participantData.individualPosition),
      };
      
      // Check if match already exists
      const { data: existingMatch } = await supabase
        .from('matches')
        .select('id')
        .eq('player_id', player.id)
        .eq('game_id', matchData.metadata.matchId)
        .single();
      
      if (existingMatch) {
        // Update existing match
        await supabase
          .from('matches')
          .update(matchRecord)
          .eq('id', existingMatch.id);
        return { updated: true, matchId };
      } else {
        // Insert new match
        await supabase
          .from('matches')
          .insert(matchRecord);
        return { inserted: true, matchId };
      }
    });
    
    // Run all match processing in parallel
    const results = await Promise.all(matchPromises);
    const validResults = results.filter(r => r !== null);
    
    // Step 5: Calculate and update player stats
    await updatePlayerStats(player.id, supabase);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Match history synchronized successfully', 
        data: { 
          processed: validResults.length,
          total: matchIds.length
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in syncMatchHistory:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'Failed to sync match history'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function updatePlayerStats(playerId, supabase) {
  try {
    // Get all matches for the player
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .eq('player_id', playerId);
    
    if (matchesError) throw matchesError;
    if (!matches || matches.length === 0) return;
    
    // Calculate basic stats
    const totalMatches = matches.length;
    const wins = matches.filter(m => m.result === 'win').length;
    const losses = totalMatches - wins;
    
    const totalKills = matches.reduce((sum, match) => sum + match.kills, 0);
    const totalDeaths = matches.reduce((sum, match) => sum + match.deaths, 0);
    const totalAssists = matches.reduce((sum, match) => sum + match.assists, 0);
    const totalCs = matches.reduce((sum, match) => sum + match.cs, 0);
    const totalDuration = matches.reduce((sum, match) => sum + match.duration, 0);
    
    // Calculate role distribution
    const rolesPlayed = matches.reduce((acc, match) => {
      if (match.role) {
        acc[match.role] = (acc[match.role] || 0) + 1;
      }
      return acc;
    }, {});
    
    // Calculate champion stats
    const championsMap = matches.reduce((acc, match) => {
      if (!acc[match.champion_id]) {
        acc[match.champion_id] = {
          champion_id: match.champion_id,
          champion_name: match.champion,
          games: 0,
          wins: 0,
          losses: 0,
          kills: 0,
          deaths: 0,
          assists: 0,
          cs_total: 0,
          duration_total: 0
        };
      }
      
      const champ = acc[match.champion_id];
      champ.games += 1;
      if (match.result === 'win') champ.wins += 1;
      else champ.losses += 1;
      
      champ.kills += match.kills;
      champ.deaths += match.deaths;
      champ.assists += match.assists;
      champ.cs_total += match.cs;
      champ.duration_total += match.duration;
      
      return acc;
    }, {});
    
    // Format champion stats for database
    const championStats = Object.values(championsMap).map(champ => {
      return {
        player_id: playerId,
        champion_id: champ.champion_id,
        champion_name: champ.champion_name,
        games: champ.games,
        wins: champ.wins,
        losses: champ.losses,
        win_rate: (champ.wins / champ.games) * 100,
        kills: parseFloat((champ.kills / champ.games).toFixed(1)),
        deaths: parseFloat((champ.deaths / champ.games).toFixed(1)),
        assists: parseFloat((champ.assists / champ.games).toFixed(1)),
        kda: champ.deaths > 0 ? 
          parseFloat(((champ.kills + champ.assists) / champ.deaths).toFixed(2)) : 
          parseFloat((champ.kills + champ.assists).toFixed(2)),
        cs_per_min: parseFloat((champ.cs_total / champ.duration_total).toFixed(1))
      };
    });
    
    // Save player stats
    const playerStats = {
      player_id: playerId,
      win_rate: totalMatches > 0 ? (wins / totalMatches) * 100 : null,
      avg_kills: totalMatches > 0 ? parseFloat((totalKills / totalMatches).toFixed(1)) : null,
      avg_deaths: totalMatches > 0 ? parseFloat((totalDeaths / totalMatches).toFixed(1)) : null,
      avg_assists: totalMatches > 0 ? parseFloat((totalAssists / totalMatches).toFixed(1)) : null,
      avg_kda: totalDeaths > 0 ? 
        parseFloat(((totalKills + totalAssists) / totalDeaths).toFixed(2)) : 
        parseFloat((totalKills + totalAssists).toFixed(2)),
      avg_cs_per_min: totalDuration > 0 ? parseFloat((totalCs / totalDuration).toFixed(1)) : null,
      roles_played: rolesPlayed
    };
    
    // Update player stats in database
    const { data: existingStats } = await supabase
      .from('player_stats')
      .select('id')
      .eq('player_id', playerId)
      .single();
    
    if (existingStats) {
      await supabase
        .from('player_stats')
        .update(playerStats)
        .eq('id', existingStats.id);
    } else {
      await supabase
        .from('player_stats')
        .insert(playerStats);
    }
    
    // Update champion stats: first delete old stats, then insert new ones
    await supabase
      .from('champion_stats')
      .delete()
      .eq('player_id', playerId);
    
    if (championStats.length > 0) {
      await supabase
        .from('champion_stats')
        .insert(championStats);
    }
    
    // Update team stats - wins, losses, and win rate
    const { data: playersData } = await supabase
      .from('players')
      .select('wins, losses');
    
    if (playersData && playersData.length > 0) {
      const totalTeamWins = playersData.reduce((sum, p) => sum + (p.wins || 0), 0);
      const totalTeamLosses = playersData.reduce((sum, p) => sum + (p.losses || 0), 0);
      const totalGames = totalTeamWins + totalTeamLosses;
      const teamWinRate = totalGames > 0 ? (totalTeamWins / totalGames) * 100 : null;
      
      // Get team stats or create if not exists
      const { data: teamStats } = await supabase
        .from('team_stats')
        .select('id')
        .limit(1);
      
      if (teamStats && teamStats.length > 0) {
        await supabase
          .from('team_stats')
          .update({
            total_wins: totalTeamWins,
            total_losses: totalTeamLosses,
            win_rate: teamWinRate
          })
          .eq('id', teamStats[0].id);
      } else {
        await supabase
          .from('team_stats')
          .insert({
            name: 'Team',
            total_wins: totalTeamWins,
            total_losses: totalTeamLosses,
            win_rate: teamWinRate
          });
      }
    }
    
  } catch (error) {
    console.error('Error updating player stats:', error);
    throw error;
  }
}

function mapRiotRoleToAppRole(riotRole) {
  const roleMap = {
    'TOP': 'Top',
    'JUNGLE': 'Jungle',
    'MIDDLE': 'Mid',
    'BOTTOM': 'ADC',
    'UTILITY': 'Support'
  };
  
  return roleMap[riotRole] || null;
}
