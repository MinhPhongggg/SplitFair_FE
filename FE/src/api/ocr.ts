import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";

/**
 * Sử dụng OCR.space API với Engine 2 (Model chuyên dụng cho số và hóa đơn).
 * Engine 2 nhận diện số tốt hơn nhiều so với Engine 1.
 */
export const scanReceipt = async (imageUri: string): Promise<string | null> => {
  console.log("Scanning receipt with OCR.space Engine 2:", imageUri);

  const API_KEY = "helloworld";

  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const formData = new FormData();
    formData.append("base64Image", `data:image/jpeg;base64,${base64}`);
    formData.append("language", "eng");
    formData.append("isOverlayRequired", "false");
    formData.append("apikey", API_KEY);

    formData.append("OCREngine", "2");
    formData.append("scale", "true");
    formData.append("detectOrientation", "true");

    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.IsErroredOnProcessing) {
      const errorMessage = Array.isArray(data.ErrorMessage)
        ? data.ErrorMessage.join(", ")
        : data.ErrorMessage;
      console.error("OCR Error:", errorMessage);
      throw new Error(errorMessage || "OCR processing failed");
    }

    if (data.ParsedResults && data.ParsedResults.length > 0) {
      const text = data.ParsedResults[0].ParsedText;
      console.log("OCR Text:", text);
      return extractTotalAmount(text);
    }

    return null;
  } catch (error) {
    console.error("Scan failed:", error);
    throw error;
  }
};

/**
 * Thuật toán tìm tổng tiền từ văn bản OCR (Cải tiến với hệ thống tính điểm)
 */
const extractTotalAmount = (text: string): string | null => {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const totalKeywords = [
    "tong",
    "total",
    "t.cong",
    "cong",
    "thanh toan",
    "tien mat",
    "amount",
    "phai tra",
    "vnd",
    "d",
    "payment",
    "grand",
  ];
  const ignoreKeywords = [
    "dt:",
    "tel",
    "phone",
    "ngay",
    "date",
    "gio",
    "time",
    "mst",
    "tax",
    "ban:",
    "table",
    "khach",
    "so:",
  ];

  let bestCandidate = { amount: 0, score: 0 };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    const hasIgnore = ignoreKeywords.some((k) => lowerLine.includes(k));

    const hasTotal = totalKeywords.some((k) => lowerLine.includes(k));

    if (hasIgnore && !hasTotal) continue;

    const matches = line.match(/(\d{1,3}[., ]?)+/g);
    if (!matches) continue;

    for (const match of matches) {
      const cleanStr = match.replace(/[^\d]/g, "");
      const num = parseFloat(cleanStr);

      if (num < 1000 || num > 200000000) continue;

      if (cleanStr.startsWith("0") && cleanStr.length >= 9) continue;

      if ((num === 2023 || num === 2024 || num === 2025) && !hasTotal) continue;

      let score = 0;

      if (i > lines.length * 0.7) score += 2;
      else if (i > lines.length * 0.4) score += 1;

      if (hasTotal) score += 5;

      if (i > 0) {
        const prevLine = lines[i - 1].toLowerCase();
        if (totalKeywords.some((k) => prevLine.includes(k))) score += 3;
      }

      if (num % 1000 === 0) score += 2;
      else if (num % 500 === 0) score += 1;

      if (score > bestCandidate.score) {
        bestCandidate = { amount: num, score };
      } else if (score === bestCandidate.score) {
        if (num > bestCandidate.amount) {
          bestCandidate = { amount: num, score };
        }
      }
    }
  }

  return bestCandidate.amount > 0 ? bestCandidate.amount.toString() : null;
};

export const pickImage = async (): Promise<string | null> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    alert("Cần quyền truy cập thư viện ảnh!");
    return null;
  }

  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 0.7,
    base64: false,
  });

  if (!result.canceled) {
    return result.assets[0].uri;
  }
  return null;
};

export const takePhoto = async (): Promise<string | null> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    alert("Cần quyền truy cập camera!");
    return null;
  }

  let result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    quality: 0.7,
    base64: false,
  });

  if (!result.canceled) {
    return result.assets[0].uri;
  }
  return null;
};
