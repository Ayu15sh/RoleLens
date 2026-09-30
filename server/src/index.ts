import express from 'express';
import cors from 'cors';
import { config } from './config';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

async function main() {
  const app = express();

  // Middleware
  app.use(cors({ origin: config.clientUrl }));
  app.use(express.json({ limit: '10mb' })); // Text payloads can be large

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  });

  // API routes
  app.use('/api', routes);

  // Error handling (must be last)
  app.use(errorHandler);

  // Start server
  app.listen(config.port, () => {
    console.log(`\n🚀 RoleLens server running on http://localhost:${config.port}`);
    console.log(`   Environment: ${config.nodeEnv}`);
    console.log(`   LLM Model: ${config.llmModel}`);
    console.log(`   Embedding Model: ${config.embeddingModel}`);
    console.log(`   Top-K: ${config.topK}`);
    console.log(`   Client URL: ${config.clientUrl}\n`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
