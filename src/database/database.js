const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./src/data/nexus.db", (err) => {

    if (err) {
        console.error(err);
    } else {
        console.log("📦 Base de données connectée.");
    }

});

module.exports = db;