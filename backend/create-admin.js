const bcrypt = require("bcryptjs");
const pool = require("./db");

async function creerAdministrateur() {
    try {
        const nom = "Administrateur";
        const email = "admin@mysales.com";
        const motDePasse = "CHANGE_MOI_123";

        const motDePasseHash = await bcrypt.hash(motDePasse, 12);

        const resultat = await pool.query(
            "INSERT INTO utilisateurs (nom, email, mot_de_passe, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING RETURNING id",
            [nom, email, motDePasseHash, "admin"]
        );

        if (resultat.rows.length === 0) {
            console.log("Le compte administrateur existe déjà.");
        } else {
            console.log("Compte administrateur créé avec succès.");
        }

        console.log("Email :", email);
    } catch (error) {
        console.error("Erreur création administrateur :", error);
    } finally {
        await pool.end();
    }
}

creerAdministrateur();
