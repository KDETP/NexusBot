class ActivityEngine {

    constructor() {

        this.messages = 0;

    }

    start(client) {

        console.log("🧠 Activity Engine lancé.");

        setInterval(() => {

            console.log(`📊 Messages cette minute : ${this.messages}`);

            this.messages = 0;

        }, 60000);

    }

    addMessage() {

        this.messages++;

    }

}

module.exports = new ActivityEngine();