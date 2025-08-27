import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function buildServer() {
  try {
    // Use esbuild directly with external flags for problematic packages
    const external = [
      'lightningcss',
      '@babel/preset-typescript',
      '@babel/core',
      'fsevents',
      'bufferutil',
      'utf-8-validate'
    ].map(pkg => `--external:${pkg}`).join(' ');
    
    const command = `npx esbuild server/index.ts --platform=node --bundle --format=esm --outfile=dist/index.js ${external} --minify=${process.env.NODE_ENV === 'production'}`;
    await execAsync(command);
    
    console.log('✅ Server build completed successfully');
  } catch (error) {
    console.error('❌ Server build failed:', error);
    process.exit(1);
  }
}

buildServer();