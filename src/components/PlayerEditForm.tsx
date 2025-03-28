
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
  summonerName: string;
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
      summonerName: '',
      profileImage: null
    }
  });

  // Fetch player data
  useEffect(() => {
    const fetchPlayer = async () => {
      setIsLoading(true);
      try {
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
            summonerName: data.summonerName || '',
          });

          // If player has a profile image URL
          if (data.profile_image_url) {
            setImagePreviewUrl(data.profile_image_url);
          }
        }
      } catch (error) {
        console.error('Error fetching player:', error);
        toast({
          title: 'Error',
          description: 'Failed to load player data.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (playerId) {
      fetchPlayer();
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
      // Create an update object
      const updateData = {
        name: values.name,
        role: values.role,
        summonerName: values.summonerName
      };

      // Update player data
      const { error } = await supabase
        .from('players')
        .update(updateData)
        .eq('id', playerId);

      if (error) throw error;

      // Handle profile image upload if provided
      if (values.profileImage) {
        const file = values.profileImage;
        const fileExt = file.name.split('.').pop();
        const fileName = `${playerId}-profile.${fileExt}`;
        const filePath = `players/${fileName}`;

        // Check if storage bucket exists, create one if not
        const { data: bucketData } = await supabase
          .storage
          .getBucket('players');

        if (!bucketData) {
          // Create bucket
          await supabase
            .storage
            .createBucket('players', {
              public: true,
              fileSizeLimit: 1024 * 1024 * 2 // 2MB limit
            });
        }

        // Upload file
        const { error: uploadError } = await supabase
          .storage
          .from('players')
          .upload(filePath, file, {
            upsert: true,
            contentType: file.type
          });

        if (uploadError) throw uploadError;

        // Get public URL for the uploaded image
        const { data: urlData } = supabase
          .storage
          .from('players')
          .getPublicUrl(filePath);

        // Update player with image URL
        if (urlData?.publicUrl) {
          await supabase
            .from('players')
            .update({
              profile_image_url: urlData.publicUrl
            })
            .eq('id', playerId);
        }
      }

      // Sync with Riot API if summoner name is provided
      if (values.summonerName && player?.summonerName !== values.summonerName) {
        toast({
          title: 'Syncing with Riot API',
          description: `Now syncing data for ${values.summonerName}...`,
        });
        
        // We'll handle this in a separate function
        await syncWithRiotApi(values.summonerName);
      }

      toast({
        title: 'Success',
        description: 'Player details updated successfully.',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating player:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update player.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncWithRiotApi = async (summonerName: string) => {
    try {
      // Invoke Supabase edge function for Riot API sync
      const { data, error } = await supabase.functions.invoke('riot-api', {
        body: { 
          action: 'syncSummoner',
          summonerName
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
          summonerName
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
                  name="summonerName"
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
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default PlayerEditForm;
