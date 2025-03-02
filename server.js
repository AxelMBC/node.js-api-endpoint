import http from "http";

const PORT = process.env.PORT || 3000;

// A simple user store (for demonstration only)
const validUsername = "user";
const validPassword = "pass";

// Helper function for basic authentication
const authenticate = (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    res.writeHead(401, {
      "WWW-Authenticate": 'Basic realm="Access to the API"',
    });
    res.end("Unauthorized");
    return false;
  }

  // Decode the credentials
  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString(
    "ascii"
  );
  const [username, password] = credentials.split(":");

  // Check against our stored credentials
  if (username !== validUsername || password !== validPassword) {
    res.writeHead(401, {
      "WWW-Authenticate": 'Basic realm="Access to the API"',
    });
    res.end("Unauthorized");
    return false;
  }
  return true;
};

// Example in-memory "database" for motivational phrases
let phrases = [
  {
    id: 0,
    quote: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
    author: "Desconocido",
    date: new Date().toISOString(),
    category: "éxito",
  },
];
let idCounter = 1; // Unique IDs

const server = http.createServer((req, res) => {
  const method = req.method;
  const url = req.url;
  console.log(`URL: ${url} | Método: ${method}`);

  // Apply basic authentication for all endpoints under /phrases
  if (url.startsWith("/quotes") && !authenticate(req, res)) {
    return; // Stop processing if authentication fails
  }

  // Helper functions for response handling
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

  // Function to collect request body
  const collectRequestBody = (callback) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => callback(body));
  };

  // Routes for motivational phrases
  if (url.startsWith("/quotes")) {
    const parts = url.split("/");
    const id = parts.length === 3 ? parseInt(parts[2]) : null;

    switch (method) {
      case "GET":
        if (id !== null && !isNaN(id)) {
          const phrase = phrases.find((p) => p.id === id);
          if (phrase) sendResponse(res, 200, phrase);
          else sendResponse(res, 404, { error: "Phrase not found" });
        } else {
          sendResponse(res, 200, phrases);
        }
        break;

      case "HEAD":
        if (id !== null && !isNaN(id)) {
          const phrase = phrases.find((p) => p.id === id);
          if (phrase) {
            const bodyString = JSON.stringify(phrase);
            setHeaders(res, 200, bodyString);
            res.end(); // No se envía cuerpo
          } else {
            const bodyString = JSON.stringify({ error: "Frase no encontrada" });
            setHeaders(res, 404, bodyString);
            res.end();
          }
        } else {
          const bodyString = JSON.stringify(phrases);
          setHeaders(res, 200, bodyString);
          res.end();
        }
        break;

      case "POST":
        // Permite agregar una nueva frase motivacional
        collectRequestBody((body) => {
          try {
            const newPhrase = JSON.parse(body);
            // Se requieren al menos los campos 'quote' y 'author'
            if (!newPhrase.quote || !newPhrase.author) {
              sendResponse(res, 400, {
                error: "Se requieren los campos 'quote' y 'author'",
              });
              return;
            }
            const phraseToAdd = {
              id: idCounter++,
              quote: newPhrase.quote,
              author: newPhrase.author,
              date: new Date().toISOString(), // Fecha en que se agregó la frase
              category: newPhrase.category || "general",
            };
            phrases.push(phraseToAdd);
            sendResponse(res, 201, { created: phraseToAdd });
          } catch (err) {
            sendResponse(res, 400, { error: "JSON inválido" });
          }
        });
        break;

      case "PUT":
        if (id === null || isNaN(id)) {
          sendResponse(res, 400, { error: "PUT requiere un ID válido" });
          return;
        }
        collectRequestBody((body) => {
          try {
            const updatedData = JSON.parse(body);
            let index = phrases.findIndex((p) => p.id === id);
            if (index !== -1) {
              // Mantener la fecha original al actualizar
              const existingDate = phrases[index].date;
              phrases[index] = { id, ...updatedData, date: existingDate };
              sendResponse(res, 200, { updated: phrases[index] });
            } else {
              sendResponse(res, 404, { error: "Frase no encontrada" });
            }
          } catch (err) {
            sendResponse(res, 400, { error: "JSON inválido" });
          }
        });
        break;

      case "PATCH":
        if (id === null || isNaN(id)) {
          sendResponse(res, 400, { error: "PATCH requiere un ID válido" });
          return;
        }
        collectRequestBody((body) => {
          try {
            const patchData = JSON.parse(body);
            let phrase = phrases.find((p) => p.id === id);
            if (phrase) {
              Object.assign(phrase, patchData);
              sendResponse(res, 200, { patched: phrase });
            } else {
              sendResponse(res, 404, { error: "Frase no encontrada" });
            }
          } catch (err) {
            sendResponse(res, 400, { error: "JSON inválido" });
          }
        });
        break;

      case "DELETE":
        if (id === null || isNaN(id)) {
          sendResponse(res, 400, { error: "DELETE requiere un ID válido" });
          return;
        }
        let index = phrases.findIndex((p) => p.id === id);
        if (index !== -1) {
          phrases.splice(index, 1);
          sendResponse(res, 200, { deleted: true });
        } else {
          sendResponse(res, 404, { error: "Frase no encontrada" });
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
  console.log(`API is running on port ${PORT}`);
});
