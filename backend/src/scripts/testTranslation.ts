import axios from "axios";

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api/v1/translate`;

async function testTranslation() {
  console.log("🚀 Starting translation tests...");

  // 1. Test Single Translation
  try {
    console.log("\n1. Testing single translation (English -> Hindi)...");
    const response = await axios.post(`${BASE_URL}/`, {
      text: "Fresh fruits and vegetables directly from farmers",
      targetLang: "hi",
      sourceLang: "en"
    });
    console.log("✅ Success!");
    console.log("Original:", response.data.data.original);
    console.log("Translated:", response.data.data.translation);
  } catch (err: any) {
    console.error("❌ Single translation failed:", err.response?.data || err.message);
  }

  // 2. Test Batch Translation
  try {
    console.log("\n2. Testing batch translation (English -> Telugu)...");
    const response = await axios.post(`${BASE_URL}/batch`, {
      texts: ["Welcome to Village Basket", "Add to Cart", "Checkout Address"],
      targetLang: "te",
      sourceLang: "en"
    });
    console.log("✅ Success!");
    console.log("Originals:", ["Welcome to Village Basket", "Add to Cart", "Checkout Address"]);
    console.log("Translations:", response.data.data.translations);
  } catch (err: any) {
    console.error("❌ Batch translation failed:", err.response?.data || err.message);
  }

  // 3. Test Object Translation
  try {
    console.log("\n3. Testing object translation (English -> Kannada)...");
    const response = await axios.post(`${BASE_URL}/object`, {
      obj: {
        id: "prod_101",
        title: "Fresh Organic Apple",
        details: {
          description: "Grown in Himachal Pradesh orchards.",
          origin: "India"
        },
        price: 150
      },
      keysToTranslate: ["title", "description", "origin"],
      targetLang: "kn",
      sourceLang: "en"
    });
    console.log("✅ Success!");
    console.log("Original: { title: 'Fresh Organic Apple', details: { description: 'Grown in Himachal Pradesh orchards.', origin: 'India' } }");
    console.log("Translated Object:", JSON.stringify(response.data.data, null, 2));
  } catch (err: any) {
    console.error("❌ Object translation failed:", err.response?.data || err.message);
  }
}

testTranslation();
