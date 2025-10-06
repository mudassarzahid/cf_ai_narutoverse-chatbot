import fs from "fs";
import path from "path";

const CHUNK_SIZE = 2;
const WORKER_URL = "http://localhost:8787/api/import-characters";

async function main() {
  const inputFile = "scripts/naruto-characters.json";

  try {
    const jsonData = fs.readFileSync(path.resolve(inputFile), "utf8");
    const characters = JSON.parse(jsonData);
    const totalChunks = Math.ceil(characters.length / CHUNK_SIZE);

    for (let i = 0; i < characters.length; i += CHUNK_SIZE) {
      const chunkNumber = i / CHUNK_SIZE + 1;
      const chunk = characters.slice(i, i + CHUNK_SIZE);
      console.log(`\nUploading chunk ${chunkNumber} of ${totalChunks}`);

      const response = await fetch(WORKER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(chunk)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! Status: ${response.status}. Body: ${errorText}`
        );
      }

      const result = await response.json();
      console.log(
        `Success for chunk ${chunkNumber}. Inserted ${result.count} records.`
      );
    }
    console.log("Uploaded and imported all data.");
  } catch (error) {
    console.error("Error occurred during the upload process:", error.message);
    process.exit(1);
  }
}

main();
