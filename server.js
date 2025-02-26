import http from "http"; // Node.js core module (like browser APIs, but for servers)
import fs from "fs/promises"; // File system with Promises (no callbacks!)
import url from "url"; // URL parsing (similar to `window.location` but server-side)
import path from "path"; // Path utilities (like frontend `new URL()` but for files)

const { PORT } = process.env || 8080;

const __filename = url.fileURLToPath(import.meta.url); // Converts `file://` to OS path
const __dirname = path.dirname(__filename); // Gets directory path
// console.log(__filename, __dirname);

// Simple Example of server for handling incoming HTTP requests
const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET") {
      let filePath;
      if (req.url === "/") {
        filePath = path.join(__dirname, "public", "index.html");
      } else if (req.url === "/about") {
        filePath = path.join(__dirname, "public", "about.html");
      } else {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.write("<h1>Page not found</h1>");
        res.end();
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      const data = await fs.readFile(filePath);
      res.write(data);
      res.end();
    } else {
      throw new Error("Method not allowed");
    }
  } catch (err) {
    if (err.message === "Method not allowed") {
      res.writeHead(405, { "Content-Type": "text/plain" });
      res.end("Method Not Allowed");
    } else {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Server Error");
    }
  }
});

// listen on a port
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} `);
});
