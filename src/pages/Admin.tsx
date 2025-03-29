
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { importCsvData, syncWithRiotApi } from '@/services/leagueApi';
import { PlayerSelector } from '@/components/PlayerSelector';
import { toast } from 'sonner';

export default function Admin() {
  const [csvData, setCsvData] = useState('');
  const [summonerName, setSummonerName] = useState('');
  const [isLoading, setIsLoading] = useState({
    importCsv: false,
    syncPlayer: false
  });
  
  const handleImportCsv = async () => {
    if (!csvData.trim()) {
      toast.error('Please enter CSV data');
      return;
    }
    
    setIsLoading(prev => ({ ...prev, importCsv: true }));
    
    try {
      const result = await importCsvData(csvData);
      if (result.success) {
        toast.success(result.message);
        setCsvData('');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error importing CSV data:', error);
      toast.error('Failed to import CSV data');
    } finally {
      setIsLoading(prev => ({ ...prev, importCsv: false }));
    }
  };
  
  const handleSyncPlayer = async () => {
    if (!summonerName.trim()) {
      toast.error('Please enter a summoner name');
      return;
    }
    
    setIsLoading(prev => ({ ...prev, syncPlayer: true }));
    
    try {
      const result = await syncWithRiotApi(summonerName);
      if (result.success) {
        toast.success(result.message);
        setSummonerName('');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error syncing player:', error);
      toast.error('Failed to sync player data');
    } finally {
      setIsLoading(prev => ({ ...prev, syncPlayer: false }));
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      </div>
      
      <Tabs defaultValue="players">
        <TabsList>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="import">Import CSV</TabsTrigger>
        </TabsList>
        
        <TabsContent value="players" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Players</CardTitle>
              <CardDescription>
                Edit player information or sync stats with Riot API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="player-select">Select Player to Edit</Label>
                <PlayerSelector />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="summoner-name">Add Player from Riot API</Label>
                <div className="flex space-x-2">
                  <Input 
                    id="summoner-name"
                    placeholder="Enter Summoner Name or Riot ID (name#tag)"
                    value={summonerName}
                    onChange={(e) => setSummonerName(e.target.value)}
                  />
                  <Button 
                    onClick={handleSyncPlayer}
                    disabled={isLoading.syncPlayer}
                  >
                    {isLoading.syncPlayer ? 'Syncing...' : 'Sync'}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  For Riot ID format, use: name#tag (e.g., Riot#EUW)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Players from CSV</CardTitle>
              <CardDescription>
                Bulk import players using CSV format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTitle>CSV Format</AlertTitle>
                <AlertDescription>
                  Use the format: <code>name,role,summoner_name</code><br />
                  Example: <code>TheShy,Top,TheShy#KR1</code>
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="csv-input">CSV Data</Label>
                <Textarea 
                  id="csv-input"
                  placeholder="name,role,summoner_name
TheShy,Top,TheShy#KR1
Faker,Mid,Faker#KR1"
                  rows={10}
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={handleImportCsv}
                disabled={isLoading.importCsv}
              >
                {isLoading.importCsv ? 'Importing...' : 'Import'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
