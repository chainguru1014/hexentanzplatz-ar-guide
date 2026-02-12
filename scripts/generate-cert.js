/**
 * Generate self-signed SSL certificates for local development
 * Uses Node.js built-in crypto module - no external dependencies required
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const certPath = path.join(__dirname, "..", "localhost.pem");
const keyPath = path.join(__dirname, "..", "localhost-key.pem");

// Try mkcert first (best option - trusted certificates, no browser warnings)
function tryMkcert() {
  try {
    execSync("mkcert -version", { stdio: "ignore" });
    console.log("✅ Found mkcert - generating trusted certificate...\n");
    
    // Install CA if needed (safe to run multiple times)
    try {
      execSync("mkcert -install", { stdio: "inherit" });
    } catch (e) {
      // CA might already be installed, that's fine
    }
    
    // Generate certificate in project root
    const projectRoot = path.join(__dirname, "..");
    execSync(`mkcert localhost`, { stdio: "inherit", cwd: projectRoot });
    
    // mkcert creates files in current directory
    const files = fs.readdirSync(projectRoot);
    const certFile = files.find(f => 
      f.startsWith("localhost") && 
      f.endsWith(".pem") && 
      !f.includes("-key")
    );
    const keyFile = files.find(f => 
      f.includes("localhost") && 
      f.includes("-key") && 
      f.endsWith(".pem")
    );
    
    if (certFile && keyFile && certFile !== "localhost.pem") {
      // Rename if mkcert used a different naming (localhost+1.pem, etc.)
      fs.renameSync(
        path.join(projectRoot, certFile),
        certPath
      );
    }
    if (keyFile && keyFile !== "localhost-key.pem") {
      fs.renameSync(
        path.join(projectRoot, keyFile),
        keyPath
      );
    }
    
    console.log("\n✅ Trusted certificate generated with mkcert!");
    console.log(`   Certificate: ${certPath}`);
    console.log(`   Private key: ${keyPath}`);
    console.log("\n✅ No browser warnings - certificate is trusted!\n");
    return true;
  } catch (error) {
    return false;
  }
}

// Try OpenSSL (self-signed, browser will show warning)
function tryOpenSSL() {
  try {
    execSync("openssl version", { stdio: "ignore" });
    console.log("✅ Found OpenSSL - generating self-signed certificate...\n");
    
    execSync(
      `openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj "/CN=localhost" -keyout "${keyPath}" -out "${certPath}" -days 365`,
      { stdio: "inherit" }
    );
    
    console.log("\n✅ Self-signed certificate generated!");
    console.log(`   Certificate: ${certPath}`);
    console.log(`   Private key: ${keyPath}`);
    console.log("\n⚠️  Note: Browser will show a security warning.");
    console.log("   Click 'Advanced' → 'Proceed to localhost' to continue.\n");
    return true;
  } catch (error) {
    return false;
  }
}

// Main execution
console.log("🔐 SSL Certificate Generator\n");
console.log("Attempting to generate certificates...\n");

if (tryMkcert()) {
  // Success!
} else if (tryOpenSSL()) {
  // Success with OpenSSL
} else {
  console.error("❌ Could not generate certificates automatically.\n");
  console.error("Please install one of the following tools:\n");
  
  console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.error("Option 1: mkcert (Recommended - No browser warnings)");
  console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.error("Windows:");
  console.error("  1. Install via Chocolatey: choco install mkcert");
  console.error("  2. Or download from: https://github.com/FiloSottile/mkcert/releases");
  console.error("  3. Run: mkcert -install");
  console.error("  4. Run: mkcert localhost");
  console.error("  5. Run this script again: yarn cert:generate\n");
  
  console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.error("Option 2: OpenSSL (Self-signed - Browser warning)");
  console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.error("Windows:");
  console.error("  1. Install via Chocolatey: choco install openssl");
  console.error("  2. Or download from: https://slproweb.com/products/Win32OpenSSL.html");
  console.error("  3. Add OpenSSL to PATH");
  console.error("  4. Run this script again: yarn cert:generate\n");
  
  console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.error("Option 3: Manual Certificate Generation");
  console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.error("If you have OpenSSL installed, run manually:");
  console.error(`  openssl req -x509 -newkey rsa:2048 -nodes -sha256 \\`);
  console.error(`    -subj "/CN=localhost" \\`);
  console.error(`    -keyout "${keyPath}" \\`);
  console.error(`    -out "${certPath}" \\`);
  console.error(`    -days 365\n`);
  
  process.exit(1);
}
