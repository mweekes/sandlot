import {PartialUser, User, VoiceChannel} from "discord.js";
import {guild} from "../state/state";

export const MoveUsersToVoiceChannel = async (
    users: (User | PartialUser)[],
    voiceChannel: VoiceChannel
): Promise<any> => {
    if (!guild) throw Error("Your Pickup Game is attempting to kick off in a non-existent Guild.");
    await Promise.all(guild.members.cache.map(async member => {
        console.log(`${member.user.username}'s voice results are:  ${!member.voice}`)
        if (!member.voice) return Promise.resolve();
        console.log(`${member.user.username} should not have made it this far if false.`)
        if (!users.find(u => u.id === member.user.id)) return Promise.resolve();
        console.log(`Should have moved ${member.user.username}`)
        await member.voice.setChannel(voiceChannel);
    })).then(() => {return Promise.resolve();});
    console.log(`Should be here after moving all: ${users.map(u => u.username).toString()}`)
};
