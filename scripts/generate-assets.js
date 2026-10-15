const sharp = require('sharp');
const fs = require('fs');

async function main() {
  const src = 'C:/Users/atish/.gemini/antigravity/brain/3408c212-add6-4b45-8479-ae94c8718638/.user_uploaded/media_1792033450919_47cd4223.jpg';
  
  // 1. Copy original jpg to public/logo.jpg
  fs.copyFileSync(src, 'public/logo.jpg');
  console.log('Copied to public/logo.jpg');

  // 2. Convert to real PNG
  await sharp(src).png().toFile('public/icon.png');
  console.log('Generated public/icon.png');
  await sharp(src).png().toFile('public/logo.png');
  console.log('Generated public/logo.png');

  // 3. Generate SVG wrapping image
  const base64 = fs.readFileSync(src).toString('base64');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <clipPath id="rounded">
      <rect width="512" height="512" rx="112" />
    </clipPath>
  </defs>
  <image width="512" height="512" href="data:image/jpeg;base64,${base64}" clip-path="url(#rounded)" preserveAspectRatio="xMidYMid slice" />
</svg>
`;
  fs.writeFileSync('public/icon.svg', svg);
  console.log('Generated public/icon.svg');
}

main().catch(console.error);
