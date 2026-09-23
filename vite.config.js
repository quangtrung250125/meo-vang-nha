import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function apiDevPlugin() {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/notifications')) {
          return next();
        }

        const parseBody = () =>
          new Promise((resolve) => {
            let data = '';
            req.on('data', (chunk) => {
              data += chunk;
            });
            req.on('end', () => {
              try {
                resolve(data ? JSON.parse(data) : {});
              } catch {
                resolve(data);
              }
            });
          });

        res.status = (code) => {
          res.statusCode = code;
          return res;
        };

        res.json = (obj) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(obj));
          return res;
        };

        const urlPath = req.url.split('?')[0];

        try {
          if (urlPath === '/api/notifications/vapid-public-key') {
            const { default: handler } = await import('./api/notifications/vapid-public-key.js');
            return handler(req, res);
          }
          if (urlPath === '/api/notifications/subscribe') {
            req.body = await parseBody();
            const { default: handler } = await import('./api/notifications/subscribe.js');
            return handler(req, res);
          }
          if (urlPath === '/api/notifications/unsubscribe') {
            req.body = await parseBody();
            const { default: handler } = await import('./api/notifications/unsubscribe.js');
            return handler(req, res);
          }
          if (urlPath === '/api/notifications/send') {
            req.body = await parseBody();
            const { default: handler } = await import('./api/notifications/send.js');
            return handler(req, res);
          }
          if (urlPath === '/api/notifications/status') {
            const { default: handler } = await import('./api/notifications/status.js');
            return handler(req, res);
          }
        } catch (err) {
          console.error('[API Dev Server Error]:', err);
          return res.status(500).json({ error: err.message });
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [
      react(),
      tailwindcss(),
      apiDevPlugin(),
    ],
    server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts: true,
    },
    preview: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts: true,
    },
  };
});

