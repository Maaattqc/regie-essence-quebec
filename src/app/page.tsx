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
              Essence Québec est une carte interactive entièrement gratuite qui
              affiche les prix de l&apos;essence en temps réel dans toutes les
              régions de la province.
            </p>
            <p>
              Consultez le prix par litre à chaque station près de vous pour
              tous les types de carburant disponibles, incluant le régulier, le
              super, le premium et le diesel. Les données proviennent
              directement de la Régie de l&apos;énergie du Québec et sont mises
              à jour régulièrement, ce qui vous garantit une information fiable
              pour économiser sur le carburant.
            </p>
          </header>

          <section aria-labelledby="how-heading">
            <h2 id="how-heading">
              Comment utiliser la carte interactive des prix d&apos;essence ?
            </h2>
            <p>
              La <Link href="/">carte interactive des prix de l&apos;essence</Link> est
              simple d&apos;utilisation : entrez votre adresse dans la barre de
              recherche ou activez la géolocalisation de votre appareil pour que
              la carte se centre automatiquement sur votre position actuelle.
            </p>
            <p>
              Chaque marqueur coloré représente une station-service et affiche
              le prix actuel de l&apos;essence en temps réel, avec un code
              couleur allant du vert pour les prix les plus bas au rouge pour
              les prix les plus élevés.
            </p>
            <p>
              En cliquant sur un marqueur, vous accédez au détail complet de la
              station, incluant les prix de tous les types de carburant
              (régulier, super, premium et diesel), l&apos;adresse complète
              ainsi qu&apos;un graphique d&apos;historique des prix couvrant les
              30 derniers jours.
            </p>
            <p>
              La recherche par rayon vous permet de définir une distance en
              kilomètres pour que la carte identifie automatiquement les
              stations offrant le prix le plus bas dans cette zone. Consultez
              notre <Link href="/faq">FAQ</Link> pour obtenir davantage de
              réponses à vos questions.
            </p>
          </section>

          <section aria-labelledby="features-heading">
            <h2 id="features-heading">
              Fonctionnalités de la carte des prix d&apos;essence
            </h2>
            <p>
              Essence Québec offre plusieurs outils performants qui vous
              permettent de comparer facilement les prix du carburant en temps
              réel à travers toute la province :
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
              Dans un contexte où les prix du carburant augmentent
              constamment, trouver l&apos;essence la moins chère est devenu
              essentiel pour les automobilistes québécois. La carte interactive
              d&apos;Essence Québec vous aide à repérer les stations les moins
              chères, que vous soyez à Montréal, Québec, Laval, Longueuil ou
              dans n&apos;importe quelle autre région de la province.
            </p>
            <p>
              En consultant les prix en temps réel avant chaque plein, vous
              pouvez économiser plusieurs centimes par litre, ce qui représente
              environ 1,80 $ d&apos;économie sur un plein de 60 litres avec
              une différence de seulement 3 cents par litre, et plus de 90 $
              d&apos;économies cumulées sur une année complète.
            </p>
            <p>
              La carte est mise à jour plusieurs fois par jour afin que les
              prix affichés soient toujours récents, vous permettant ainsi de
              faire des choix éclairés pour chaque plein de carburant.
            </p>
          </section>

          <section aria-labelledby="regions-heading">
            <h2 id="regions-heading">
              Régions couvertes par la carte des prix d&apos;essence au Québec
            </h2>
            <p>
              La carte couvre l&apos;ensemble des régions administratives du
              Québec, avec une représentation particulièrement dense dans les
              grandes villes comme Montréal, Québec, Laval, Longueuil et
              Gatineau où la concentration de stations-service est élevée.
            </p>
            <p>
              Les régions plus éloignées sont également couvertes avec les prix
              de l&apos;essence en temps réel, incluant le
              Saguenay–Lac-Saint-Jean, le Bas-Saint-Laurent, la
              Gaspésie–Îles-de-la-Madeleine, la Côte-Nord,
              l&apos;Abitibi-Témiscamingue, les Laurentides, Lanaudière, la
              Montérégie, l&apos;Estrie, la Mauricie, l&apos;Outaouais,
              Chaudière-Appalaches, le Centre-du-Québec et le Nord-du-Québec.
            </p>
            <p>
              Que vous planifiiez un voyage en voiture à travers le Québec ou
              que vous fassiez simplement votre trajet habituel, la carte
              interactive Essence Québec est votre référence pour trouver le
              plein le moins cher dans toute la province.
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
              Les prix sont mis à jour plusieurs fois par jour à partir des
              données officielles de la Régie de l&apos;énergie du Québec, ce
              qui vous garantit de consulter des prix en temps réel ou très
              récents à chaque visite.
            </p>

            <h3>La carte des prix d&apos;essence est-elle gratuite ?</h3>
            <p>
              Oui, la carte interactive est entièrement gratuite et accessible
              sans aucun abonnement ni publicité intrusive.
            </p>

            <h3>
              Puis-je signaler un prix d&apos;essence incorrect sur la carte ?
            </h3>
            <p>
              Oui, il vous suffit de cliquer sur une station-service sur la
              carte et d&apos;utiliser le bouton de signalement pour indiquer
              un prix erroné, contribuant ainsi à maintenir l&apos;exactitude
              des informations pour tous les utilisateurs.
            </p>

            <h3>
              Comment trouver la station la moins chère près de moi ?
            </h3>
            <p>
              Activez la géolocalisation ou entrez votre adresse, puis utilisez
              le curseur de rayon pour définir une distance en kilomètres afin
              que la carte identifie automatiquement les stations offrant le
              prix le plus bas dans cette zone.
            </p>
          </section>

          <section aria-labelledby="source-heading">
            <h2 id="source-heading">Source des données</h2>
            <p>
              Les prix affichés proviennent de la{" "}
              <a
                href="https://www.regie-energie.qc.ca/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Régie de l&apos;énergie du Québec
              </a>{" "}
              (REQ), l&apos;organisme gouvernemental qui encadre les prix des
              carburants dans la province. Ces données publiques en format
              ouvert garantissent la transparence et la fiabilité des prix
              affichés sur la carte. Consultez la page{" "}
              <Link href="/tech">informations techniques</Link> pour en savoir
              plus sur notre méthodologie, ou visitez la page{" "}
              <Link href="/a-propos">à propos d&apos;Essence Québec</Link>{" "}
              pour découvrir le projet.
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
                <Link href="/faq">Questions fréquentes</Link>
              </li>
              <li>
                <Link href="/a-propos">À propos d&apos;Essence Québec</Link>
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
