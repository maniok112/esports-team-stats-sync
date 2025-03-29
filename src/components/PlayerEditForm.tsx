import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { Player, Role } from '@/types/league';
import { supabase } from '@/services/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Save, User, Upload } from 'lucide-react';

type PlayerFormValues = {
  name: string;
  role: Role;
  summoner_name: string;
  profileImage?: File | null;
};

type PlayerEditFormProps = {
  playerId: string;
  onSuccess?: () => void;
};

const roles: Role[] = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];

const PlayerEditForm = ({ playerId, onSuccess }: PlayerEditFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const form = useForm<PlayerFormValues>({
    defaultValues: {
      name: '',
      role: 'Top',
      summoner_name: '',
      profileImage: null
    }
  });

  // Fetch player data and sync stats
  useEffect(() => {
    const fetchAndSyncPlayer = async () => {
      setIsLoading(true);
      try {
        // Fetch player data
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .eq('id', playerId)
          .single();

        if (error) throw error;

        if (data) {
          setPlayer(data);
          form.reset({
            name: data.name,
            role: data.role,
            summoner_name: data.summoner_name || '',
          });

          // If player has a profile image URL
          if (data.profile_image_url) {
            setImagePreviewUrl(data.profile_image_url);
          }

          // Automatically sync player stats
          if (data.summoner_name) {
            console.log(`Auto-syncing stats for player_id: ${data.id}, summoner_name: ${data.summoner_name}`);
            await syncPlayerStats(data.id, data.summoner_name);
          }
        }
      } catch (error) {
        console.error('Error fetching or syncing player:', error);
        toast({
          title: 'Error',
          description: 'Failed to load or sync player data.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (playerId) {
      fetchAndSyncPlayer();
    }
  }, [playerId, form, toast]);

  // Handle file input changes
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      form.setValue('profileImage', file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: PlayerFormValues) => {
    setIsLoading(true);
    try {
      // Validate updateData
      const updateData = {
        name: values.name,
        role: values.role,
        summoner_name: values.summoner_name,
      };

      console.log('Update Data:', updateData); // Debugging

      // Update player data
      const { error: updateError } = await supabase
        .from('players')
        .update(updateData)
        .eq('id', playerId);

      if (updateError) {
        console.error('Update Error:', updateError); // Log detailed error
        throw updateError;
      }

      // Handle profile image upload if provided
      if (values.profileImage) {
        const file = values.profileImage;
        const fileExt = file.name.split('.').pop();
        const fileName = `${playerId}-profile.${fileExt}`;
        const filePath = `players/${fileName}`;

        // Check if storage bucket exists
        const { data: bucketData, error: bucketError } = await supabase
          .storage
          .getBucket('players');

        if (bucketError) {
          console.error('Bucket Error:', bucketError); // Log bucket error
          throw bucketError;
        }

        if (!bucketData) {
          // Create bucket
          const { error: createBucketError } = await supabase
            .storage
            .createBucket('players', {
              public: true,
              fileSizeLimit: 1024 * 1024 * 2, // 2MB limit
            });

          if (createBucketError) {
            console.error('Create Bucket Error:', createBucketError); // Log error
            throw createBucketError;
          }
        }

        // Upload file
        const { error: uploadError } = await supabase
          .storage
          .from('players')
          .upload(filePath, file, {
            upsert: true,
            contentType: file.type,
          });

        if (uploadError) {
          console.error('Upload Error:', uploadError); // Log upload error
          throw uploadError;
        }

        // Get public URL for the uploaded image
        const { data: urlData, error: urlError } = supabase
          .storage
          .from('players')
          .getPublicUrl(filePath);

        if (urlError) {
          console.error('Public URL Error:', urlError); // Log URL error
          throw urlError;
        }

        if (urlData?.publicUrl) {
          const { error: imageUpdateError } = await supabase
            .from('players')
            .update({
              profile_image_url: urlData.publicUrl,
            })
            .eq('id', playerId);

          if (imageUpdateError) {
            console.error('Image Update Error:', imageUpdateError); // Log error
            throw imageUpdateError;
          }
        }
      }

      // Sync with Riot API if summoner name is provided
      if (values.summoner_name && player?.summoner_name !== values.summoner_name) {
        toast({
          title: 'Syncing with Riot API',
          description: `Now syncing data for ${values.summoner_name}...`,
        });

        await syncWithRiotApi(values.summoner_name);
      }

      toast({
        title: 'Success',
        description: 'Player details updated successfully.',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating player:', error); // Log detailed error
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update player.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncWithRiotApi = async (summoner_name: string) => {
    try {
      // Invoke Supabase edge function for Riot API sync
      const { data, error } = await supabase.functions.invoke('riot-api', {
        body: { 
          action: 'syncSummoner',
          summonerName: summoner_name
        }
      });
      
      if (error || !data.success) {
        throw new Error(data?.message || 'Failed to sync with Riot API');
      }
      
      toast({
        title: 'Sync Complete',
        description: 'Successfully synced data from Riot API',
      });
      
      // Also sync match history
      await supabase.functions.invoke('riot-api', {
        body: { 
          action: 'syncMatches',
          summonerName: summoner_name
        }
      });
      
    } catch (error) {
      console.error('Error syncing with Riot API:', error);
      toast({
        title: 'Sync Error',
        description: error instanceof Error ? error.message : 'Failed to sync with Riot API',
        variant: 'destructive',
      });
    }
  };

  const handleSyncStats = async () => {
    if (!player) return;
    try {
      console.log(`Syncing stats for player_id: ${player.id}, summoner_name: ${player.summoner_name}`);
      await syncPlayerStats(player.id, player.summoner_name); // Use player.id for database queries
      toast({
        title: 'Sync Complete',
        description: 'Player stats synced successfully.',
      });
    } catch (error) {
      console.error('Error syncing player stats:', error); // Log detailed error
      toast({
        title: 'Sync Error',
        description: error instanceof Error ? error.message : 'Failed to sync player stats.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading && !player) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Edit Player: {player?.name}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="w-full md:w-24 flex flex-col items-center gap-2">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={imagePreviewUrl || undefined} alt={player?.name || 'Player'} />
                  <AvatarFallback>
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                <div className="relative">
                  <Button 
                    variant="outline" 
                    size="sm"
                    type="button"
                    className="relative"
                    onClick={() => document.getElementById('profileImage')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                  <Input
                    id="profileImage"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Player name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="summoner_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Summoner Name</FormLabel>
                      <FormControl>
                        <Input placeholder="LoL summoner name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
            <Button onClick={handleSyncStats} disabled={isLoading}>
              Sync Stats
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default PlayerEditForm;
