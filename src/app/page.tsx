import Link from "next/link";
import MapClient from "@/components/MapClient";

export default function Home() {
  return (
    <>
      <section
        className="relative h-screen w-screen"
        aria-label="Carte interactive des prix d'essence au Québec"
      >
        <MapClient />
      </section>

      {/* Contenu SEO — visible pour les lecteurs d'écran et les moteurs de recherche */}
      <main className="sr-only">
        <article>
          <header>
            <h1>
              Prix de l&apos;essence au Québec — Carte interactive en temps
              réel
            </h1>
            <p>
              Essence Québec est une carte interactive gratuite. Elle affiche
              les prix de l&apos;essence en temps réel. Toutes les régions du
              Québec sont couvertes.
            </p>
            <p>
              Consultez le prix par litre à chaque station près de vous. Les
              carburants disponibles : régulier, super, premium et diesel. Les
              données proviennent de la Régie de l&apos;énergie du Québec.
              Elles sont mises à jour régulièrement. Vous obtenez une
              information fiable pour économiser sur le carburant.
            </p>
          </header>

          <section aria-labelledby="how-heading">
            <h2 id="how-heading">
              Comment utiliser la carte interactive des prix d&apos;essence ?
            </h2>
            <p>
              La carte interactive des prix de l&apos;essence est simple
              d&apos;utilisation. Entrez votre adresse dans la barre de
              recherche. Vous pouvez aussi activer la géolocalisation de votre
              appareil. La carte se centre sur votre position actuelle.
            </p>
            <p>
              Chaque marqueur coloré représente une station-service. Il affiche
              le prix actuel de l&apos;essence en temps réel. Un marqueur vert
              indique un prix bas. Un marqueur rouge indique un prix élevé.
            </p>
            <p>
              Cliquez sur un marqueur pour voir le détail des prix. Vous
              consultez tous les types de carburant : régulier, super, premium,
              diesel. L&apos;adresse complète est affichée. L&apos;historique
              des prix sur 30 jours est disponible sous forme de graphique.
            </p>
            <p>
              Utilisez la recherche par rayon pour trouver la station la moins
              chère. Définissez une distance en kilomètres. La carte identifie
              automatiquement les stations avec le prix le plus bas dans ce
              rayon.
            </p>
          </section>

          <section aria-labelledby="features-heading">
            <h2 id="features-heading">
              Fonctionnalités de la carte des prix d&apos;essence
            </h2>
            <p>
              Essence Québec offre plusieurs outils pour comparer les prix du
              carburant en temps réel :
            </p>
            <ul>
              <li>
                Carte interactive avec les prix actuels de toutes les
                stations-service du Québec
              </li>
              <li>
                Filtrage par carburant : régulier (87), super (91), super (94),
                premium et diesel
              </li>
              <li>
                Recherche des stations les moins chères dans un rayon de 1 à
                50 km
              </li>
              <li>
                Prix moyens par région : Montréal, Québec, Laval, Montérégie,
                Laurentides et plus
              </li>
              <li>
                Graphique d&apos;historique des prix sur les 30 derniers jours
                par station
              </li>
              <li>Comparaison rapide entre plusieurs stations proches</li>
              <li>Signalement de prix incorrects directement depuis la carte</li>
              <li>Mode clair et mode sombre disponibles</li>
              <li>Interface responsive : mobile, tablette et ordinateur</li>
            </ul>
          </section>

          <section aria-labelledby="save-heading">
            <h2 id="save-heading">
              Économiser sur l&apos;essence au Québec avec les prix en temps
              réel
            </h2>
            <p>
              Les prix du carburant augmentent constamment. Trouver
              l&apos;essence la moins chère est devenu essentiel. La carte
              interactive d&apos;Essence Québec vous aide à repérer les
              stations les moins chères. Elle fonctionne partout : Montréal,
              Québec, Laval, Longueuil et toutes les régions de la province.
            </p>
            <p>
              Consultez les prix en temps réel avant chaque plein. Vous pouvez
              économiser plusieurs centimes par litre. Sur 60 litres, une
              différence de 3 cents/litre = 1,80 $ économisés. Sur une année,
              c&apos;est plus de 90 $ d&apos;économies. Il suffit de choisir
              la bonne station grâce à la carte.
            </p>
            <p>
              La carte est mise à jour plusieurs fois par jour. Les prix
              affichés sont toujours récents. Vous faites des choix éclairés
              sur votre carburant.
            </p>
          </section>

          <section aria-labelledby="regions-heading">
            <h2 id="regions-heading">
              Régions couvertes par la carte des prix d&apos;essence au Québec
            </h2>
            <p>
              La carte couvre toutes les régions administratives du Québec. Les
              grandes villes sont bien représentées : Montréal, Québec, Laval,
              Longueuil, Gatineau. Elles ont une forte densité de
              stations-service.
            </p>
            <p>
              Les régions éloignées sont aussi couvertes. Vous y trouverez les
              prix de l&apos;essence en temps réel : Saguenay–Lac-Saint-Jean,
              Bas-Saint-Laurent, Gaspésie–Îles-de-la-Madeleine, Côte-Nord,
              Abitibi-Témiscamingue, Laurentides, Lanaudière, Montérégie,
              Estrie, Mauricie, Outaouais, Chaudière-Appalaches,
              Centre-du-Québec et Nord-du-Québec.
            </p>
            <p>
              Planifiez un voyage en voiture au Québec. Faites votre trajet
              habituel. Trouvez le plein le moins cher. La carte interactive
              Essence Québec est votre référence pour les prix du carburant
              dans toute la province.
            </p>
          </section>

          <section aria-labelledby="faq-heading">
            <h2 id="faq-heading">
              Questions fréquentes sur les prix de l&apos;essence au Québec
            </h2>

            <h3>
              À quelle fréquence les prix sont-ils mis à jour sur la carte ?
            </h3>
            <p>
              Les prix sont mis à jour plusieurs fois par jour. Les données
              proviennent de la Régie de l&apos;énergie du Québec. Vous
              consultez toujours des prix en temps réel ou très récents.
            </p>

            <h3>La carte des prix d&apos;essence est-elle gratuite ?</h3>
            <p>
              Oui, la carte interactive est entièrement gratuite. Aucun
              abonnement ni publicité intrusive.
            </p>

            <h3>
              Puis-je signaler un prix d&apos;essence incorrect sur la carte ?
            </h3>
            <p>
              Oui. Cliquez sur une station-service sur la carte. Utilisez le
              bouton de signalement pour indiquer un prix erroné. Votre
              contribution aide à maintenir l&apos;exactitude des prix.
            </p>

            <h3>
              Comment trouver la station la moins chère près de moi ?
            </h3>
            <p>
              Activez la géolocalisation ou entrez votre adresse. Utilisez le
              curseur de rayon pour définir une distance. La carte trouve
              automatiquement les stations avec le prix le plus bas.
            </p>
          </section>

          <section aria-labelledby="source-heading">
            <h2 id="source-heading">Source des données</h2>
            <p>
              Les prix proviennent de la{" "}
              <a
                href="https://www.regie-energie.qc.ca/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Régie de l&apos;énergie du Québec
              </a>{" "}
              (REQ). C&apos;est l&apos;organisme gouvernemental qui encadre les
              prix des carburants. Ces données sont publiques et en format
              ouvert. Elles garantissent la transparence des prix affichés.
            </p>
          </section>

          <section aria-labelledby="share-heading">
            <h2 id="share-heading">Partager la carte des prix d&apos;essence</h2>
            <p>
              Partagez la carte des prix de l&apos;essence au Québec avec vos
              proches :
            </p>
            <ul>
              <li>
                <a
                  href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fessence-quebec.ca"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Partager sur Facebook
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/intent/tweet?url=https%3A%2F%2Fessence-quebec.ca&text=Prix+de+l%27essence+au+Qu%C3%A9bec+en+temps+r%C3%A9el"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Partager sur Twitter / X
                </a>
              </li>
            </ul>
          </section>

          <nav aria-label="Navigation du site">
            <ul>
              <li>
                <Link href="/">Carte des prix d&apos;essence au Québec</Link>
              </li>
              <li>
                <Link href="/changelog">Historique des mises à jour</Link>
              </li>
              <li>
                <Link href="/tech">Informations techniques</Link>
              </li>
              <li>
                <Link href="/login">Se connecter</Link>
              </li>
            </ul>
          </nav>
        </article>
      </main>
    </>
  );
}
