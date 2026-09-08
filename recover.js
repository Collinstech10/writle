const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const deploymentId = "dpl_ExnZuKGvqUqmTWgZcB13nGbVpMX1";

const files = {
  "src/README.md": "f95e4f1e679e42ed51cb4b465bfe80123b80b10e",
  "src/package-lock.json": "6a9e36b3e0c809bc9a68dc61d9528c9814152b98",
  "src/package.json": "62f3d8e3c8990f424d32d94f427ca2c7946642c3",
  "src/public/index.html": "3e1f3898ab5e028f6fd9bb799dfe3499bcc62882",
  "src/public/script.js": "0b6e0b764e490b81cc2fbbb5c3a30ec915cdabd9",
  "src/public/styles.css": "e4c218f95e7dee374b9ceb512ad97cc65e1759c0",
  "src/public/view.html": "c7f1427f68230faf1e77ffa218ff4c69c25f8cbd",
  "src/server.js": "75dc5d375141d394b533dc7ad49f4d33e414a658"
};

console.log("Starting Writele recovery...\n");

for (const [filePath, fileUid] of Object.entries(files)) {
  console.log(`Recovering ${filePath}...`);

  try {
    const endpoint =
      `/v8/deployments/${deploymentId}/files/${fileUid}`;

    const command =
      `vercel api "${endpoint}" --raw`;

    const result = execSync(command, {
      encoding: "utf8",
      maxBuffer: 100 * 1024 * 1024
    });

    const json = JSON.parse(result);
    const base64 = json.data;

    if (!base64) {
      throw new Error("No file data returned");
    }

    const outputPath = path.join(process.cwd(), filePath);

    fs.mkdirSync(path.dirname(outputPath), {
      recursive: true
    });

    fs.writeFileSync(
      outputPath,
      Buffer.from(base64, "base64")
    );

    console.log(`✓ ${filePath}`);
  } catch (error) {
    console.log(`✗ ${filePath}`);
    console.log(error.message);
  }
}

console.log("\n=================================");
console.log("Writele recovery finished!");
console.log("=================================");
console.log(
  `\nRecovered files are in:\n${path.join(process.cwd(), "src")}`
);