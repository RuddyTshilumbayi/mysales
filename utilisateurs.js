const UTILISATEURS_API = "/api/utilisateurs";

const utilisateurForm = document.getElementById("utilisateurForm");

const nomUtilisateurForm = document.getElementById(
    "nomUtilisateurForm"
);

const emailUtilisateur = document.getElementById(
    "emailUtilisateur"
);

const motDePasseUtilisateur = document.getElementById(
    "motDePasseUtilisateur"
);

const roleUtilisateurForm = document.getElementById(
    "roleUtilisateurForm"
);

const utilisateursList = document.getElementById(
    "utilisateursList"
);

const boutonUtilisateur = document.getElementById(
    "boutonUtilisateur"
);

const boutonAnnulerUtilisateur = document.getElementById(
    "boutonAnnulerUtilisateur"
);

const titreFormulaireUtilisateur = document.getElementById(
    "titreFormulaireUtilisateur"
);

let utilisateurs = [];

let utilisateurEnModification = null;


// ======================================================
// CHARGER LES UTILISATEURS
// ======================================================

async function chargerUtilisateurs() {

    try {

        const response = await fetch(
            UTILISATEURS_API,
            {
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Impossible de récupérer les utilisateurs."
            );
        }

        utilisateurs = data;

        afficherUtilisateurs(utilisateurs);

    } catch (error) {

        console.error(
            "Erreur utilisateurs :",
            error
        );

        utilisateursList.innerHTML = `
            <tr>
                <td colspan="6">
                    ${error.message}
                </td>
            </tr>
        `;
    }
}


// ======================================================
// AFFICHER LES UTILISATEURS
// ======================================================

function afficherUtilisateurs(listeUtilisateurs) {

    utilisateursList.innerHTML = "";

    if (listeUtilisateurs.length === 0) {

        utilisateursList.innerHTML = `
            <tr>
                <td colspan="6">
                    Aucun utilisateur trouvé.
                </td>
            </tr>
        `;

        return;
    }

    listeUtilisateurs.forEach(function (utilisateur) {

        const ligne = document.createElement("tr");

        const date = new Date(
            utilisateur.date_creation
        ).toLocaleDateString("fr-FR");

        const role =
            utilisateur.role === "admin"
                ? "Administrateur"
                : "Vendeur";

        ligne.innerHTML = `
            <td>${utilisateur.id}</td>

            <td>${utilisateur.nom}</td>

            <td>${utilisateur.email}</td>

            <td>${role}</td>

            <td>${date}</td>

            <td>

                <button
                    type="button"
                    onclick="modifierUtilisateur(${utilisateur.id})">

                    Modifier

                </button>

                <button
                    type="button"
                    onclick="supprimerUtilisateur(${utilisateur.id})">

                    Supprimer

                </button>

            </td>
        `;

        utilisateursList.appendChild(ligne);
    });
}


// ======================================================
// AJOUT / MODIFICATION
// ======================================================

utilisateurForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const nom = nomUtilisateurForm.value.trim();

        const email =
            emailUtilisateur.value.trim();

        const mot_de_passe =
            motDePasseUtilisateur.value;

        const role =
            roleUtilisateurForm.value;


        if (!nom || !email || !role) {

            alert(
                "Veuillez remplir tous les champs obligatoires."
            );

            return;
        }


        if (
            !utilisateurEnModification &&
            mot_de_passe.length < 6
        ) {

            alert(
                "Le mot de passe doit contenir au moins 6 caractères."
            );

            return;
        }


        if (
            utilisateurEnModification &&
            mot_de_passe !== "" &&
            mot_de_passe.length < 6
        ) {

            alert(
                "Le mot de passe doit contenir au moins 6 caractères."
            );

            return;
        }


        const donnees = {
            nom: nom,
            email: email,
            mot_de_passe: mot_de_passe,
            role: role
        };


        try {

            let response;


            if (utilisateurEnModification) {

                response = await fetch(
                    `${UTILISATEURS_API}/${utilisateurEnModification}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        credentials: "include",

                        body: JSON.stringify(donnees)
                    }
                );

            } else {

                response = await fetch(
                    UTILISATEURS_API,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        credentials: "include",

                        body: JSON.stringify(donnees)
                    }
                );
            }


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Une erreur est survenue."
                );
            }


            if (utilisateurEnModification) {

                alert(
                    "Utilisateur modifié avec succès !"
                );

            } else {

                alert(
                    "Utilisateur créé avec succès !"
                );
            }


            annulerModification();

            await chargerUtilisateurs();


        } catch (error) {

            console.error(
                "Erreur utilisateur :",
                error
            );

            alert(error.message);
        }
    }
);


// ======================================================
// MODIFIER
// ======================================================

function modifierUtilisateur(id) {

    const utilisateur =
        utilisateurs.find(
            function (item) {
                return item.id === id;
            }
        );


    if (!utilisateur) {

        alert(
            "Utilisateur introuvable."
        );

        return;
    }


    nomUtilisateurForm.value =
        utilisateur.nom;

    emailUtilisateur.value =
        utilisateur.email;

    motDePasseUtilisateur.value =
        "";

    roleUtilisateurForm.value =
        utilisateur.role;


    utilisateurEnModification =
        id;


    titreFormulaireUtilisateur.textContent =
        "Modifier un utilisateur";

    boutonUtilisateur.textContent =
        "Modifier l'utilisateur";

    boutonAnnulerUtilisateur.style.display =
        "inline-block";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ======================================================
// ANNULER
// ======================================================

function annulerModification() {

    utilisateurForm.reset();

    utilisateurEnModification =
        null;

    titreFormulaireUtilisateur.textContent =
        "Ajouter un utilisateur";

    boutonUtilisateur.textContent =
        "Enregistrer l'utilisateur";

    boutonAnnulerUtilisateur.style.display =
        "none";
}


boutonAnnulerUtilisateur.addEventListener(
    "click",
    function () {

        annulerModification();

    }
);


// ======================================================
// SUPPRIMER
// ======================================================

async function supprimerUtilisateur(id) {

    const utilisateur =
        utilisateurs.find(
            function (item) {
                return item.id === id;
            }
        );


    if (!utilisateur) {

        alert(
            "Utilisateur introuvable."
        );

        return;
    }


    const confirmation = confirm(
        `Voulez-vous vraiment supprimer l'utilisateur "${utilisateur.nom}" ?`
    );


    if (!confirmation) {
        return;
    }


    try {

        const response =
            await fetch(
                `${UTILISATEURS_API}/${id}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Impossible de supprimer l'utilisateur."
            );
        }


        alert(
            "Utilisateur supprimé avec succès !"
        );


        await chargerUtilisateurs();


    } catch (error) {

        console.error(
            "Erreur suppression :",
            error
        );

        alert(error.message);
    }
}


// ======================================================
// DÉMARRAGE
// ======================================================

chargerUtilisateurs();
