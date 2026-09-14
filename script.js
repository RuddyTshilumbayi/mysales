const clientForm = document.getElementById("clientForm");

const clientsList = document.getElementById("clientsList");

clientForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const nom = document.getElementById("nom").value;

  const telephone = document.getElementById("telephone").value;

  const email = document.getElementById("email").value;

  const ville = document.getElementById("ville").value;

  const nouvelleLigne = document.createElement("tr");

  nouvelleLigne.innerHTML = `

        <td>${nom}</td>

        <td>${telephone}</td>

        <td>${email}</td>

        <td>${ville}</td>

    `;

  clientsList.appendChild(nouvelleLigne);

  clientForm.reset();
});
