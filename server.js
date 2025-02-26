import http from "http";

const PORT = process.env.PORT || 3000;

// Simulated database with multiple resources
let resources = [];
let idCounter = 1; // Simulating unique IDs

const server = http.createServer((req, res) => {
  const method = req.method;
  const url = req.url;

  // Function to calculate and set Content-Length
  const sendResponse = (res, statusCode, body) => {
    const bodyString = JSON.stringify(body);
    res.setHeader("Content-Length", Buffer.byteLength(bodyString));
    res.writeHead(statusCode);
    res.end(bodyString);
  };

  // Set common headers
  res.setHeader("Content-Type", "application/json");

  // Function to collect request body data
  const collectRequestBody = (callback) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => callback(body));
  };

  // Handle API requests
  if (url.startsWith("/resources")) {
    const parts = url.split("/");
    const id = parts.length === 3 ? parseInt(parts[2]) : null;

    switch (method) {
      case "GET":
        if (id) {
          const resource = resources.find((r) => r.id === id);
          if (resource) sendResponse(res, 200, resource);
          else sendResponse(res, 404, { error: "Resource not found" });
        } else {
          sendResponse(res, 200, resources);
        }
        break;

      case "POST":
        collectRequestBody((body) => {
          try {
            const newResource = JSON.parse(body);
            newResource.id = idCounter++; // Assign a unique ID
            resources.push(newResource);
            sendResponse(res, 201, { created: newResource });
          } catch (err) {
            sendResponse(res, 400, { error: "Invalid JSON" });
          }
        });
        break;

      case "PUT":
        if (!id) {
          sendResponse(res, 400, { error: "PUT requires an ID" });
          return;
        }
        collectRequestBody((body) => {
          try {
            const updatedData = JSON.parse(body);
            let index = resources.findIndex((r) => r.id === id);
            if (index !== -1) {
              resources[index] = { id, ...updatedData }; // Completely replace
              sendResponse(res, 200, { updated: resources[index] });
            } else {
              sendResponse(res, 404, { error: "Resource not found" });
            }
          } catch (err) {
            sendResponse(res, 400, { error: "Invalid JSON" });
          }
        });
        break;

      case "PATCH":
        if (!id) {
          sendResponse(res, 400, { error: "PATCH requires an ID" });
          return;
        }
        collectRequestBody((body) => {
          try {
            const patchData = JSON.parse(body);
            let resource = resources.find((r) => r.id === id);
            if (resource) {
              Object.assign(resource, patchData); // Merge partial updates
              sendResponse(res, 200, { patched: resource });
            } else {
              sendResponse(res, 404, { error: "Resource not found" });
            }
          } catch (err) {
            sendResponse(res, 400, { error: "Invalid JSON" });
          }
        });
        break;

      case "DELETE":
        if (!id) {
          sendResponse(res, 400, { error: "DELETE requires an ID" });
          return;
        }
        let index = resources.findIndex((r) => r.id === id);
        if (index !== -1) {
          resources.splice(index, 1);
          sendResponse(res, 200, { deleted: true });
        } else {
          sendResponse(res, 404, { error: "Resource not found" });
        }
        break;

      default:
        sendResponse(res, 405, { error: "Method Not Allowed" });
    }
  } else {
    sendResponse(res, 404, { error: "Endpoint not found" });
  }
});

server.listen(PORT, () => {
  console.log(`API server is running on port ${PORT}`);
});
