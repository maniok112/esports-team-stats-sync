import { supabase } from './supabaseClient';

export async function updatePlayer(playerId: string, updatedData: Record<string, any>) {
    const { data, error } = await supabase
        .from('players') // Nazwa tabeli w bazie danych
        .update(updatedData)
        .eq('id', playerId); // Zakładamy, że 'id' to klucz główny

    if (error) {
        console.error('Failed to update player:', error.message);
        throw new Error('Failed to update player');
    }

    return data;
}
