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

      {/* Contenu SEO — visible uniquement pour les lecteurs d'écran et les moteurs de recherche */}
      <main className="sr-only">
        <article>
          <header>
            <h1>
              Prix de l&apos;essence au Québec — Carte interactive en temps
              réel
            </h1>
            <p>
              Essence Québec est une carte interactive gratuite qui affiche les
              prix de l&apos;essence en temps réel dans toutes les régions du
              Québec. Consultez instantanément le prix par litre de
              l&apos;essence ordinaire (régulier), super, premium et du diesel
              dans les stations-service près de chez vous. Les données
              proviennent des sources officielles de la Régie de
              l&apos;énergie du Québec et sont mises à jour régulièrement, vous
              offrant une information fiable pour planifier vos pleins et
              économiser sur le carburant.
            </p>
          </header>

          <section aria-labelledby="how-heading">
            <h2 id="how-heading">
              Comment utiliser la carte interactive des prix d&apos;essence ?
            </h2>
            <p>
              La carte interactive des prix de l&apos;essence au Québec est
              simple d&apos;utilisation. Entrez votre adresse dans la barre de
              recherche ou activez la géolocalisation de votre appareil pour
              centrer la carte sur votre position actuelle. Chaque marqueur
              coloré représente une station-service et affiche le prix actuel
              de l&apos;essence en temps réel. Plus le marqueur est vert, moins
              le prix est élevé ; plus il est rouge, plus le prix est élevé.
            </p>
            <p>
              Cliquez sur un marqueur pour consulter le détail des prix de tous
              les types de carburant disponibles à cette station
              (régulier, super, premium, diesel), son adresse complète, ainsi
              que l&apos;historique de ses prix sur les 30 derniers jours sous
              forme de graphique interactif.
            </p>
            <p>
              Pour trouver la station-service la moins chère en temps réel
              autour de vous, utilisez la fonctionnalité de recherche par rayon
              : définissez une distance en kilomètres et la carte identifie
              automatiquement les stations avec le prix de l&apos;essence le
              plus bas dans ce rayon.
            </p>
          </section>

          <section aria-labelledby="features-heading">
            <h2 id="features-heading">
              Fonctionnalités de la carte des prix d&apos;essence
            </h2>
            <p>
              La carte interactive d&apos;Essence Québec offre plusieurs
              fonctionnalités pour comparer les prix de l&apos;essence en temps
              réel à travers la province :
            </p>
            <ul>
              <li>
                Affichage des prix actuels de l&apos;essence et du diesel pour
                toutes les stations-service du Québec sur une carte interactive
              </li>
              <li>
                Filtrage par type de carburant : essence régulière (87),
                super (91), super (94), premium et diesel
              </li>
              <li>
                Recherche des stations les moins chères dans un rayon
                personnalisable de 1 à 50 km autour de votre position
              </li>
              <li>
                Prix moyens par région administrative du Québec : Montréal,
                Québec, Laval, Montérégie, Laurentides et plus encore
              </li>
              <li>
                Historique des prix sur 30 jours : suivez l&apos;évolution du
                prix de l&apos;essence dans le temps grâce à un graphique
                interactif par station
              </li>
              <li>
                Comparaison rapide des prix entre différentes
                stations-service proches
              </li>
              <li>
                Signalement d&apos;erreurs de prix directement depuis la carte
                interactive
              </li>
              <li>
                Interface disponible en mode clair et mode sombre pour un
                confort visuel optimal
              </li>
              <li>
                Application responsive, utilisable sur mobile, tablette et
                ordinateur
              </li>
            </ul>
          </section>

          <section aria-labelledby="save-heading">
            <h2 id="save-heading">
              Économiser sur l&apos;essence au Québec grâce aux prix en temps
              réel
            </h2>
            <p>
              Avec la hausse constante des prix du carburant, trouver
              l&apos;essence la moins chère au Québec est devenu essentiel.
              La carte interactive d&apos;Essence Québec vous aide à identifier
              rapidement les stations-service offrant les prix les plus bas
              près de chez vous, que vous soyez à Montréal, Québec, Laval,
              Longueuil ou dans n&apos;importe quelle région de la province.
            </p>
            <p>
              En consultant les prix de l&apos;essence en temps réel avant
              chaque plein, vous pouvez économiser plusieurs centimes par
              litre. Sur un réservoir de 60 litres, une différence de 3
              cents/litre représente 1,80 $ d&apos;économies par plein. Sur
              une année complète, cela correspond à plus de 90 $ économisés
              uniquement en choisissant la bonne station-service grâce à
              notre carte interactive.
            </p>
            <p>
              La carte des prix d&apos;essence est mise à jour régulièrement
              tout au long de la journée pour vous garantir des informations
              toujours à jour sur les prix du carburant au Québec.
            </p>
          </section>

          <section aria-labelledby="regions-heading">
            <h2 id="regions-heading">
              Régions couvertes par la carte des prix d&apos;essence au Québec
            </h2>
            <p>
              La carte interactive des prix de l&apos;essence au Québec couvre
              l&apos;ensemble des régions administratives de la province. Les
              grandes villes comme Montréal, Québec, Laval, Longueuil et
              Gatineau disposent d&apos;une forte densité de stations-service
              visibles sur la carte, avec leurs prix en temps réel.
            </p>
            <p>
              Les régions plus éloignées sont également couvertes :
              Saguenay–Lac-Saint-Jean, Bas-Saint-Laurent,
              Gaspésie–Îles-de-la-Madeleine, Côte-Nord,
              Abitibi-Témiscamingue, Laurentides, Lanaudière, Montérégie,
              Estrie, Mauricie, Outaouais, Chaudière-Appalaches,
              Centre-du-Québec et Nord-du-Québec.
            </p>
            <p>
              Que vous planifiiez un voyage en voiture au Québec, que vous
              fassiez votre trajet habituel ou que vous cherchiez simplement
              à économiser sur votre prochain plein d&apos;essence, la carte
              interactive Essence Québec est votre référence pour les prix du
              carburant en temps réel dans toute la province.
            </p>
          </section>

          <section aria-labelledby="faq-heading">
            <h2 id="faq-heading">
              Questions fréquentes sur les prix de l&apos;essence au Québec
            </h2>

            <h3>
              À quelle fréquence les prix de l&apos;essence sont-ils mis à jour
              sur la carte ?
            </h3>
            <p>
              Les prix de l&apos;essence sur la carte interactive sont mis à
              jour plusieurs fois par jour à partir des données officielles de
              la Régie de l&apos;énergie du Québec. Vous consultez toujours
              des prix en temps réel ou très récents.
            </p>

            <h3>La carte des prix d&apos;essence est-elle gratuite ?</h3>
            <p>
              Oui, la carte interactive des prix de l&apos;essence au Québec
              est entièrement gratuite, sans abonnement et sans publicité
              intrusive.
            </p>

            <h3>
              Puis-je signaler un prix d&apos;essence incorrect sur la carte ?
            </h3>
            <p>
              Oui. Cliquez sur une station-service sur la carte interactive
              et utilisez le bouton de signalement pour indiquer un prix
              erroné. Votre contribution aide à maintenir l&apos;exactitude
              des prix affichés en temps réel.
            </p>

            <h3>
              Comment trouver la station-service la moins chère près de moi ?
            </h3>
            <p>
              Activez votre géolocalisation ou entrez votre adresse dans la
              barre de recherche de la carte interactive. Utilisez ensuite le
              curseur de rayon pour définir une distance de recherche. La
              carte identifiera automatiquement les stations avec le prix de
              l&apos;essence le plus bas dans ce rayon en temps réel.
            </p>
          </section>

          <section aria-labelledby="source-heading">
            <h2 id="source-heading">Source des données</h2>
            <p>
              Les prix affichés sur la carte interactive proviennent des
              données officielles de la{" "}
              <a
                href="https://www.regie-energie.qc.ca/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Régie de l&apos;énergie du Québec
              </a>{" "}
              (REQ), l&apos;organisme gouvernemental responsable de
              l&apos;encadrement des prix des carburants dans la province.
              Ces données publiques en format ouvert garantissent la
              transparence et la fiabilité des informations de prix
              présentées.
            </p>
          </section>

          <nav aria-label="Navigation du site">
            <ul>
              <li>
                <Link href="/">Carte des prix d&apos;essence au Québec</Link>
              </li>
              <li>
                <Link href="/changelog">
                  Historique des mises à jour
                </Link>
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
