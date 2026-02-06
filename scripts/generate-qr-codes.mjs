import QRCode from 'qrcode';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const qrCodesDir = join(projectRoot, 'public', 'qr-codes');

// Create directory if it doesn't exist
await mkdir(qrCodesDir, { recursive: true });

// Generate QR codes for station_id 1-5
for (let i = 1; i <= 5; i++) {
  const stationId = `s${String(i).padStart(2, '0')}`;
  const qrData = stationId; // QR code contains just the station ID
  
  try {
    // Generate QR code as PNG buffer
    const qrBuffer = await QRCode.toBuffer(qrData, {
      errorCorrectionLevel: 'M',
      type: 'png',
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Save to file
    const filename = `qr-${stationId}.png`;
    const filepath = join(qrCodesDir, filename);
    await writeFile(filepath, qrBuffer);
    
    console.log(`✓ Generated ${filename} for station_id ${i} (${stationId})`);
  } catch (error) {
    console.error(`✗ Failed to generate QR code for ${stationId}:`, error);
  }
}

console.log('\n✓ All QR codes generated successfully!');
console.log(`QR codes saved to: ${qrCodesDir}`);
