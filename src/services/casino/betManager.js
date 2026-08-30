module.exports = {

    maxBet: 100000,

    minBet: 10,


    getBet(input, money) {

        let bet;


        if (!input) {
            return {
                error: "❌ Entre une mise."
            };
        }


        if (input.toLowerCase() === "all") {

            bet = Math.min(
                money,
                this.maxBet
            );


        } else {

            bet = Number(input);

        }



        if (!bet || isNaN(bet)) {

            return {
                error: "❌ Mise invalide."
            };

        }



        if (bet < this.minBet) {

            return {
                error: `❌ Mise minimum : ${this.minBet} NebuCoins.`
            };

        }



        if (bet > this.maxBet) {

            return {
                error: `❌ Mise maximum : ${this.maxBet} NebuCoins.`
            };

        }


        return {
            bet
        };

    }

};