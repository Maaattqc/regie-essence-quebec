import Link from "next/link";
import MapClient from "@/components/MapClient";

export default function Home() {
  return (
    <>
      <section
        className="relative h-screen w-full"
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
              Essence Québec est une carte interactive gratuite qui affiche les
              prix de l&apos;essence en temps réel. Toutes les régions de la
              province sont couvertes par notre outil.
            </p>
            <p>
              Consultez le prix par litre à chaque station près de vous,
              incluant le régulier, le super, le premium et le diesel. Les
              données proviennent de la Régie de l&apos;énergie du Québec.
              Elles sont mises à jour régulièrement pour vous garantir une
              information fiable.
            </p>
          </header>

          <section aria-labelledby="how-heading">
            <h2 id="how-heading">
              Comment utiliser la carte interactive de l&apos;essence ?
            </h2>
            <p>
              La <Link href="/">carte interactive des prix de l&apos;essence</Link> est
              simple d&apos;utilisation. Entrez votre adresse dans la barre de
              recherche ou activez la géolocalisation. La carte se centre alors
              automatiquement sur votre position.
            </p>
            <p>
              Chaque marqueur coloré représente une station-service avec son
              prix actuel. Le code couleur va du vert pour les prix bas au
              rouge pour les prix élevés.
            </p>
            <p>
              Cliquez sur un marqueur pour voir le détail complet de la station.
              Vous y trouverez les prix de chaque carburant, l&apos;adresse
              complète et un graphique des prix sur 30 jours.
            </p>
            <p>
              La recherche par rayon vous permet de définir une distance en
              kilomètres. La carte identifie alors les stations offrant le prix
              le plus bas dans cette zone. Consultez notre{" "}
              <Link href="/faq">FAQ</Link> pour plus de réponses.
            </p>
          </section>

          <section aria-labelledby="features-heading">
            <h2 id="features-heading">
              Fonctionnalités de la carte du carburant au Québec
            </h2>
            <p>
              Essence Québec offre plusieurs outils pour comparer le coût du
              carburant en temps réel dans toute la province :
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
              Économiser sur l&apos;essence au Québec grâce aux tarifs en
              temps réel
            </h2>
            <p>
              Les prix du carburant augmentent constamment au Québec. Trouver
              l&apos;essence la moins chère est devenu essentiel pour les
              automobilistes. La carte Essence Québec vous aide à repérer les
              stations les moins chères partout dans la province.
            </p>
            <p>
              Consultez les prix en temps réel avant chaque plein pour
              économiser plusieurs centimes par litre. Sur un plein de
              60 litres, une différence de 3 cents par litre représente
              1,80 $ d&apos;économie. Sur une année, cela dépasse 90 $.
            </p>
            <p>
              La carte est mise à jour plusieurs fois par jour. Les prix
              affichés sont toujours récents, vous permettant de faire des
              choix éclairés pour chaque plein.
            </p>
          </section>

          <section aria-labelledby="regions-heading">
            <h2 id="regions-heading">
              Régions couvertes par la carte de l&apos;essence au Québec
            </h2>
            <p>
              La carte couvre toutes les régions administratives du Québec.
              Les grandes villes comme Montréal, Québec, Laval, Longueuil et
              Gatineau bénéficient d&apos;une forte densité de stations.
            </p>
            <p>
              Les régions éloignées sont aussi couvertes avec les prix en
              temps réel. Vous y trouverez le Saguenay–Lac-Saint-Jean, le
              Bas-Saint-Laurent, la Gaspésie, la Côte-Nord et
              l&apos;Abitibi-Témiscamingue. Les Laurentides, Lanaudière, la
              Montérégie, l&apos;Estrie et la Mauricie sont aussi incluses.
            </p>
            <p>
              Planifiez un voyage en voiture ou faites votre trajet habituel.
              Essence Québec est votre référence pour trouver le plein le
              moins cher dans toute la province.
            </p>
          </section>

          <section aria-labelledby="faq-heading">
            <h2 id="faq-heading">
              Questions fréquentes sur l&apos;essence au Québec
            </h2>

            <h3>
              À quelle fréquence les prix sont-ils mis à jour sur la carte ?
            </h3>
            <p>
              Les prix sont mis à jour plusieurs fois par jour. Les données
              proviennent de la Régie de l&apos;énergie du Québec. Vous
              consultez toujours des prix récents ou en temps réel.
            </p>

            <h3>La carte des prix d&apos;essence est-elle gratuite ?</h3>
            <p>
              Oui, la carte interactive est entièrement gratuite. Il n&apos;y a
              aucun abonnement ni publicité intrusive.
            </p>

            <h3>
              Puis-je signaler un prix d&apos;essence incorrect sur la carte ?
            </h3>
            <p>
              Oui, cliquez sur une station-service sur la carte. Utilisez
              ensuite le bouton de signalement pour indiquer un prix erroné.
              Votre contribution aide à maintenir l&apos;exactitude des prix.
            </p>

            <h3>
              Comment trouver la station la moins chère près de moi ?
            </h3>
            <p>
              Activez la géolocalisation ou entrez votre adresse. Utilisez
              ensuite le curseur de rayon pour définir une distance. La carte
              identifie automatiquement les stations au prix le plus bas.
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
              (REQ). C&apos;est l&apos;organisme gouvernemental qui encadre
              les prix des carburants. Ces données publiques garantissent la
              transparence des prix affichés. Consultez la page{" "}
              <Link href="/tech">informations techniques</Link> pour les
              détails. En savoir plus sur{" "}
              <Link href="/a-propos">Essence Québec</Link>.
            </p>
          </section>

          <section aria-labelledby="share-heading">
            <h2 id="share-heading">Partager la carte de l&apos;essence</h2>
            <p>
              Partagez notre carte de l&apos;essence au Québec avec vos
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
                <Link href="/">Carte interactive de l&apos;essence au Québec</Link>
              </li>
              <li>
                <Link href="/faq">Questions fréquentes</Link>
              </li>
              <li>
                <Link href="/a-propos">À propos d&apos;Essence Québec</Link>
              </li>
              <li>
                <Link href="/confidentialite">Politique de confidentialité</Link>
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
              <li>
                <a
                  href="https://www.linkedin.com/in/mathieu-fournier-4977591bb"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Mathieu Fournier sur LinkedIn
                </a>
              </li>
            </ul>
          </nav>
        </article>
      </main>
    </>
  );
}
