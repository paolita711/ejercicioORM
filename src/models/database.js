const { PrismaClient } = require('@prisma/client');
const env = require('../config/env');

class Database {
  constructor() {
    if (Database.instance) return Database.instance;

    // Patrón: Singleton (único PrismaClient en toda la aplicación)
    this.client = new PrismaClient({
      datasources: { db: { url: env.databaseUrl } },
      log: env.isProduction ? ['error'] : ['error', 'warn']
    });

    Database.instance = this;
  }

  getClient() {
    return this.client;
  }

  async testConnection() {
    await this.client.$queryRaw`SELECT 1`;
  }

  async close() {
    await this.client.$disconnect();
  }
}

module.exports = new Database();
