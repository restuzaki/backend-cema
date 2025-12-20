const { GoogleGenerativeAI } = require("@google/generative-ai");

const WORK_START_HOUR = 9;
const WORK_END_HOUR = 17;

function isWorkingHours() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  if (day === 0 || day === 6) return false;
  return hour >= WORK_START_HOUR && hour < WORK_END_HOUR;
}

function isRecent(timestamp) {
  if (!timestamp) return false;
  const diff = Date.now() - new Date(timestamp).getTime();
  return diff < 60000;
}

async function getChatHistory(messagesRef) {
  try {
    const snapshot = await messagesRef.limitToLast(10).once("value");
    let history = "";

    snapshot.forEach((child) => {
      const msg = child.val();

      if (msg.text && !msg.text.includes("Maaf, saya sedang mengalami")) {
        const role = msg.sender === "user" ? "User" : "Customer Service";
        history += `${role}: ${msg.text}\n`;
      }
    });
    return history;
  } catch (error) {
    console.error("Gagal mengambil history:", error);
    return "";
  }
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function generateAIResponse(currentMessage, historyContext) {
  try {
    const prompt = `
    Peran: Customer Service AI untuk Cema Design (Interior & Arsitektur).
    Gaya Bahasa: Sopan, Profesional, dan Bahasa Indonesia yang baik.

    PENTING - ATURAN SAPAAN:
    1. DILARANG KERAS menggunakan sapaan waktu (seperti "Selamat Pagi", "Selamat Siang", "Selamat Malam"). 
    2. Cukup gunakan "Halo" atau "Selamat Datang".

    KONTEKS PERCAKAPAN TERAKHIR:
    ${historyContext}

    LOGIKA RESPON:
    - Jika ini pesan pertama (history kosong/sedikit): Sapa netral, infokan admin OFFLINE, tawarkan bantuan.
    - Jika ini pesan lanjutan (sedang ngobrol): JANGAN mengulang intro "Admin offline". Langsung jawab pertanyaan user secara ringkas & solutif.

    User Bertanya: "${currentMessage}"
    
    Jawaban Kamu (CS):
    `.trim();

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "Maaf, saya sedang mengalami gangguan sistem sementara.";
  }
}

const startChatBot = (db) => {
  console.log("🤖 Bot AI Monitoring Chat Started... (Anti-Spam Fixed)");
  const chatsRef = db.ref("chats");

  const processedMessageIds = new Set();

  chatsRef.limitToLast(50).on("child_added", (sessionSnapshot) => {
    const sessionId = sessionSnapshot.key;
    const messagesRef = db.ref(`chats/${sessionId}/messages`);

    messagesRef.limitToLast(1).on("child_added", async (snapshot) => {
      const msg = snapshot.val();
      const msgKey = snapshot.key;
      const uniqueId = `${sessionId}_${msgKey}`;

      if (processedMessageIds.has(uniqueId)) return;

      processedMessageIds.add(uniqueId);

      if (processedMessageIds.size > 5000) {
        processedMessageIds.clear();
      }

      if (
        msg.sender === "user" &&
        !isWorkingHours() &&
        isRecent(msg.timestamp)
      ) {
        const historyContext = await getChatHistory(messagesRef);

        const aiText = await generateAIResponse(msg.text, historyContext);
        const now = new Date();

        await messagesRef.push({
          sender: "agent",
          text: aiText + " (🤖 AI Response - Diluar Jam Kerja)",
          time: now.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          timestamp: now.toISOString(),
        });

        db.ref(`chats/${sessionId}/meta`).update({
          lastMessage: "🤖 " + aiText.substring(0, 30) + "...",
        });
      }
    });

    messagesRef.on("child_changed", async (snapshot) => {
      const msg = snapshot.val();
      const msgKey = snapshot.key;

      if (msg.sender === "user") {
        console.log(`Pesan diedit oleh user: ${msg.text}`);

        const nextMsgQuery = messagesRef
          .orderByKey()
          .startAfter(msgKey)
          .limitToFirst(1);

        try {
          const nextSnap = await nextMsgQuery.once("value");
          nextSnap.forEach(async (childSnap) => {
            const nextMsg = childSnap.val();
            if (nextMsg.sender === "agent") {
              await childSnap.ref.remove();
            }
          });
        } catch (error) {
          console.error("Gagal menghapus pesan lama:", error);
        }

        if (!isWorkingHours()) {
          try {
            const historyContext = await getChatHistory(messagesRef);
            const newAiResponse = await generateAIResponse(
              msg.text,
              historyContext
            );
            const now = new Date();

            await messagesRef.push({
              sender: "agent",
              text: newAiResponse + " (🤖 AI Response - Diluar Jam Kerja)",
              time: now.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              timestamp: now.toISOString(),
            });

            db.ref(`chats/${sessionId}/meta`).update({
              lastMessage: "🤖 " + newAiResponse.substring(0, 30) + "...",
            });

            console.log("Jawaban AI diperbarui (Edited).");
          } catch (error) {
            console.error("Error generating new AI response:", error);
          }
        }
      }
    });
  });
};

module.exports = startChatBot;
