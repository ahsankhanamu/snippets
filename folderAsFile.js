const fs = require('fs');
const path = require('path');

// List of known binary file extensions
const BINARY_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.bmp',
  '.ico',
  '.webp',
  '.mp3',
  '.mp4',
  '.zip',
  '.tar',
  '.gz',
  '.pdf',
];

// Function to check if a file is binary
function isBinaryFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return BINARY_EXTENSIONS.includes(extension);
}

// Function to generate a bash script for replicating the folder structure and content
function generateReplicationScript(folderPath, outputScript, ignoreList = []) {
  // Clear the output file at the beginning
  fs.writeFileSync(outputScript, '');

  let scriptContent = '#!/bin/bash\n\n';
  scriptContent +=
    '# Auto-generated bash script to replicate folder structure and content\n\n';

  // Add the output script to the ignore list to avoid self-replication
  const outputScriptName = path.basename(outputScript);
  if (!ignoreList.includes(outputScriptName)) {
    ignoreList.push(outputScriptName);
  }

  // List to store skipped binary files and their directories
  const skippedFiles = [];

  // Recursive function to traverse the directory
  function traverseDirectory(currentPath, indent = '') {
    const items = fs.readdirSync(currentPath);

    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stat = fs.statSync(itemPath);

      // Skip ignored files and folders
      if (ignoreList.includes(item)) {
        continue;
      }

      if (stat.isDirectory()) {
        // Create directory in the bash script
        scriptContent += `${indent}mkdir -p "${itemPath}"\n`;
        // Recursively traverse the directory
        traverseDirectory(itemPath, indent);
      } else if (stat.isFile()) {
        // Skip binary files
        if (isBinaryFile(itemPath)) {
          skippedFiles.push(itemPath); // Log skipped binary file
          continue;
        }

        // Write file content using a heredoc in the bash script
        scriptContent += `\n${indent}cat << 'EOF' > "${itemPath}"\n`;
        try {
          const content = fs.readFileSync(itemPath, 'utf8');
          scriptContent += content + '\n';
        } catch (err) {
          scriptContent += `${indent}# Error: Could not read file (binary or unsupported encoding)\n`;
        }
        scriptContent += 'EOF\n';
      }
    }
  }

  // Start traversing from the root folder
  traverseDirectory(folderPath);

  // Append the script content to the output file
  fs.appendFileSync(outputScript, scriptContent);

  // Log skipped binary files and their directories
  if (skippedFiles.length > 0) {
    console.log('Skipped binary files:');
    skippedFiles.forEach((file) => {
      console.log(`- ${file}`);
    });
  }

  console.log(`Replication script generated at ${outputScript}`);
  console.log('Make the script executable with: chmod +x ' + outputScript);
}

// Function to display usage instructions
function showUsage() {
  console.log(`
Usage: node generateReplicationScript.js <folder-path> <output-script> [ignore-list]

Arguments:
  <folder-path>    Path to the folder you want to replicate.
  <output-script>  Name of the bash script to generate (e.g., replicate.sh).
  [ignore-list]    Comma-separated list of files/folders to ignore (optional).

Example:
  node generateReplicationScript.js ./my-folder replicate.sh node_modules,.git
`);
}

// Parse command-line arguments
const args = process.argv.slice(2);

// Check if the required arguments are provided
if (args.length < 2) {
  showUsage(); // Display usage instructions
  process.exit(1); // Exit with an error code
}

const defaultIgnores = ['node_modules', '.git', 'package-lock.json'];
const folderPath = args[0];
const outputScript = args[1];
const ignoreList = args[2]
  ? Array.from(new Set([...args[2].split(','), ...defaultIgnores]))
  : defaultIgnores;

// Validate folder path
if (!fs.existsSync(folderPath)) {
  console.error(`Error: The folder path '${folderPath}' does not exist.`);
  showUsage();
  process.exit(1);
}

// Run the script
generateReplicationScript(folderPath, outputScript, ignoreList);
