import http from "http";

const PORT = process.env.PORT || 3000;

let resources = [{ id: 0, toDo: "Buy Clothes", completed: false }];
let idCounter = 1; // Simulating unique IDs

const server = http.createServer((req, res) => {
  const method = req.method;
  const url = req.url;
  console.log(`URL is: ${url} and the REQ Method is: ${method}`)

  const setHeaders = (res, statusCode, body) => {
    res.setHeader("Content-Length", Buffer.byteLength(body));
    res.writeHead(statusCode);
  };

  const sendResponse = (res, statusCode, body) => {
    const bodyString = JSON.stringify(body);
    setHeaders(res, statusCode, bodyString);
    res.end(bodyString);
  };

  res.setHeader("Content-Type", "application/json");

  // Función para recolectar el cuerpo de la solicitud
  const collectRequestBody = (callback) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => callback(body));
  };

  // Manejo de las peticiones API
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

      case "HEAD":
        if (id) {
          const resource = resources.find((r) => r.id === id);
          if (resource) {
            const bodyString = JSON.stringify(resource);
            setHeaders(res, 200, bodyString);
            res.end(); // No se envía cuerpo
          } else {
            const bodyString = JSON.stringify({ error: "Resource not found" });
            setHeaders(res, 404, bodyString);
            res.end();
          }
        } else {
          const bodyString = JSON.stringify(resources);
          setHeaders(res, 200, bodyString);
          res.end();
        }
        break;

      case "POST":
        collectRequestBody((body) => {
          try {
            const newResource = JSON.parse(body);
            newResource.id = idCounter++; // Asigna un ID único
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
              resources[index] = { id, ...updatedData }; // Reemplaza completamente
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
              Object.assign(resource, patchData); // Mezcla las actualizaciones parciales
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
