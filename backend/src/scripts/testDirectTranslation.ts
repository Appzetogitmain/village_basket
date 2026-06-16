import { translateText } from "../services/translationService";

async function run() {
  console.log("Direct translation test starting...");
  try {
    const res = await translateText("Hello world", "hi", "en");
    console.log("Result (English -> Hindi):", res);
  } catch (err: any) {
    console.error("Direct translation failed:", err);
  }
}

run();
