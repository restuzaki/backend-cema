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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function generateAIResponse(text) {
  try {
    const prompt = `
    Peran: Customer Service AI untuk Cema Design(Interior & Arsitektur).
    Gaya Bahasa: Sopan, Profesional, dan Bahasa Indonesia yang baik.

    PENTING - ATURAN SAPAAN:
    DILARANG KERAS menggunakan sapaan waktu (seperti "Selamat Pagi", "Selamat Siang", "Selamat Sore", atau "Selamat Malam"). Gunakan sapaan netral (contoh: "Halo", "Selamat Datang").

    LOGIKA RESPON:
    1. JIKA PESAN PERTAMA:
    - Sapa user (Netral).
    - Informasikan bahwa admin sedang diluar jam kerja (OOO).
    - Katakan bahwa AI akan berusaha membantu sebaik mungkin.
    - Tawarkan bantuan terkait layanan Cema Design.

    2. PESAN SELANJUTNYA (Follow-up):
    - JANGAN mengulang intro di atas.
    - Langsung jawab poin penting dari pertanyaan user dengan ringkas dan solutif.
    
    Pertanyaan user: "${text}"
    `;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "Maaf, saya sedang mengalami gangguan sistem.";
  }
}

const startChatBot = (db) => {
  console.log("🤖 Bot AI Monitoring Chat Started...");
  const chatsRef = db.ref("chats");

  chatsRef.on("child_added", (sessionSnapshot) => {
    const sessionId = sessionSnapshot.key;
    const messagesRef = db.ref(`chats/${sessionId}/messages`);

    messagesRef.limitToLast(1).on("child_added", async (snapshot) => {
      const msg = snapshot.val();

      if (
        msg.sender === "user" &&
        !isWorkingHours() &&
        isRecent(msg.timestamp)
      ) {
        const aiText = await generateAIResponse(msg.text);
        const now = new Date();

        await messagesRef.push({
          sender: "agent",
          text: aiText + "\n(🤖 AI Response - Diluar Jam Kerja)",
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
            const newAiResponse = await generateAIResponse(msg.text);
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

            console.log("Jawaban AI diperbarui.");
          } catch (error) {
            console.error("Error generating new AI response:", error);
          }
        }
      }
    });
  });
};

module.exports = startChatBot;
