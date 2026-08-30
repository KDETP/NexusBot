const fs = require("fs");
const path = require("path");

class Brain {

    constructor() {

        this.lastActivity = Date.now();

    }

    addMessage() {

        this.lastActivity = Date.now();

    }

    async executeActivity(client) {

        const activities = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, "..", "data", "activities.json"),
                "utf8"
            )
        );

        const activity =
            activities[Math.floor(Math.random() * activities.length)];

        const channel = client.channels.cache.get("1532756693878837381");

        if (!channel) return;

        switch (activity.type) {

            case "message":

                await channel.send(activity.content);

                break;

            case "quiz":

                await channel.send(
                    "🎮 **QUIZ AUTOMATIQUE**\n\nTape **`nebu quiz`** pour participer !"
                );

                break;

            case "money":

                await channel.send(
                    `💰 **Pluie d'argent !**\n\nLe premier qui écrit **JE PRENDS** gagne **${activity.amount} pièces** !`
                );

                break;

        }

    }

    start(client) {

        setInterval(async () => {

            const inactive = Date.now() - this.lastActivity;

            // 30 secondes pour les tests
            if (inactive < 45 * 60 * 1000) return;

            await this.executeActivity(client);

            this.lastActivity = Date.now();

        }, 10000);

    }

}

module.exports = new Brain();