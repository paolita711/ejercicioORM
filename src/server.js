const app = require('./app');
const env = require('./config/env');
const database = require('./models/database');
const logger = require('./middlewares/logger.middleware');

async function start() {
  try {
    await database.testConnection();
    logger.info('Conexión a PostgreSQL verificada correctamente');
  } catch (error) {
    logger.error(`No se pudo conectar a PostgreSQL (${env.db.host}:${env.db.port}/${env.db.database}): ${error.message}`);
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    logger.info(`Servidor escuchando en http://localhost:${env.port}`);
  });

  let shuttingDown = false;
  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`Señal ${signal} recibida: cerrando servidor y pool de PostgreSQL`);

    server.close(async (error) => {
      if (error) logger.error(`Error al cerrar el servidor: ${error.message}`);
      try {
        await database.close();
        logger.info('Cierre ordenado completado');
        process.exit(0);
      } catch (closeError) {
        logger.error(`Error al cerrar el pool: ${closeError.message}`);
        process.exit(1);
      }
    });

    setTimeout(() => {
      logger.error('Tiempo de espera agotado al cerrar: forzando salida');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
