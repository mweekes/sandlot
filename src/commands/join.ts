import {bold, SlashCommandBuilder} from "@discordjs/builders";
import {CategoryChannel, CommandInteraction, Message, Role, TextChannel, VoiceChannel} from "discord.js";
import {
    activePugs,
    CommandDescOption,
    CommandNameOption,
    increasePugCount,
    initiated,
    matchSize,
    MultiplesAction,
    pugCount,
    pugQueueBotMessage,
    queuedUsers,
    PugPlayer,
    readyCheckTime,
    updateActivePugs,
    updateQueuedUsers,
    wipeQueuedUsers
} from "../state/state";
import {MapPoolEmbed} from "../embeds/MapPoolEmbed";
import {QueueEmbed} from "../embeds/QueueEmbed";
import {PickupGame} from "../classes/PickupGame";
import {ReadyCheckEmbed} from "../embeds/ReadyCheckEmbed";
import {ReadyCheckButtonRow} from "../rows/ReadyCheckButtonRow";
import {sendReadyCheckDirectMessages} from "../direct_messages/sendReadyCheckDirectMessages";
import {moveUsersToVoiceChannel} from "../helpers/moveUsersToVoiceChannel";
import {getPugPermissions} from "../helpers/getPugPermissions";
import {VolunteerButtonRow} from "../rows/VolunteerButtonRow";

const createNewActivePug = async (interaction: CommandInteraction) => {
    const guild = interaction.guild;
    const players = [...queuedUsers];
    let category: CategoryChannel;
    let textChannel: TextChannel;
    let voiceChannel: VoiceChannel;
    let message: Message;

    if (!guild) throw Error("You must run this command inside of a Discord Guild.");
    increasePugCount();
    await guild.channels.create(`PUG #${pugCount}`, {type: "GUILD_CATEGORY"})
        .then(async cat => {
            category = cat;
            const everyoneRole: Role | undefined = guild.roles.cache.find(r => r.name === '@everyone');
            if (!everyoneRole) throw Error("This Guild does not contain an @everyone role.");
            await guild.channels.create("ready-check", {
                parent: category,
                type: "GUILD_TEXT",
                permissionOverwrites: getPugPermissions(guild)
            }).then(async tc => {
                textChannel = tc;
                await textChannel.send({
                    content: bold("/----- 𝙍𝙚𝙖𝙙𝙮 𝘾𝙝𝙚𝙘𝙠 -----/"),
                    embeds: [ReadyCheckEmbed(players.map(
                            p => <PugPlayer>{user: p, isReady: false}),
                        readyCheckTime
                    )],
                    components: [ReadyCheckButtonRow(), VolunteerButtonRow()]
                }).then(m => message = m);
            });
            await guild.channels.create(`PUG #${pugCount} VC`, {
                parent: category,
                type: "GUILD_VOICE"
            }).then(vc => voiceChannel = vc);
            updateActivePugs(new PickupGame(
                pugCount,
                players.map(p => <PugPlayer>{user: p, isReady: false, isVolunteer: false, hasVoted: false}),
                category,
                textChannel,
                voiceChannel,
                message
            ), MultiplesAction.ADD);
            await sendReadyCheckDirectMessages(players, textChannel);
            await moveUsersToVoiceChannel(players, voiceChannel);
            wipeQueuedUsers();
        });
};

const handleJoinCommand = async (interaction: CommandInteraction) => {
    if (!initiated) {
        await interaction.reply({
            content: "There is no initiated Pickup Game Bot to be added to. " +
                "Run the /initiate command if you would like to initiate the Pickup Game Bot.",
            ephemeral: true,
            fetchReply: false
        });
    } else if (!!activePugs.find(ap => ap.players.find(p => p.user === interaction.user))) {
        await interaction.reply({
            content: "You are already in an active Pickup Game. You cannot Queue again until your Pickup Game is over.",
            ephemeral: true,
            fetchReply: false
        });
    } else {
        const replyMessage: string = updateQueuedUsers(interaction.user, MultiplesAction.ADD);
        if (queuedUsers.length === matchSize) {
            await createNewActivePug(interaction);
        }
        await pugQueueBotMessage.edit({
            embeds: [MapPoolEmbed(), QueueEmbed()]
        });
        await interaction.reply({
            content: replyMessage,
            ephemeral: true,
            fetchReply: false
        });
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName(CommandNameOption.join.valueOf())
        .setDescription(CommandDescOption.join.valueOf()),
    async execute(interaction: CommandInteraction) {
        await handleJoinCommand(interaction).catch(e => console.log(e));
    },
};
