import { app } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';

const startServer = async () => {
  try {
    // Vérification de la connexion à la base de données
    await prisma.$connect();
    logger.info('✅ Base de données PostgreSQL connectée avec succès.');

    app.listen(env.PORT, () => {
      logger.info(`🚀 Serveur démarré en mode ${env.NODE_ENV} sur le port ${env.PORT}`);
    });
  } catch (error) {
    logger.error('❌ Erreur critique lors du démarrage:', error);
    process.exit(1);
  }
};

// Gestion propre de l'arrêt du serveur
process.on('SIGINT', async () => {
  logger.info('Fermeture du serveur (SIGINT)...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Fermeture du serveur (SIGTERM)...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
