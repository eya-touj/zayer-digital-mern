# Crystal Rent Car — Prototype de refonte

Prototype front-end HTML/CSS/JavaScript avec une API Python Flask. Le design comprend une hero vidéo (avec image de repli), une recherche de location, la flotte filtrable, des cartes avec effet 3D, des animations au scroll, les services, une FAQ et un chatbot de recommandation connecté au fichier d'inventaire de démonstration.

## Démarrage local

Python 3.10+ recommandé.

```bash
python -m venv .venv
# Windows PowerShell :
.venv\Scripts\Activate.ps1
# macOS / Linux :
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Ouvrir ensuite <http://127.0.0.1:5000>.

## Chatbot

Le chatbot envoie ses critères à `POST /api/recommend`, qui compare le besoin aux véhicules dans `data/cars.json`. La liste des voitures est servie par `GET /api/cars`. Modifiez ce JSON pour mettre à jour les noms, photos, transmissions, types de véhicules et critères utilisés par les recommandations.

## Important avant livraison client / mise en production

- Le site public affiche plusieurs véhicules, dont Toyota C-HR, Renault Clio 4, Mercedes Classe E, Mercedes Classe C et Kia Sportage. Le JSON fourni est une **sélection de démonstration** basée sur ces modèles, pas un export du stock réel.
- Les tarifs par véhicule, disponibilités par date, options exactes et kilométrage ne sont pas présumés : les cartes indiquent « Sur demande » et « À confirmer ».
- Le chatbot est un moteur de recommandation simple, local et explicable, **pas un modèle d’IA connecté** ni un outil qui réserve une voiture. Il ne peut pas vérifier le stock en temps réel.
- Le bouton de contact ouvre WhatsApp sur le numéro public affiché sur le site. Le formulaire de recherche filtre la flotte et prépare une demande indicative ; il ne bloque pas de réservation.
- Pour un site opérationnel, connecter `data/cars.json` au système de gestion réel, intégrer les tarifs/disponibilités, ajouter un flux de réservation sécurisé, configurer l’envoi d’e-mails, les règles d’assurance/dépôt/annulation, les pages légales, analytics, SEO et hébergement HTTPS.
- Photos de démonstration chargées depuis Unsplash et vidéo distante Pexels ; une connexion internet est nécessaire pour les afficher. Remplacer par les photos et vidéos autorisées du client avant publication.
- Contact public repris pour le prototype : `+216 26 380 100`, `+216 26 380 200`, `info@crystalrentcar.com`.

## Structure

```text
crystal-rent-car-prototype/
├── app.py
├── requirements.txt
├── README.md
├── data/
│   └── cars.json
└── static/
    ├── index.html
    ├── style.css
    └── script.js
```
