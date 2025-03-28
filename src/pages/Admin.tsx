
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { syncWithRiotApi, importCsvData } from '@/services/leagueApi';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, FileSpreadsheet, Loader2, RefreshCw, UserCog } from 'lucide-react';
import PlayerEditForm from '@/components/PlayerEditForm';
import PlayerSelector from '@/components/PlayerSelector';

interface SyncFormData {
  summonerName: string;
}

interface CsvFormData {
  csvData: string;
}

const Admin = () => {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | undefined>(undefined);

  const syncForm = useForm<SyncFormData>({
    defaultValues: {
      summonerName: '',
    },
  });

  const csvForm = useForm<CsvFormData>({
    defaultValues: {
      csvData: '',
    },
  });

  const handleSyncSubmit = async (data: SyncFormData) => {
    if (!data.summonerName) {
      toast({
        title: 'Błąd',
        description: 'Wprowadź nazwę przywoływacza',
        variant: 'destructive',
      });
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncWithRiotApi(data.summonerName);
      
      if (result.success) {
        toast({
          title: 'Sukces',
          description: 'Dane zostały zsynchronizowane z Riot API',
        });
        syncForm.reset();
      } else {
        toast({
          title: 'Błąd',
          description: result.message || 'Nie udało się zsynchronizować danych',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Błąd',
        description: error instanceof Error ? error.message : 'Wystąpił nieznany błąd',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCsvSubmit = async (data: CsvFormData) => {
    if (!data.csvData && !csvFile) {
      toast({
        title: 'Błąd',
        description: 'Wprowadź dane CSV lub załącz plik',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    try {
      let csvData = data.csvData;
      
      // Jeśli załączono plik, odczytaj jego zawartość
      if (csvFile) {
        csvData = await readFileAsText(csvFile);
      }
      
      const result = await importCsvData(csvData);
      
      if (result.success) {
        toast({
          title: 'Sukces',
          description: 'Dane zostały zaimportowane',
        });
        csvForm.reset();
        setCsvFile(null);
      } else {
        toast({
          title: 'Błąd',
          description: result.message || 'Nie udało się zaimportować danych',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Błąd',
        description: error instanceof Error ? error.message : 'Wystąpił nieznany błąd',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel Administracyjny</h1>
        <p className="text-muted-foreground">
          Zarządzaj danymi drużyny, synchronizuj z Riot API i importuj dane
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Uwaga</AlertTitle>
        <AlertDescription>
          Do korzystania z Riot API potrzebny jest klucz API. Upewnij się, że masz skonfigurowane
          odpowiednie zmienne środowiskowe w Supabase.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="players" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="players">Edycja graczy</TabsTrigger>
          <TabsTrigger value="sync">Synchronizacja z Riot API</TabsTrigger>
          <TabsTrigger value="import">Import danych</TabsTrigger>
        </TabsList>
        
        <TabsContent value="players">
          <Card>
            <CardHeader>
              <CardTitle>Edycja graczy</CardTitle>
              <CardDescription>
                Edytuj dane graczy, dodawaj zdjęcia profilowe i synchronizuj z Riot API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <PlayerSelector 
                onSelectPlayer={setSelectedPlayerId} 
                selectedPlayerId={selectedPlayerId} 
              />
              
              {selectedPlayerId ? (
                <PlayerEditForm 
                  playerId={selectedPlayerId} 
                  onSuccess={() => {
                    // Refresh could be added here if needed
                  }} 
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCog className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Wybierz gracza z listy, aby edytować jego dane</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sync">
          <Card>
            <CardHeader>
              <CardTitle>Synchronizacja z Riot API</CardTitle>
              <CardDescription>
                Pobierz najnowsze dane o graczu bezpośrednio z serwerów Riot Games
              </CardDescription>
            </CardHeader>
            <form onSubmit={syncForm.handleSubmit(handleSyncSubmit)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="summonerName">Nazwa przywoływacza</Label>
                  <Input
                    id="summonerName"
                    placeholder="Np. TheShy, Faker"
                    {...syncForm.register('summonerName')}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSyncing}>
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Synchronizacja...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" /> Synchronizuj
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Import danych</CardTitle>
              <CardDescription>
                Importuj dane z pliku CSV lub wklej je bezpośrednio
              </CardDescription>
            </CardHeader>
            <form onSubmit={csvForm.handleSubmit(handleCsvSubmit)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csvFile">Plik CSV</Label>
                  <Input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                  />
                  <p className="text-sm text-muted-foreground">
                    Lub wklej dane CSV poniżej
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="csvData">Dane CSV</Label>
                  <Textarea
                    id="csvData"
                    placeholder="id,name,role,summonerName,..."
                    className="min-h-[200px]"
                    {...csvForm.register('csvData')}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isImporting}>
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importowanie...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="mr-2 h-4 w-4" /> Importuj
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
