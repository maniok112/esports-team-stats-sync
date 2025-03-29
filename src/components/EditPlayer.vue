<script setup>
import { ref } from 'vue';
import { updatePlayer } from '../api/players';

const playerId = ref(''); // ID gracza do edycji
const playerData = ref({
    name: '',
    age: '',
    team: '',
    // ...inne pola...
});
const errorMessage = ref('');

async function savePlayer() {
    try {
        await updatePlayer(playerId.value, playerData.value);
        alert('Player updated successfully!');
    } catch (error) {
        errorMessage.value = error.message;
    }
}
</script>

<template>
    <div>
        <h1>Edit Player</h1>
        <form @submit.prevent="savePlayer">
            <label>
                Name:
                <input v-model="playerData.name" type="text" />
            </label>
            <label>
                Age:
                <input v-model="playerData.age" type="number" />
            </label>
            <label>
                Team:
                <input v-model="playerData.team" type="text" />
            </label>
            <!-- ...inne pola... -->
            <button type="submit">Save</button>
        </form>
        <p v-if="errorMessage" style="color: red;">{{ errorMessage }}</p>
    </div>
</template>
