#!/usr/bin/env node

/**
 * Wait for Docker container to be healthy before proceeding
 * Cross-platform alternative to sleep command
 */

import { execSync } from 'child_process';

const CONTAINER_NAME = 'seniorproject-db';
const MAX_WAIT_TIME = 60000; // 60 seconds
const CHECK_INTERVAL = 2000; // 2 seconds

console.log(`Waiting for ${CONTAINER_NAME} to be healthy...`);

const startTime = Date.now();

function checkHealth() {
  try {
    const result = execSync(
      `docker inspect --format='{{.State.Health.Status}}' ${CONTAINER_NAME}`,
      { encoding: 'utf-8' }
    ).trim();
    
    return result === 'healthy';
  } catch (error) {
    // Container might not exist yet
    return false;
  }
}

function checkRunning() {
  try {
    const result = execSync(
      `docker inspect --format='{{.State.Running}}' ${CONTAINER_NAME}`,
      { encoding: 'utf-8' }
    ).trim();
    
    return result === 'true';
  } catch (error) {
    return false;
  }
}

function wait() {
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed > MAX_WAIT_TIME) {
        clearInterval(interval);
        reject(new Error(`Timeout: Container did not become healthy within ${MAX_WAIT_TIME / 1000} seconds`));
        return;
      }
      
      const isHealthy = checkHealth();
      const isRunning = checkRunning();
      
      if (isHealthy) {
        clearInterval(interval);
        console.log('✓ Database is healthy and ready!');
        resolve();
      } else if (isRunning) {
        process.stdout.write('.');
      } else {
        process.stdout.write('⏳');
      }
    }, CHECK_INTERVAL);
  });
}

wait()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌', error.message);
    console.error('Try running: docker-compose logs postgres');
    process.exit(1);
  });
