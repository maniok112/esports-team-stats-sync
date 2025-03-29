import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://koxsapppoyxekhoelcqt.supabase.co';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtveHNhcHBwb3l4ZWtob2VsY3F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxODczODUsImV4cCI6MjA1ODc2MzM4NX0.BNNYAi0D-GQ8AvYzNYw6G3-zJ-gRB7N6J7dmJM75Jl0';
const RIOT_API_KEY = Deno.env.get('RIOT_API_KEY') || 'RGAPI-4b4aaede-7f1a-4f0d-94c4-14e561b15a41';
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

async function syncSummonerData(summonerName, region = 'EUW', supabase) {
  try {
    console.log(`Starting sync for summoner: ${summonerName}, region: ${region}`);

    const summonerData = await fetchSummonerDataFromRiotApi(summonerName, region);
    if (!summonerData) {
      console.error(`Summoner ${summonerName} not found on ${region} server.`);
      throw new Error(`Summoner ${summonerName} not found on ${region} server.`);
    }

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
    const { data: existingPlayer, error: playerError } = await supabase
      .from('players')
      .select('id')
      .eq('summoner_name', summonerData.name)
      .single();

    if (playerError) {
      console.error('Error fetching player from database:', playerError);
      throw new Error('Failed to fetch player from database');
    }

    const playerId = existingPlayer?.id; // Ensure player_id is correctly used
    console.log(`Fetched player_id: ${playerId} for summoner_name: ${summonerName}`);
    
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
    throw error; // Ensure the error is logged in Supabase logs
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
      console.error('Error fetching player from database:', playerError);
      throw new Error(`Player not found in database: ${playerError.message}`);
    }

    const playerId = player?.id; // Ensure player_id is correctly used
    console.log(`Fetched player_id: ${playerId} for summoner_name: ${summonerName}`);
    
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
    console.log(`Updating player stats for playerId: ${playerId}`);

    // Get all matches for the player
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .eq('player_id', playerId);

    if (matchesError) {
      console.error('Error fetching matches for player stats:', matchesError);
      throw matchesError;
    }

    if (!matches || matches.length === 0) {
      console.warn(`No matches found for playerId: ${playerId}`);
      return;
    }

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

    // Prepare player stats
    const playerStats = {
      player_id: playerId,
      win_rate: totalMatches > 0 ? (wins / totalMatches) * 100 : null,
      avg_kills: totalMatches > 0 ? parseFloat((totalKills / totalMatches).toFixed(1)) : null,
      avg_deaths: totalMatches > 0 ? parseFloat((totalDeaths / totalMatches).toFixed(1)) : null,
      avg_assists: totalMatches > 0 ? parseFloat((totalAssists / totalMatches).toFixed(1)) : null,
      avg_kda: totalDeaths > 0
        ? parseFloat(((totalKills + totalAssists) / totalDeaths).toFixed(2))
        : parseFloat((totalKills + totalAssists).toFixed(2)),
      avg_cs_per_min: totalDuration > 0
        ? parseFloat((totalCs / totalDuration).toFixed(1))
        : null,
      roles_played: rolesPlayed,
    };

    console.log('Calculated player stats:', playerStats);

    // Update or insert player stats
    const { data: existingStats } = await supabase
      .from('player_stats')
      .select('id')
      .eq('player_id', playerId)
      .maybeSingle();

    if (existingStats) {
      const { error: updateError } = await supabase
        .from('player_stats')
        .update(playerStats)
        .eq('id', existingStats.id);

      if (updateError) {
        console.error('Error updating player stats:', updateError);
        throw updateError;
      }
    } else {
      const { error: insertError } = await supabase
        .from('player_stats')
        .insert(playerStats);

      if (insertError) {
        console.error('Error inserting player stats:', insertError);
        throw insertError;
      }
    }

    console.log('Player stats updated successfully for playerId:', playerId);
  } catch (error) {
    console.error('Error in updatePlayerStats:', error);
    throw error;
  }
}

async function populatePlayerStats(playerId, summonerName, supabase) {
  try {
    console.log(`Populating stats for playerId: ${playerId}, summonerName: ${summonerName}`);

    // Fetch matches and stats from Riot API
    const riotResponse = await fetchRiotApiData(summonerName);
    if (!riotResponse) throw new Error('Failed to fetch data from Riot API');

    const { matches, stats } = riotResponse;

    console.log('Fetched matches and stats from Riot API:', { matches, stats });

    // Calculate player stats
    const totalMatches = matches.length;
    const wins = matches.filter(m => m.result === 'win').length;
    const losses = totalMatches - wins;
    const totalKills = matches.reduce((sum, match) => sum + match.kills, 0);
    const totalDeaths = matches.reduce((sum, match) => sum + match.deaths, 0);
    const totalAssists = matches.reduce((sum, match) => sum + match.assists, 0);
    const totalCs = matches.reduce((sum, match) => sum + match.cs, 0);
    const totalDuration = matches.reduce((sum, match) => sum + match.duration, 0);

    const avgKills = totalMatches > 0 ? parseFloat((totalKills / totalMatches).toFixed(1)) : null;
    const avgDeaths = totalMatches > 0 ? parseFloat((totalDeaths / totalMatches).toFixed(1)) : null;
    const avgAssists = totalMatches > 0 ? parseFloat((totalAssists / totalMatches).toFixed(1)) : null;
    const avgKDA = totalDeaths > 0 ? parseFloat(((totalKills + totalAssists) / totalDeaths).toFixed(2)) : null;
    const avgCsPerMin = totalDuration > 0 ? parseFloat((totalCs / totalDuration).toFixed(1)) : null;

    const playerStats = {
      player_id: playerId,
      win_rate: totalMatches > 0 ? (wins / totalMatches) * 100 : null,
      avg_kills: avgKills,
      avg_deaths: avgDeaths,
      avg_assists: avgAssists,
      avg_kda: avgKDA,
      avg_cs_per_min: avgCsPerMin,
      roles_played: stats.rolesPlayed,
    };

    console.log('Calculated player stats:', playerStats);

    // Insert or update player stats in the database
    const { data: existingStats, error: fetchError } = await supabase
      .from('player_stats')
      .select('id')
      .eq('player_id', playerId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching existing player stats:', fetchError);
      throw fetchError;
    }

    if (existingStats) {
      const { error: updateError } = await supabase
        .from('player_stats')
        .update(playerStats)
        .eq('id', existingStats.id);

      if (updateError) {
        console.error('Error updating player stats:', updateError);
        throw updateError;
      }
      console.log('Updated player stats successfully');
    } else {
      const { error: insertError } = await supabase
        .from('player_stats')
        .insert(playerStats);

      if (insertError) {
        console.error('Error inserting player stats:', insertError);
        throw insertError;
      }
      console.log('Inserted player stats successfully');
    }
  } catch (error) {
    console.error('Error in populatePlayerStats:', error);
    throw error;
  }
}

// Helper function to fetch data from Riot API
async function fetchRiotApiData(summonerName) {
  // Implementacja wywołania Riot API i przetwarzania danych
  // ...existing code...
}

async function fetchSummonerDataFromRiotApi(summonerName, region) {
  try {
    const response = await fetch(
      `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY } }
    );

    if (!response.ok) {
      console.error(`Failed to fetch summoner data: ${response.status} ${response.statusText}`);
      return null;
    }

    const summonerData = await response.json();
    return summonerData;
  } catch (error) {
    console.error('Error fetching summoner data from Riot API:', error);
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
