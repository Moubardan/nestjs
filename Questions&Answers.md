## Q : Différence `providers` vs `exports` dans un `@Module` ?

**`providers`** : déclare les injectables disponibles **à l'intérieur** du module.
Nest crée leurs instances et les câble entre elles, mais elles restent privées.

**`exports`** : rend un provider visible **à l'extérieur** du module.
Un autre module qui importe ce module peut alors l'injecter.

## Q : Pourquoi on ne fait jamais `new TasksService()` dans NestJS ?

Parce que le **conteneur IoC** de Nest gère le cycle de vie des instances.

- Il crée **un singleton** par module et le réutilise partout où il est injecté.
- Il résout automatiquement les **dépendances transitives** (si `TasksService` dépend lui-même d'un autre service, Nest les instancie dans le bon ordre).
- Faire `new TasksService()` court-circuite tout ça : tu obtiens une instance isolée, hors du graphe de dépendances, et les tests (mock/override) ne fonctionnent plus.