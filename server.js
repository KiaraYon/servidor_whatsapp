const express = require("express");
const app = express();
const venom = require("venom-bot");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");

const sessionPath = path.join(__dirname, "sessions", "tokens");
const logFile = path.join(__dirname, "debug.log");

if (!fs.existsSync(sessionPath)) {
  fs.mkdirSync(sessionPath, { recursive: true });
  fs.appendFileSync(
    logFile,
    `Session path created at ${new Date().toISOString()}: ${sessionPath}\n`
  );
}

let clientInstance;

venom
  .create(
    "sessionName", // Nombre de la sesión
    (base64Qrimg, asciiQR, attempts, urlCode) => {
      fs.appendFileSync(
        logFile,
        `QR Code generated at ${new Date().toISOString()}\n`
      );
      console.log(asciiQR);
    },
    undefined,
    {
      folderNameToken: "tokens",
      mkdirFolderToken: sessionPath,
      headless: "new",
      useChrome: false,
      browserArgs: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    }
  )
  .then((client) => {
    clientInstance = client;
    console.log("Venom client created and connected");
  })
  .catch((error) => {
    fs.appendFileSync(
      logFile,
      `Error creating venom client at ${new Date().toISOString()}: ${error}\n`
    );
    console.log("Error creating venom client:", error);
  });

app.use(bodyParser.json());

app.post("/send-message", async (req, res) => {
  const { phoneNumber, message } = req.body;
  if (!clientInstance) {
    return res.status(500).json({ error: "Client not initialized" });
  }

  try {
    const formattedNumber = `502${phoneNumber}@c.us`;
    fs.appendFileSync(
      logFile,
      `Sending message to ${formattedNumber} at ${new Date().toISOString()}: ${message}\n`
    );
    console.log(`Sending message to ${formattedNumber}: ${message}`);
    await clientInstance.sendText(formattedNumber, message);
    fs.appendFileSync(
      logFile,
      `Message sent to ${formattedNumber} at ${new Date().toISOString()}\n`
    );
    console.log("Message sent to", formattedNumber);
    res.json({ message: "Message sent!" });
  } catch (error) {
    fs.appendFileSync(
      logFile,
      `Error sending notification at ${new Date().toISOString()}: ${error}\n`
    );
    console.error("Error sending notification:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
