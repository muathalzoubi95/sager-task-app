#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function deployBuild() {
  try {
    console.log('🏗️  Building frontend for deployment...');
    await execAsync('vite build');
    console.log('✅ Frontend build completed');
    
    console.log('🏗️  Building server for deployment...');
    // Use direct esbuild command without --packages=external
    // Bundle most dependencies but keep some critical ones external
    const command = `esbuild server/index.ts --platform=node --bundle --format=esm --outdir=dist --external:fsevents --external:lightningcss --external:@babel/preset-typescript --external:@babel/core --external:bufferutil --external:utf-8-validate --target=node18 --minify`;
    
    await execAsync(command);
    console.log('✅ Server build completed');
    
    console.log('🎉 Deployment build completed successfully!');
    console.log('📁 Built files:');
    console.log('   - Frontend: dist/public/');
    console.log('   - Server: dist/index.js');
  } catch (error) {
    console.error('❌ Deployment build failed:', error.message);
    process.exit(1);
  }
}

deployBuild();