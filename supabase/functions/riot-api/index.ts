
import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const riotApiKey = Deno.env.get("RIOT_API_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to check if a string is a valid role
function isValidRole(role: string): boolean {
  const validRoles = ["Top", "Jungle", "Mid", "ADC", "Support"];
  return validRoles.includes(role);
}

// Properly encode Riot ID for API requests
function encodeRiotId(summonerName: string): string {
  // If the summonerName contains a '#', we need to handle it specially
  // Riot API uses URI component encoding for the tagline after the #
  if (summonerName.includes('#')) {
    const [name, tagLine] = summonerName.split('#');
    return `${encodeURIComponent(name)}/${encodeURIComponent(tagLine)}`;
  }
  
  return encodeURIComponent(summonerName);
}

// Function to fetch summoner data from Riot API
async function fetchSummonerDataFromRiotApi(summonerName: string) {
  try {
    console.log(`Attempting to fetch data for summoner: ${summonerName}`);
    
    // Parse Riot ID format (name#tagLine)
    let apiEndpoint;
    let encodedName;
    let isRiotId = summonerName.includes('#');
    
    if (isRiotId) {
      // Use Riot ID endpoint
      const [name, tagLine] = summonerName.split('#');
      encodedName = `${encodeURIComponent(name)}/${encodeURIComponent(tagLine)}`;
      apiEndpoint = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodedName}`;
      console.log(`Using Riot ID API endpoint: ${apiEndpoint}`);
    } else {
      // Use legacy summoner name endpoint
      encodedName = encodeURIComponent(summonerName);
      apiEndpoint = `https://eun1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodedName}`;
      console.log(`Using legacy summoner name API endpoint: ${apiEndpoint}`);
    }
    
    // First, get account by Riot ID or summoner name
    const accountResponse = await fetch(
      apiEndpoint,
      {
        headers: {
          "X-Riot-Token": riotApiKey,
        },
      }
    );

    if (!accountResponse.ok) {
      const errorText = await accountResponse.text();
      console.error(`API Error: ${accountResponse.status} ${accountResponse.statusText}`);
      console.error(`Response body: ${errorText}`);
      throw new Error(`Failed to fetch summoner data: ${accountResponse.status} ${accountResponse.statusText}`);
    }

    const accountData = await accountResponse.json();
    console.log("Account data:", JSON.stringify(accountData));
    
    // For Riot ID format, we need to get the PUUID and fetch summoner data
    let summonerId, summonerData;
    
    if (isRiotId) {
      // Get summoner data using PUUID from a specific region (EUN1 in this case)
      // We need to try multiple regions since the account API doesn't specify which region the player is in
      const regions = ["eun1", "euw1", "na1", "kr"];
      let summonerByPuuidResponse = null;
      let foundRegion = null;
      
      for (const region of regions) {
        try {
          console.log(`Trying to fetch summoner data from region: ${region} for PUUID: ${accountData.puuid}`);
          const response = await fetch(
            `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${accountData.puuid}`,
            {
              headers: {
                "X-Riot-Token": riotApiKey,
              },
            }
          );
          
          if (response.ok) {
            summonerByPuuidResponse = response;
            foundRegion = region;
            console.log(`Found summoner in region: ${foundRegion}`);
            break;
          } else {
            console.log(`Summoner not found in region: ${region}, status: ${response.status}`);
          }
        } catch (err) {
          console.error(`Error checking region ${region}:`, err);
        }
      }
      
      if (!summonerByPuuidResponse || !foundRegion) {
        throw new Error(`Could not find summoner in any region for PUUID: ${accountData.puuid}`);
      }
      
      summonerData = await summonerByPuuidResponse.json();
      summonerId = summonerData.id;
      
      // Fetch ranked data from the found region
      const rankedResponse = await fetch(
        `https://${foundRegion}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`,
        {
          headers: {
            "X-Riot-Token": riotApiKey,
          },
        }
      );

      if (!rankedResponse.ok) {
        throw new Error(`Failed to fetch ranked data: ${rankedResponse.status} ${rankedResponse.statusText}`);
      }

      const rankedData = await rankedResponse.json();
      console.log("Ranked data:", rankedData);

      // Find solo queue ranked entry
      const soloQueueEntry = rankedData.find(
        (entry: any) => entry.queueType === "RANKED_SOLO_5x5"
      );

      return {
        summonerId: summonerId,
        profileIconId: summonerData.profileIconId,
        summonerLevel: summonerData.summonerLevel,
        puuid: accountData.puuid,
        region: foundRegion,
        tier: soloQueueEntry?.tier || null,
        rank: soloQueueEntry?.rank || null,
        leaguePoints: soloQueueEntry?.leaguePoints || 0,
        wins: soloQueueEntry?.wins || 0,
        losses: soloQueueEntry?.losses || 0,
      };
    } else {
      // For legacy, we already have the summoner data
      summonerData = accountData;
      summonerId = summonerData.id;
      
      // Fetch ranked data using the summoner ID from EUN1 (for legacy names)
      const rankedResponse = await fetch(
        `https://eun1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`,
        {
          headers: {
            "X-Riot-Token": riotApiKey,
          },
        }
      );

      if (!rankedResponse.ok) {
        throw new Error(`Failed to fetch ranked data: ${rankedResponse.status} ${rankedResponse.statusText}`);
      }

      const rankedData = await rankedResponse.json();
      console.log("Ranked data:", rankedData);

      // Find solo queue ranked entry
      const soloQueueEntry = rankedData.find(
        (entry: any) => entry.queueType === "RANKED_SOLO_5x5"
      );

      return {
        summonerId: summonerId,
        profileIconId: summonerData.profileIconId,
        summonerLevel: summonerData.summonerLevel,
        puuid: summonerData.puuid,
        region: "eun1", // Default for legacy summoner name
        tier: soloQueueEntry?.tier || null,
        rank: soloQueueEntry?.rank || null,
        leaguePoints: soloQueueEntry?.leaguePoints || 0,
        wins: soloQueueEntry?.wins || 0,
        losses: soloQueueEntry?.losses || 0,
      };
    }
  } catch (error) {
    console.error("Error fetching data from Riot API:", error);
    throw error;
  }
}

// Function to populate player stats
async function populatePlayerStats(playerId: string, summonerName: string) {
  try {
    // 1. Fetch player's existing data
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("*")
      .eq("id", playerId)
      .single();

    if (playerError) {
      throw new Error(`Player not found: ${playerError.message}`);
    }

    // 2. Fetch summoner data from Riot API
    const riotData = await fetchSummonerDataFromRiotApi(summonerName);

    // 3. Update player's basic data
    const { error: updateError } = await supabase
      .from("players")
      .update({
        summoner_id: riotData.summonerId,
        profile_icon_id: riotData.profileIconId,
        tier: riotData.tier,
        rank: riotData.rank,
        league_points: riotData.leaguePoints,
        wins: riotData.wins,
        losses: riotData.losses,
        profile_image_url: null, // Set to null if we don't have a custom one
      })
      .eq("id", playerId);

    if (updateError) {
      throw new Error(`Failed to update player: ${updateError.message}`);
    }

    // 4. Check if player_stats record exists
    const { data: existingStats, error: statsError } = await supabase
      .from("player_stats")
      .select("id")
      .eq("player_id", playerId)
      .maybeSingle();

    // 5. Create or update player_stats
    const statsData = {
      player_id: playerId,
      summoner_name: summonerName,
      tier: riotData.tier,
      rank: riotData.rank,
      league_points: riotData.leaguePoints,
      wins: riotData.wins,
      losses: riotData.losses,
      win_rate: riotData.wins + riotData.losses > 0
        ? (riotData.wins / (riotData.wins + riotData.losses)) * 100
        : 0,
      avg_kills: 0,
      avg_deaths: 0, 
      avg_assists: 0,
      avg_kda: 0,
      avg_cs_per_min: 0,
      roles_played: {},
    };

    if (existingStats) {
      const { error: updateStatsError } = await supabase
        .from("player_stats")
        .update(statsData)
        .eq("id", existingStats.id);

      if (updateStatsError) {
        throw new Error(`Failed to update player stats: ${updateStatsError.message}`);
      }
    } else {
      const { error: insertStatsError } = await supabase
        .from("player_stats")
        .insert(statsData);

      if (insertStatsError) {
        throw new Error(`Failed to insert player stats: ${insertStatsError.message}`);
      }
    }

    return {
      success: true,
      message: "Player stats updated successfully",
      data: {
        playerId,
        summonerName,
        tier: riotData.tier,
        rank: riotData.rank,
      },
    };
  } catch (error) {
    console.error("Error populating player stats:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Function to sync a summoner with Riot API
async function syncSummonerWithRiotApi(summonerName: string) {
  try {
    // 1. Fetch summoner data from Riot API
    const riotData = await fetchSummonerDataFromRiotApi(summonerName);

    // 2. Check if a player with this summoner name already exists
    const { data: existingPlayer, error: lookupError } = await supabase
      .from("players")
      .select("*")
      .eq("summoner_name", summonerName)
      .maybeSingle();

    if (lookupError && lookupError.code !== "PGRST116") {
      throw new Error(`Database error: ${lookupError.message}`);
    }

    // 3. Update or create player
    if (existingPlayer) {
      // Update existing player
      const { error: updateError } = await supabase
        .from("players")
        .update({
          summoner_id: riotData.summonerId,
          profile_icon_id: riotData.profileIconId,
          tier: riotData.tier,
          rank: riotData.rank,
          league_points: riotData.leaguePoints,
          wins: riotData.wins,
          losses: riotData.losses,
        })
        .eq("id", existingPlayer.id);

      if (updateError) {
        throw new Error(`Failed to update player: ${updateError.message}`);
      }

      // Also update player stats
      await populatePlayerStats(existingPlayer.id, summonerName);

      return {
        success: true,
        message: "Player updated successfully",
        data: {
          playerId: existingPlayer.id,
          action: "updated",
        },
      };
    } else {
      // Create new player (with a default role since we can't determine it from the API)
      const { data: newPlayer, error: insertError } = await supabase
        .from("players")
        .insert({
          name: summonerName, // Use summoner name as display name initially
          role: "Mid", // Default role
          summoner_name: summonerName,
          summoner_id: riotData.summonerId,
          profile_icon_id: riotData.profileIconId,
          tier: riotData.tier,
          rank: riotData.rank,
          league_points: riotData.leaguePoints,
          wins: riotData.wins,
          losses: riotData.losses,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to create player: ${insertError.message}`);
      }

      // Also create player stats
      await populatePlayerStats(newPlayer.id, summonerName);

      return {
        success: true,
        message: "Player created successfully",
        data: {
          playerId: newPlayer.id,
          action: "created",
        },
      };
    }
  } catch (error) {
    console.error("Error syncing with Riot API:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Function to import CSV data
async function importCsvData(csvData: string) {
  try {
    // Parse CSV
    const lines = csvData.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim());
    
    // Check required headers
    const requiredHeaders = ["name", "role", "summoner_name"];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`CSV is missing required headers: ${missingHeaders.join(", ")}`);
    }
    
    // Process rows
    const results = {
      created: 0,
      updated: 0,
      errors: 0,
      details: [] as string[],
    };
    
    // Process each line (skip header)
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(",").map(v => v.trim());
        if (values.length !== headers.length) {
          results.errors++;
          results.details.push(`Line ${i+1}: Column count mismatch`);
          continue;
        }
        
        // Create a player object from the CSV row
        const player: Record<string, any> = {};
        headers.forEach((header, index) => {
          player[header] = values[index];
        });
        
        // Validate required fields
        if (!player.name || !player.role || !player.summoner_name) {
          results.errors++;
          results.details.push(`Line ${i+1}: Missing required fields`);
          continue;
        }
        
        // Validate role
        if (!isValidRole(player.role)) {
          results.errors++;
          results.details.push(`Line ${i+1}: Invalid role "${player.role}"`);
          continue;
        }
        
        // Check if player exists (by summoner_name)
        const { data: existingPlayer, error: lookupError } = await supabase
          .from("players")
          .select("id")
          .eq("summoner_name", player.summoner_name)
          .maybeSingle();
        
        if (lookupError && lookupError.code !== "PGRST116") {
          throw lookupError;
        }
        
        if (existingPlayer) {
          // Update existing player
          const { error: updateError } = await supabase
            .from("players")
            .update({
              name: player.name,
              role: player.role,
            })
            .eq("id", existingPlayer.id);
          
          if (updateError) {
            results.errors++;
            results.details.push(`Line ${i+1}: Failed to update player - ${updateError.message}`);
            continue;
          }
          
          results.updated++;
        } else {
          // Create new player
          const { error: insertError } = await supabase
            .from("players")
            .insert({
              name: player.name,
              role: player.role,
              summoner_name: player.summoner_name,
              profile_image_url: null
            });
          
          if (insertError) {
            results.errors++;
            results.details.push(`Line ${i+1}: Failed to create player - ${insertError.message}`);
            continue;
          }
          
          results.created++;
        }
      } catch (error) {
        results.errors++;
        results.details.push(`Line ${i+1}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
    
    return {
      success: true,
      message: `Import completed: ${results.created} created, ${results.updated} updated, ${results.errors} errors`,
      data: results,
    };
  } catch (error) {
    console.error("Error importing CSV data:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Handle HTTP requests
serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const { action, playerId, summonerName, csvData } = await req.json();

    let result;
    switch (action) {
      case "populatePlayerStats":
        if (!playerId || !summonerName) {
          throw new Error("playerId and summonerName are required");
        }
        result = await populatePlayerStats(playerId, summonerName);
        break;

      case "syncSummonerWithRiotApi":
        if (!summonerName) {
          throw new Error("summonerName is required");
        }
        result = await syncSummonerWithRiotApi(summonerName);
        break;

      case "importCsvData":
        if (!csvData) {
          throw new Error("csvData is required");
        }
        result = await importCsvData(csvData);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
