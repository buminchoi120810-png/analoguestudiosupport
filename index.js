const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ButtonBuilder, 
    ActionRowBuilder, 
    ButtonStyle, 
    ChannelType, 
    PermissionsBitField 
} = require('discord.js');
require('dotenv').config();
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const ROLE_ID = "1477654431750422600";
const COUNTER_FILE = "./ticketCount.json";

// 티켓번호 불러오기
let ticketCount = 1;
if (fs.existsSync(COUNTER_FILE)) {
    ticketCount = JSON.parse(fs.readFileSync(COUNTER_FILE)).count;
}

function saveTicketCount() {
    fs.writeFileSync(COUNTER_FILE, JSON.stringify({ count: ticketCount }));
}

client.once('ready', () => {
    console.log(`${client.user.tag} 온라인`);
});

client.on('messageCreate', async (message) => {
    if (message.content === "!문의봇") {

        const embed = new EmbedBuilder()
            .setColor("#AEEFFF")
            .setTitle("Analogue Studio 에 문의하기")
            .setDescription("아래 문의하기 버튼을 누르면 문의채널이 생성됩니다");

        const button = new ButtonBuilder()
            .setCustomId("create_ticket")
            .setLabel("📩 문의하기")
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        message.channel.send({ embeds: [embed], components: [row] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "create_ticket") {

        const channelName = `support-${String(ticketCount).padStart(4, '0')}`;
        ticketCount++;
        saveTicketCount();

        const channel = await interaction.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                },
                {
                    id: ROLE_ID,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                }
            ]
        });

        const embed = new EmbedBuilder()
            .setColor("#AEEFFF")
            .setDescription(`<@&${ROLE_ID}> 관리진이 호출되었습니다. 잠시 기다려주세요.`);

        const closeButton = new ButtonBuilder()
            .setCustomId("close_ticket")
            .setLabel("문의채널 나가기")
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(closeButton);

        await channel.send({
            content: `<@&${ROLE_ID}>`,
            embeds: [embed],
            components: [row]
        });

        interaction.reply({ content: `문의 채널이 생성되었습니다: ${channel}`, ephemeral: true });
    }

    if (interaction.customId === "close_ticket") {
        await interaction.reply({ content: "채널이 삭제됩니다.", ephemeral: true });
        setTimeout(() => interaction.channel.delete().catch(() => {}), 2000);
    }
});

client.login(process.env.TOKEN);
