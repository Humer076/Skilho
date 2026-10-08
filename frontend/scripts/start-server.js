#!/usr/bin/env node
const net = require('net');
const { spawn } = require('child_process');

/**
 * Checks if a port is available on a specific host interface.
 */
function checkHost(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
        resolve(false);
      } else {
        // Address family not supported or other non-blocking errors
        resolve(true);
      }
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, host);
  });
}

/**
 * Checks IPv4 and IPv6 interfaces to ensure true port availability.
 */
async function isPortAvailable(port) {
  const hosts = ['0.0.0.0', '127.0.0.1', '::'];
  for (const host of hosts) {
    const ok = await checkHost(port, host);
    if (!ok) return false;
  }
  return true;
}

/**
 * Scans starting from startPort up to maxAttempts to find an open port.
 */
async function findAvailablePort(startPort, maxAttempts = 100) {
  for (let p = startPort; p < startPort + maxAttempts; p++) {
    if (await isPortAvailable(p)) {
      return p;
    }
  }
  throw new Error(`Could not find an available port between ${startPort} and ${startPort + maxAttempts - 1}`);
}

async function main() {
  const rawArgs = process.argv.slice(2);
  let mode = 'start';
  // Default frontend port to 3001 so NestJS backend can take 3000
  let requestedPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  const filteredArgs = [];

  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    if (arg === 'dev' || arg === 'start') {
      mode = arg;
    } else if (arg === '-p' || arg === '--port') {
      const nextVal = rawArgs[++i];
      if (nextVal && !isNaN(parseInt(nextVal, 10))) {
        requestedPort = parseInt(nextVal, 10);
      }
    } else if (arg.startsWith('-p=')) {
      requestedPort = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--port=')) {
      requestedPort = parseInt(arg.split('=')[1], 10);
    } else {
      filteredArgs.push(arg);
    }
  }

  let activePort = requestedPort;
  const available = await isPortAvailable(requestedPort);

  if (!available) {
    activePort = await findAvailablePort(requestedPort + 1);
    // Yellow warning matching Next.js CLI style
    console.warn(`\x1b[33m⚠ Port ${requestedPort} is in use, using available port ${activePort} instead.\x1b[0m\n`);
  }

  const nextBin = require.resolve('next/dist/bin/next');
  const spawnArgs = [nextBin, mode, '-p', String(activePort), ...filteredArgs];

  const child = spawn(process.execPath, spawnArgs, {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: String(activePort),
    },
  });

  const forwardSignal = (sig) => {
    if (child && !child.killed) {
      child.kill(sig);
    }
  };

  process.on('SIGINT', () => forwardSignal('SIGINT'));
  process.on('SIGTERM', () => forwardSignal('SIGTERM'));

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });
}

main().catch((err) => {
  console.error('\x1b[31m⨯\x1b[0m', err.message || err);
  process.exit(1);
});
