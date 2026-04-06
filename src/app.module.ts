// ============================================================
//  APP MODULE — app.module.ts
//
//  ┌─────────────── DIFFÉRENCE CLEF AVEC EXPRESS ───────────────┐
//  │  Express : tu importes des routeurs avec app.use('/tasks',  │
//  │  tasksRouter). La composition est impérative, à la main.   │
//  │                                                             │
//  │  NestJS : la composition est DÉCLARATIVE via @Module().     │
//  │  Nest lit le graphe de modules, résout les dépendances,     │
//  │  instancie les classes dans le bon ordre — tu ne touches    │
//  │  à rien dans main.ts.                                       │
//  └─────────────────────────────────────────────────────────────┘
//
//  @Module() reçoit un objet de métadonnées :
//
//  imports   → autres modules dont on veut utiliser les exports
//  exports   → providers de CE module rendus disponibles à l'extérieur
//  providers → services, guards, pipes… INJECTABLES dans ce module
//  controllers → classes qui gèrent les routes HTTP de ce module
//
// ============================================================
import { Module } from '@nestjs/common';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [TasksModule],
})
export class AppModule {}
