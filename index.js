import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

// 🔑 CONFIGURACIÓN
const VERIFY_TOKEN = "william"; // tu token de verificación
const WHATSAPP_TOKEN = "EAATQFXBCKs8BPZB1XvIwszEMXtgp9btk5QCVQ3Epf8HOkdUAtNI88VDLZB1gp4L4TZChIWrZByGemBp86cfdnZASxEAlFWmKZC0KmTtGWtptRS1FMYFDj28W3q7mGgjoyiN3cuwsiRcMVFTTB8CxZAmQaltiI3i04bDLuWZCCZCirOkdPTUdrYVAtNBykar3xTRjIZByjPHZAwTMU0gcWfZAXInrp8JEIXYsduSSs042ijUbqgI3FEZAbMPsILOZCEC7h65jW38I1g96K6iFZAYHf3YC4Rh"; // 

// 🌐 VERIFICAR WEBHOOK
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ WEBHOOK_VERIFICADO");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// 📩 RECIBIR MENSAJES
app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;

    if (body.object) {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (message) {
        const from = message.from; // número del usuario
        const type = message.type;
        const text = message.text?.body || "";

        console.log("📨 Mensaje recibido:", text);

        // Si el usuario presionó un botón, vendrá en interactive
        if (message.interactive) {
          const buttonReply = message.interactive.button_reply?.id;
          console.log("🟢 Botón presionado:", buttonReply);

          // Manejo de respuestas de botones
          if (buttonReply === "servicios") {
            await enviarBotones(from, "🔧 Elige un servicio:", [
              { id: "reparacion", title: "Reparación" },
              { id: "cambio_banda", title: "Cambio de banda" },
            ]);
          } else if (buttonReply === "productos") {
            await enviarBotones(from, "📱 ¿Qué tipo de producto buscas?", [
              { id: "celulares", title: "Celulares" },
              { id: "tablets", title: "Tablets" },
              { id: "relojes", title: "Relojes" },
            ]);
          } else if (
            ["celulares", "tablets", "relojes"].includes(buttonReply)
          ) {
            await enviarBotones(from, "🛒 Elige una marca:", [
              { id: "oppo", title: "Oppo" },
              { id: "iphone", title: "iPhone" },
              { id: "samsung", title: "Samsung" },
            ]);
          } else if (
            ["reparacion", "cambio_banda"].includes(buttonReply)
          ) {
            await enviarTexto(from, "✅ Gracias, en breve te contactaremos.");
          } else if (["oppo", "iphone", "samsung"].includes(buttonReply)) {
            await enviarTexto(from, `Excelente elección 😎. Tenemos ofertas en ${buttonReply.toUpperCase()}.`);
          }
        } else {
          // Primer mensaje de bienvenida
          await enviarBotones(from, "👋 Hola, bienvenido a *Celulares el Bot*.\nPor favor elige una opción:", [
            { id: "productos", title: "Productos" },
            { id: "servicios", title: "Servicios" },
          ]);
        }
      }

      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error("❌ Error procesando mensaje:", error);
    res.sendStatus(500);
  }
});

// 💬 FUNCIONES DE ENVÍO

async function enviarTexto(to, texto) {
  await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      text: { body: texto },
    }),
  });
}

async function enviarBotones(to, texto, botones) {
  await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: texto },
        action: {
          buttons: botones.map((b) => ({
            type: "reply",
            reply: { id: b.id, title: b.title },
          })),
        },
      },
    }),
  });
}

// 🚀 INICIAR SERVIDOR
app.listen(3000, () => console.log("🚀 Servidor ejecutándose en puerto 3000"));