import 'dotenv/config';
import { buildApp } from './app';

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';

async function start() {
  const app = await buildApp();

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`🌱 Buruan Sae 2.0 API berjalan di http://${HOST}:${PORT}`);
    app.log.info(`📚 Dokumentasi API: http://${HOST}:${PORT}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM diterima, menutup server...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT diterima, menutup server...');
  process.exit(0);
});

start();
