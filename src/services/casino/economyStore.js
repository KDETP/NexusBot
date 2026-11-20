const fs = require("fs");
const path = require("path");

const economyPath = path.join(__dirname, "..", "..", "data", "economy.json");
const STARTING_BALANCE = 500;

function load() {
    if (!fs.existsSync(economyPath)) {
        fs.mkdirSync(path.dirname(economyPath), { recursive: true });
        fs.writeFileSync(economyPath, "{}", "utf8");
    }

    const economy = JSON.parse(fs.readFileSync(economyPath, "utf8"));

    if (!economy || typeof economy !== "object" || Array.isArray(economy)) {
        throw new Error("Le fichier economy.json ne contient pas un compte valide.");
    }

    return economy;
}

function save(economy) {
    fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2), "utf8");
}

function ensureUser(economy, userId) {
    if (!Object.prototype.hasOwnProperty.call(economy, userId)) {
        economy[userId] = { money: STARTING_BALANCE };
        return { user: economy[userId], created: true };
    }

    const user = economy[userId];
    if (!user || typeof user !== "object" || !Number.isSafeInteger(user.money) || user.money < 0) {
        throw new Error(`Solde invalide pour le compte ${userId}.`);
    }

    return { user, created: false };
}

function getBalance(userId) {
    const economy = load();
    const { user, created } = ensureUser(economy, userId);

    if (created) save(economy);
    return user.money;
}

function debit(userId, amount) {
    if (!Number.isSafeInteger(amount) || amount <= 0) {
        throw new Error("Le montant à débiter doit être un entier positif.");
    }

    const economy = load();
    const { user, created } = ensureUser(economy, userId);

    if (user.money < amount) {
        if (created) save(economy);
        return { success: false, balance: user.money };
    }

    user.money -= amount;
    save(economy);
    return { success: true, balance: user.money };
}

function credit(userId, amount) {
    if (!Number.isSafeInteger(amount) || amount < 0) {
        throw new Error("Le montant à créditer doit être un entier positif ou nul.");
    }

    const economy = load();
    const { user } = ensureUser(economy, userId);
    const nextBalance = user.money + amount;

    if (!Number.isSafeInteger(nextBalance)) {
        throw new Error("Le nouveau solde dépasse la limite prise en charge.");
    }

    user.money = nextBalance;
    save(economy);
    return user.money;
}

module.exports = {
    load,
    save,
    ensureUser,
    getBalance,
    debit,
    credit,
    STARTING_BALANCE
};
