import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {
    CommandDescOption,
    CommandNameOption,
    initiated,
    MultiplesAction,
    pugQueueBotMessage,
    updateQueuedUsers
} from "../state";
import {MapPoolEmbed} from "../embeds/MapPoolEmbed";
import {QueueEmbed} from "../embeds/QueueEmbed";

const handleJoinCommand = async (interaction: CommandInteraction) => {
    if (!initiated) {
        await interaction.reply({
            content: "There is no initiated PUG Bot to be added to. " +
                "Run the /initiate command if you would like to initiate the PUG Bot.",
            ephemeral: true,
            fetchReply: false
        });
    } else {
        const replyMessage: string = updateQueuedUsers(interaction.user, MultiplesAction.ADD);
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
        await handleJoinCommand(interaction);
    },
};