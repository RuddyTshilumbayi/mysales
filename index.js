const CLIENTS_API = "/api/clients";
const PRODUITS_API = "/api/produits";
const VENTES_API = "/api/ventes";

const nombreClients = document.getElementById("nombreClients");
const nombreProduits = document.getElementById("nombreProduits");
const chiffreAffaires = document.getElementById("chiffreAffaires");
const nombreVentes = document.getElementById("nombreVentes");


async function chargerStatistiquesAccueil() {

    try {

        const [clientsResponse, produitsResponse, ventesResponse] =
            await Promise.all([

                fetch(CLIENTS_API, {
                    credentials: "include"
                }),

                fetch(PRODUITS_API, {
                    credentials: "include"
                }),

                fetch(VENTES_API, {
                    credentials: "include"
                })

            ]);


        if (
            !clientsResponse.ok ||
            !produitsResponse.ok ||
            !ventesResponse.ok
        ) {

            throw new Error(
                "Impossible de récupérer les statistiques."
            );

        }


        const clients = await clientsResponse.json();

        const produits = await produitsResponse.json();

        const ventes = await ventesResponse.json();


        // Nombre de clients

        nombreClients.textContent =
            clients.length;


        // Nombre de produits

        nombreProduits.textContent =
            produits.length;


        // Nombre de ventes

        nombreVentes.textContent =
            ventes.length;


        // Calcul du chiffre d'affaires

        const totalChiffreAffaires = ventes.reduce(
            (total, vente) => {

                return total + Number(vente.total || 0);

            },
            0
        );


        chiffreAffaires.textContent =
            `${totalChiffreAffaires.toFixed(2)} $`;


    } catch (error) {

        console.error(
            "Erreur statistiques accueil :",
            error
        );


        nombreClients.textContent = "0";

        nombreProduits.textContent = "0";

        nombreVentes.textContent = "0";

        chiffreAffaires.textContent = "0.00 $";

    }

}


// Bouton Commencer

function commencer() {

    window.location.href = "ventes.html";

}


// Charger les statistiques

chargerStatistiquesAccueil();
