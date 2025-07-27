# 🎮 Défis VS Donate 💸

Un site web moderne pour gérer les défis de stream avec donations PayPal intégrées.

## 🚀 Fonctionnalités

- ✅ Interface moderne et responsive
- 💳 Intégration PayPal pour les donations
- 📊 Tableau de bord avec statistiques en temps réel
- 🎯 Gestion des défis (En attente, En cours, Terminés, Refusés)
- 📧 Notifications email automatiques
- 🔍 Filtrage des défis par statut
- 📱 Design mobile-first

## 🛠️ Configuration

### 1. Configuration PayPal

1. Créez un compte développeur PayPal sur [developer.paypal.com](https://developer.paypal.com)
2. Créez une nouvelle application pour obtenir votre Client ID
3. Remplacez `YOUR_PAYPAL_CLIENT_ID` dans les fichiers suivants :
   - `index.html` (ligne 108)
   - `script.js` (ligne 3)

### 2. Configuration Email

L'adresse email `contentcreator.jrpglibrary@gmail.com` est déjà configurée dans :
- `index.html` (ligne 114)
- `script.js` (ligne 5)

### 3. Déploiement

Le site est entièrement statique et peut être déployé sur :
- GitHub Pages
- Netlify
- Vercel
- Tout hébergeur web classique

## 📁 Structure du projet

```
DéfisVSDonate/
├── index.html          # Page principale
├── styles.css          # Styles CSS
├── script.js           # Logique JavaScript
└── README.md           # Documentation
```

## 🎨 Personnalisation

### Couleurs
Les couleurs principales peuvent être modifiées dans `styles.css` :
- Gradient principal : `#667eea` → `#764ba2`
- Couleur d'accent : `#00b894`
- Couleur de danger : `#fd79a8`

### Montants de donation
Modifiez les montants prédéfinis dans `index.html` (lignes 65-70).

### Données de démonstration
Les défis d'exemple sont dans `script.js` (lignes 11-44). Supprimez-les en production.

## 🔧 Utilisation

### Pour les viewers :
1. Remplir le formulaire de défi
2. Choisir le montant de donation
3. Payer via PayPal
4. Le défi est automatiquement ajouté en "En attente"

### Pour le streamer :
1. Recevoir la notification email
2. Valider ou refuser le défi
3. Mettre à jour le statut manuellement (pour l'instant)

## 🚧 Améliorations futures

- [ ] Panel d'administration pour gérer les défis
- [ ] Base de données pour la persistance
- [ ] API backend pour la gestion automatique
- [ ] Système de notifications push
- [ ] Intégration Twitch/YouTube
- [ ] Système de votes communautaires

## 🐛 Support

Pour toute question ou problème, contactez : contentcreator.jrpglibrary@gmail.com

## 📄 Licence

Ce projet est libre d'utilisation pour un usage personnel et commercial.

---

**Made with 💜 pour la commu !**