// Navigation
const patientsSection = document.getElementById("patientsSection");
const rdvSection = document.getElementById("rdvSection");
const statsSection = document.getElementById("statsSection");
const patientsBtn = document.getElementById("patientsBtn");
const rdvBtn = document.getElementById("rdvBtn");
const statsBtn = document.getElementById("statsBtn");

// Gestion de la navigation
function showPage(page) {
  // Masquer toutes les sections
  patientsSection.classList.remove("active");
  rdvSection.classList.remove("active");
  statsSection.classList.remove("active");

  // Désactiver tous les boutons
  patientsBtn.classList.remove("active");
  rdvBtn.classList.remove("active");
  statsBtn.classList.remove("active");

  // Afficher la section demandée
  if (page === "patients") {
    patientsSection.classList.add("active");
    patientsBtn.classList.add("active");
  } else if (page === "rdv") {
    rdvSection.classList.add("active");
    rdvBtn.classList.add("active");
    updatePatientSelect();
  } else if (page === "stats") {
    statsSection.classList.add("active");
    statsBtn.classList.add("active");
    updateStats();
    updateCharts();
  }
}

patientsBtn.onclick = () => showPage("patients");
rdvBtn.onclick = () => showPage("rdv");
statsBtn.onclick = () => showPage("stats");

// Gestion des patients
const patientForm = document.getElementById("patientForm");
const patientsList = document.getElementById("patientsList");
const searchPatient = document.getElementById("searchPatient");
const exportPatients = document.getElementById("exportPatients");
const exportPatientsCSV = document.getElementById("exportPatientsCSV");
const togglePatientForm = document.getElementById("togglePatientForm");
const cancelPatient = document.getElementById("cancelPatient");

let patients = JSON.parse(localStorage.getItem("medicare_patients")) || [];
let editingPatientId = null;

function savePatients() {
  localStorage.setItem("medicare_patients", JSON.stringify(patients));
}

// Toggle du formulaire patient
togglePatientForm.onclick = () => {
  patientForm.classList.toggle("hidden");
  const isHidden = patientForm.classList.contains("hidden");
  togglePatientForm.innerHTML = isHidden
    ? '<i class="fas fa-plus"></i> Ajouter un patient'
    : '<i class="fas fa-minus"></i> Masquer le formulaire';

  if (!isHidden) {
    editingPatientId = null;
    patientForm.reset();
  }
};

cancelPatient.onclick = () => {
  patientForm.classList.add("hidden");
  togglePatientForm.innerHTML =
    '<i class="fas fa-plus"></i> Ajouter un patient';
  editingPatientId = null;
};

// Soumission du formulaire patient
patientForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const age = parseInt(document.getElementById("age").value);
  const disease = document.getElementById("disease").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();
  const note = document.getElementById("patientNote").value.trim();

  if (age <= 0 || age > 120) {
    showNotification("L'âge doit être compris entre 1 et 120 ans.", "error");
    return;
  }

  if (editingPatientId) {
    // Modification d'un patient existant
    const patientIndex = patients.findIndex((p) => p.id === editingPatientId);
    if (patientIndex !== -1) {
      patients[patientIndex] = {
        ...patients[patientIndex],
        name,
        age,
        disease,
        phone,
        email,
        note,
        updatedAt: new Date().toISOString(),
      };
      showNotification("Patient modifié avec succès !", "success");
    }
  } else {
    // Ajout d'un nouveau patient
    const patient = {
      id: Date.now(),
      name,
      age,
      disease,
      phone,
      email,
      note,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    patients.push(patient);
    showNotification("Patient ajouté avec succès !", "success");
  }

  savePatients();
  afficherPatients();
  updatePatientSelect();
  patientForm.reset();
  patientForm.classList.add("hidden");
  togglePatientForm.innerHTML =
    '<i class="fas fa-plus"></i> Ajouter un patient';
  editingPatientId = null;
});

function afficherPatients(filter = "") {
  patientsList.innerHTML = "";
  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(filter.toLowerCase()) ||
      p.disease.toLowerCase().includes(filter.toLowerCase()) ||
      p.phone.includes(filter) ||
      p.email.toLowerCase().includes(filter.toLowerCase())
  );

  if (filteredPatients.length === 0) {
    patientsList.innerHTML = `
            <li class="empty-state">
                <i class="fas fa-users"></i>
                <p>Aucun patient trouvé. ${
                  filter
                    ? "Essayez une autre recherche."
                    : "Ajoutez-en un nouveau !"
                }</p>
            </li>
        `;
    return;
  }

  filteredPatients.forEach((p) => {
    const li = document.createElement("li");
    li.innerHTML = `
            <div class="patient-info">
                <strong>${p.name}</strong> - ${p.age} ans - ${
      p.disease || "Aucun diagnostic"
    }
                <small>
                    Tél: ${p.phone || "N/A"} | Email: ${p.email || "N/A"}<br>
                    ${p.note ? `Note: ${p.note}` : "Aucune note"}
                </small>
            </div>
            <div class="actions">
                <button class="btn-edit" onclick="editerPatient(${
                  p.id
                })"><i class="fas fa-edit"></i></button>
                <button class="btn-delete" onclick="confirmSupprimerPatient(${
                  p.id
                })"><i class="fas fa-trash"></i></button>
            </div>
        `;
    patientsList.appendChild(li);
  });
}

function editerPatient(id) {
  const patient = patients.find((p) => p.id === id);
  if (!patient) return;

  document.getElementById("name").value = patient.name;
  document.getElementById("age").value = patient.age;
  document.getElementById("disease").value = patient.disease || "";
  document.getElementById("phone").value = patient.phone || "";
  document.getElementById("email").value = patient.email || "";
  document.getElementById("patientNote").value = patient.note || "";

  patientForm.classList.remove("hidden");
  togglePatientForm.innerHTML =
    '<i class="fas fa-minus"></i> Masquer le formulaire';
  editingPatientId = id;
}

function confirmSupprimerPatient(id) {
  const patient = patients.find((p) => p.id === id);
  if (!patient) return;

  document.getElementById(
    "confirmMessage"
  ).textContent = `Êtes-vous sûr de vouloir supprimer le patient "${patient.name}" ?`;

  document.getElementById("confirmDelete").onclick = () => {
    supprimerPatient(id);
    document.getElementById("confirmModal").classList.add("hidden");
  };

  document.getElementById("confirmModal").classList.remove("hidden");
}

function supprimerPatient(id) {
  patients = patients.filter((p) => p.id !== id);
  savePatients();
  afficherPatients(searchPatient.value);
  updatePatientSelect();
  showNotification("Patient supprimé avec succès.", "success");
}

// Recherche de patients
searchPatient.addEventListener("input", (e) => {
  afficherPatients(e.target.value);
});

// Export des patients
exportPatients.onclick = () => {
  const dataStr = JSON.stringify(patients, null, 2);
  const dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
  const exportFileDefaultName = `patients_${
    new Date().toISOString().split("T")[0]
  }.json`;

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", exportFileDefaultName);
  linkElement.click();
};

exportPatientsCSV.onclick = () => {
  if (patients.length === 0) {
    showNotification("Aucun patient à exporter.", "error");
    return;
  }

  const headers = ["Nom", "Âge", "Diagnostic", "Téléphone", "Email", "Note"];
  const csvData = patients.map((p) => [
    p.name,
    p.age,
    p.disease || "",
    p.phone || "",
    p.email || "",
    p.note || "",
  ]);

  let csvContent = headers.join(",") + "\n";
  csvData.forEach((row) => {
    csvContent += row.map((field) => `"${field}"`).join(",") + "\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `patients_${new Date().toISOString().split("T")[0]}.csv`
  );
  link.click();
};

// Gestion RDV
const rdvForm = document.getElementById("rdvForm");
const rdvList = document.getElementById("rdvList");
const exportRdvs = document.getElementById("exportRdvs");
const exportRdvsCSV = document.getElementById("exportRdvsCSV");
const toggleRdvForm = document.getElementById("toggleRdvForm");
const cancelRdv = document.getElementById("cancelRdv");

let rdvs = JSON.parse(localStorage.getItem("medicare_rdvs")) || [];
let editingRdvId = null;

function saveRdvs() {
  localStorage.setItem("medicare_rdvs", JSON.stringify(rdvs));
}

function updatePatientSelect() {
  const select = document.getElementById("rdvPatient");
  select.innerHTML = '<option value="">Sélectionner un patient</option>';
  patients.forEach((p) => {
    const option = document.createElement("option");
    option.value = p.id;
    option.textContent = `${p.name} (${p.age} ans)`;
    select.appendChild(option);
  });
}

// Toggle du formulaire RDV
toggleRdvForm.onclick = () => {
  rdvForm.classList.toggle("hidden");
  const isHidden = rdvForm.classList.contains("hidden");
  toggleRdvForm.innerHTML = isHidden
    ? '<i class="fas fa-plus"></i> Ajouter un RDV'
    : '<i class="fas fa-minus"></i> Masquer le formulaire';

  if (!isHidden) {
    editingRdvId = null;
    updatePatientSelect();
    rdvForm.reset();
  }
};

cancelRdv.onclick = () => {
  rdvForm.classList.add("hidden");
  toggleRdvForm.innerHTML = '<i class="fas fa-plus"></i> Ajouter un RDV';
  editingRdvId = null;
};

// Soumission du formulaire RDV
rdvForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const patientId = parseInt(document.getElementById("rdvPatient").value);
  const date = document.getElementById("rdvDate").value;
  const time = document.getElementById("rdvTime").value;
  const note = document.getElementById("rdvNote").value.trim();

  const patient = patients.find((p) => p.id === patientId);
  if (!patient) {
    showNotification("Veuillez sélectionner un patient valide.", "error");
    return;
  }

  const rdvDateTime = new Date(`${date}T${time}`);
  if (rdvDateTime < new Date()) {
    showNotification(
      "La date du rendez-vous ne peut pas être dans le passé.",
      "error"
    );
    return;
  }

  if (editingRdvId) {
    // Modification d'un RDV existant
    const rdvIndex = rdvs.findIndex((r) => r.id === editingRdvId);
    if (rdvIndex !== -1) {
      rdvs[rdvIndex] = {
        ...rdvs[rdvIndex],
        patientId: patient.id,
        patientName: patient.name,
        date,
        time,
        note,
        updatedAt: new Date().toISOString(),
      };
      showNotification("Rendez-vous modifié avec succès !", "success");
    }
  } else {
    // Ajout d'un nouveau RDV
    const rdv = {
      id: Date.now(),
      patientId: patient.id,
      patientName: patient.name,
      date,
      time,
      note,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    rdvs.push(rdv);
    showNotification("Rendez-vous ajouté avec succès !", "success");
  }

  saveRdvs();
  afficherRdvs();
  rdvForm.reset();
  rdvForm.classList.add("hidden");
  toggleRdvForm.innerHTML = '<i class="fas fa-plus"></i> Ajouter un RDV';
  editingRdvId = null;
});

function afficherRdvs() {
  rdvList.innerHTML = "";
  rdvs.sort(
    (a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`)
  );

  if (rdvs.length === 0) {
    rdvList.innerHTML = `
            <li class="empty-state">
                <i class="fas fa-calendar-alt"></i>
                <p>Aucun rendez-vous planifié. Ajoutez-en un nouveau !</p>
            </li>
        `;
    return;
  }

  rdvs.forEach((r) => {
    const li = document.createElement("li");
    const isPast = new Date(`${r.date}T${r.time}`) < new Date();
    if (isPast) li.classList.add("past");

    li.innerHTML = `
            <div class="patient-info">
                <strong>${r.patientName}</strong> — ${formatDate(r.date)} à ${
      r.time
    }
                <small>${r.note || "Aucune note"}</small>
            </div>
            <div class="actions">
                <button class="btn-edit" onclick="editerRdv(${
                  r.id
                })"><i class="fas fa-edit"></i></button>
                <button class="btn-delete" onclick="confirmSupprimerRdv(${
                  r.id
                })"><i class="fas fa-trash"></i></button>
            </div>
        `;
    rdvList.appendChild(li);
  });
}

function editerRdv(id) {
  const rdv = rdvs.find((r) => r.id === id);
  if (!rdv) return;

  document.getElementById("rdvPatient").value = rdv.patientId;
  document.getElementById("rdvDate").value = rdv.date;
  document.getElementById("rdvTime").value = rdv.time;
  document.getElementById("rdvNote").value = rdv.note || "";

  rdvForm.classList.remove("hidden");
  toggleRdvForm.innerHTML =
    '<i class="fas fa-minus"></i> Masquer le formulaire';
  editingRdvId = id;
}

function confirmSupprimerRdv(id) {
  const rdv = rdvs.find((r) => r.id === id);
  if (!rdv) return;

  document.getElementById(
    "confirmMessage"
  ).textContent = `Êtes-vous sûr de vouloir supprimer le rendez-vous de "${rdv.patientName}" ?`;

  document.getElementById("confirmDelete").onclick = () => {
    supprimerRdv(id);
    document.getElementById("confirmModal").classList.add("hidden");
  };

  document.getElementById("confirmModal").classList.remove("hidden");
}

function supprimerRdv(id) {
  rdvs = rdvs.filter((r) => r.id !== id);
  saveRdvs();
  afficherRdvs();
  showNotification("Rendez-vous supprimé avec succès.", "success");
}

// Export des RDV
exportRdvs.onclick = () => {
  const dataStr = JSON.stringify(rdvs, null, 2);
  const dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
  const exportFileDefaultName = `rdvs_${
    new Date().toISOString().split("T")[0]
  }.json`;

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", exportFileDefaultName);
  linkElement.click();
};

exportRdvsCSV.onclick = () => {
  if (rdvs.length === 0) {
    showNotification("Aucun rendez-vous à exporter.", "error");
    return;
  }

  const headers = ["Patient", "Date", "Heure", "Note"];
  const csvData = rdvs.map((r) => [
    r.patientName,
    r.date,
    r.time,
    r.note || "",
  ]);

  let csvContent = headers.join(",") + "\n";
  csvData.forEach((row) => {
    csvContent += row.map((field) => `"${field}"`).join(",") + "\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `rdvs_${new Date().toISOString().split("T")[0]}.csv`
  );
  link.click();
};

// Statistiques
let ageChart, rdvChart, diseaseChart;

function updateStats() {
  document.getElementById("totalPatients").textContent = patients.length;
  document.getElementById("totalRdvs").textContent = rdvs.length;

  // RDV ce mois
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const rdvsThisMonth = rdvs.filter((r) => {
    const rdvDate = new Date(r.date);
    return (
      rdvDate.getMonth() === currentMonth &&
      rdvDate.getFullYear() === currentYear
    );
  }).length;
  document.getElementById("rdvsThisMonth").textContent = rdvsThisMonth;

  // Âge moyen
  const averageAge =
    patients.length > 0
      ? (patients.reduce((sum, p) => sum + p.age, 0) / patients.length).toFixed(
          1
        )
      : 0;
  document.getElementById("averageAge").textContent = averageAge;
}

function updateCharts() {
  updateStats();

  // Graphique des âges
  const ageGroups = { "0-18": 0, "19-35": 0, "36-50": 0, "51-65": 0, "66+": 0 };
  patients.forEach((p) => {
    if (p.age <= 18) ageGroups["0-18"]++;
    else if (p.age <= 35) ageGroups["19-35"]++;
    else if (p.age <= 50) ageGroups["36-50"]++;
    else if (p.age <= 65) ageGroups["51-65"]++;
    else ageGroups["66+"]++;
  });

  if (ageChart) ageChart.destroy();
  const ageCtx = document.getElementById("ageChart").getContext("2d");
  ageChart = new Chart(ageCtx, {
    type: "bar",
    data: {
      labels: Object.keys(ageGroups),
      datasets: [
        {
          label: "Nombre de patients",
          data: Object.values(ageGroups),
          backgroundColor: [
            "rgba(46, 134, 171, 0.8)",
            "rgba(162, 59, 114, 0.8)",
            "rgba(39, 174, 96, 0.8)",
            "rgba(243, 156, 18, 0.8)",
            "rgba(231, 76, 60, 0.8)",
          ],
          borderColor: [
            "rgba(46, 134, 171, 1)",
            "rgba(162, 59, 114, 1)",
            "rgba(39, 174, 96, 1)",
            "rgba(243, 156, 18, 1)",
            "rgba(231, 76, 60, 1)",
          ],
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: "Répartition des patients par âge",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Nombre de patients",
          },
        },
        x: {
          title: {
            display: true,
            text: "Tranches d'âge",
          },
        },
      },
    },
  });
  const rdvByMonth = {};
  rdvs.forEach((r) => {
    const month = new Date(r.date).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
    });
    rdvByMonth[month] = (rdvByMonth[month] || 0) + 1;
  });

  if (rdvChart) rdvChart.destroy();
  const rdvCtx = document.getElementById("rdvChart").getContext("2d");
  rdvChart = new Chart(rdvCtx, {
    type: "line",
    data: {
      labels: Object.keys(rdvByMonth),
      datasets: [
        {
          label: "Nombre de RDV",
          data: Object.values(rdvByMonth),
          backgroundColor: "rgba(162, 59, 114, 0.2)",
          borderColor: "rgba(162, 59, 114, 1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Évolution des rendez-vous par mois",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Nombre de RDV",
          },
        },
        x: {
          title: {
            display: true,
            text: "Mois",
          },
        },
      },
    },
  });

  // Graphique des diagnostics
  const diseaseCounts = {};
  patients.forEach((p) => {
    if (p.disease && p.disease.trim() !== "") {
      diseaseCounts[p.disease] = (diseaseCounts[p.disease] || 0) + 1;
    }
  });

  const topDiseases = Object.entries(diseaseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  if (diseaseChart) diseaseChart.destroy();
  const diseaseCtx = document.getElementById("diseaseChart").getContext("2d");
  diseaseChart = new Chart(diseaseCtx, {
    type: "doughnut",
    data: {
      labels: topDiseases.map((d) => d[0]),
      datasets: [
        {
          data: topDiseases.map((d) => d[1]),
          backgroundColor: [
            "rgba(46, 134, 171, 0.8)",
            "rgba(162, 59, 114, 0.8)",
            "rgba(39, 174, 96, 0.8)",
            "rgba(243, 156, 18, 0.8)",
            "rgba(231, 76, 60, 0.8)",
            "rgba(155, 89, 182, 0.8)",
            "rgba(52, 152, 219, 0.8)",
            "rgba(241, 196, 15, 0.8)",
          ],
          borderColor: [
            "rgba(46, 134, 171, 1)",
            "rgba(162, 59, 114, 1)",
            "rgba(39, 174, 96, 1)",
            "rgba(243, 156, 18, 1)",
            "rgba(231, 76, 60, 1)",
            "rgba(155, 89, 182, 1)",
            "rgba(52, 152, 219, 1)",
            "rgba(241, 196, 15, 1)",
          ],
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
        },
        title: {
          display: true,
          text: "Diagnostics les plus fréquents",
        },
      },
    },
  });
}
// Fonctions utilitaires
function formatDate(dateString) {
  const options = { day: "2-digit", month: "2-digit", year: "numeric" };
  return new Date(dateString).toLocaleDateString("fr-FR", options);
}

// Gestion du modal de confirmation
document.getElementById("confirmCancel").onclick = () => {
  document.getElementById("confirmModal").classList.add("hidden");
};

document.querySelector(".modal-close").onclick = () => {
  document.getElementById("confirmModal").classList.add("hidden");
};

// Notifications
function showNotification(message, type) {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.style.display = "block";

  setTimeout(() => {
    notification.style.display = "none";
  }, 4000);
}

// Initialisation
function init() {
  afficherPatients();
  afficherRdvs();
  updatePatientSelect();
  updateStats();

  // Fermer le modal en cliquant à l'extérieur
  document.getElementById("confirmModal").onclick = (e) => {
    if (e.target.id === "confirmModal") {
      document.getElementById("confirmModal").classList.add("hidden");
    }
  };
}

// Démarrer l'application
document.addEventListener("DOMContentLoaded", init);
