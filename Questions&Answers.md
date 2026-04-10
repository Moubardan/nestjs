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

---

## Q : Ordre d'exécution dans une requête NestJS — expliquer chaque étape ?

```
Requête HTTP entrante
        │
        ▼
  1. Middleware          app.use(...)  — même concept qu'Express
        │
        ▼
  2. Guard               @UseGuards()  — autorisation (oui/non ?)
        │
        ▼
  3. Interceptor (avant) @UseInterceptors()  — avant le handler
        │
        ▼
  4. Pipe                @UsePipes() / ValidationPipe  — transformation & validation
        │
        ▼
  5. Controller handler  méthode du @Controller
        │
        ▼
  6. Service             logique métier
        │
        ▼
  3. Interceptor (après) retour du handler — peut modifier la réponse
        │
        ▼
  Exception Filter       @Catch()  — intercepte toute exception levée à n'importe quelle étape
        │
        ▼
  Réponse HTTP
```

### 1. Middleware
- S'exécute **avant tout le reste**, accès brut à `req` / `res` / `next`.
- Usage : logging, CORS, parsing du body, rate limiting.
- **Ne connaît pas** le handler qui sera appelé (pas de contexte Nest).
- Enregistré avec `app.use()` ou `configure()` dans un module.

### 2. Guard
- Décide si la requête **peut continuer** (retourne `true`) ou est bloquée (`ForbiddenException` → 403).
- A accès à l'`ExecutionContext` : il **sait quelle route et quel handler** sont ciblés.
- Usage : authentification JWT, vérification de rôles, `IsOwnerGuard`.
- Scopable : `@UseGuards()` sur une méthode, un contrôleur, ou global.

### 3. Interceptor (avant le handler)
- Se branche **autour** du handler via RxJS (`Observable`).
- Peut transformer la requête entrante, démarrer un timer, injecter des données.
- Exécute du code **avant** (ici) et **après** (voir étape retour) le handler.
- Usage : logging de durée, mise en cache, transformation de réponse globale.

### 4. Pipe
- Reçoit les **arguments** du handler (body, params, query) et peut les **transformer ou valider**.
- `ValidationPipe` : lit les décorateurs `class-validator` sur le DTO et lève `BadRequestException` (400) si invalide.
- `ParseIntPipe` : transforme la string `"42"` en number `42`.
- S'exécute **par argument**, juste avant l'appel du handler.

### 5. Controller handler
- Méthode du `@Controller` : extrait les données (`@Body`, `@Param`…) et **délègue au service**.
- Ne contient aucune logique métier.

### 6. Service
- Contient toute la **logique métier**.
- Lève des `HttpException` si nécessaire (`NotFoundException`, etc.) → remontent vers l'Exception Filter.

### Exception Filter
- Intercepte **toute exception** non gérée, à n'importe quelle étape du pipeline.
- Formate la réponse d'erreur de façon uniforme.
- S'exécute même si l'erreur vient d'un Guard ou d'un Pipe.

---

## Q : Pourquoi stocker le Refresh Token en BDD (et pas seulement le Access Token) ?

Le **Refresh Token** est stocké pour pouvoir le **révoquer**.

- Sans stockage, un token volé reste valide jusqu'à son expiration.
- On ne peut pas faire un vrai logout côté serveur.
- On ne peut pas invalider une session active.

Le **Access Token** n'est généralement pas stocké car il vit peu de temps.

## Q : Différence entre `@UseGuards(AuthGuard('jwt'))` et un Guard custom ?

**`AuthGuard('jwt')`** : guard Passport prêt à l'emploi.
Il valide le JWT via la strategy et remplit `request.user`.

**Guard custom** : guard écrit par toi.
Il sert à ajouter des règles métier comme vérifier le rôle, le propriétaire, ou une condition spécifique.