const db = require("./database");

db.serialize(() => {

    console.log("📦 Vérification des tables...");


    // ==========================================
    // UTILISATEURS
    // ==========================================

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            createdAt INTEGER
        )
    `);


    // ==========================================
    // ECONOMIE
    // ==========================================

    db.run(`
        CREATE TABLE IF NOT EXISTS economy (
            id TEXT PRIMARY KEY,
            money INTEGER DEFAULT 500,
            bank INTEGER DEFAULT 0
        )
    `);


    // ==========================================
    // NIVEAUX
    // ==========================================

    db.run(`
        CREATE TABLE IF NOT EXISTS levels (
            id TEXT PRIMARY KEY,
            xp INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1
        )
    `);


    // ==========================================
    // QUIZ
    // ==========================================

    db.run(`
        CREATE TABLE IF NOT EXISTS quiz (
            id TEXT PRIMARY KEY,
            wins INTEGER DEFAULT 0
        )
    `);


    // ==========================================
    // TRAVAIL
    // ==========================================

    db.run(`
        CREATE TABLE IF NOT EXISTS work (
            id TEXT PRIMARY KEY,
            works INTEGER DEFAULT 0
        )
    `);


    // ==========================================
    // CASINO
    // ==========================================

    db.run(`
        CREATE TABLE IF NOT EXISTS casino (
            id TEXT PRIMARY KEY,
            games INTEGER DEFAULT 0,
            wins INTEGER DEFAULT 0
        )
    `);


    // ==========================================
    // INVITATIONS
    // ==========================================
    //
    // Une ligne par utilisateur et par serveur.
    //
    // guildId   = serveur
    // userId    = personne qui invite
    // invites   = nombre d'invitations
    //
    // ==========================================

    db.run(`
        CREATE TABLE IF NOT EXISTS invites (
            guildId TEXT NOT NULL,
            userId TEXT NOT NULL,
            invites INTEGER DEFAULT 0,
            PRIMARY KEY (guildId, userId)
        )
    `);


    // ==========================================
    // INVITATIONS UTILISEES
    // ==========================================
    //
    // Permet de garder une trace de qui a invité
    // chaque membre.
    //
    // guildId     = serveur
    // memberId    = nouveau membre
    // inviterId   = personne qui l'a invité
    // inviteCode  = invitation utilisée
    //
    // ==========================================

    db.run(`
        CREATE TABLE IF NOT EXISTS invite_joins (
            guildId TEXT NOT NULL,
            memberId TEXT NOT NULL,
            inviterId TEXT,
            inviteCode TEXT,
            joinedAt INTEGER,
            PRIMARY KEY (guildId, memberId)
        )
    `);


    console.log("✅ Toutes les tables sont prêtes.");

});


module.exports = db;