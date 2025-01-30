import axios from "axios";

const XENDIT_API_URL = "https://api.xendit.co";
const XENDIT_SECRET_KEY = process.env.VITE_XENDIT_SECRET_KEY;

const xenditAxios = axios.create({
  baseURL: XENDIT_API_URL,
  headers: {
    Authorization: `Basic ${Buffer.from(XENDIT_SECRET_KEY + ":").toString("base64")}`,
    "Content-Type": "application/json",
  },
});

export const createXenditCustomer = async (name, email) => {
  try {
    const response = await xenditAxios.post("/customers", {
        reference_id: `cust-${Date.now()}`,
        type: "INDIVIDUAL",
        individual_detail: {
          given_names: name,
        },
        email,
        description: "POS System customer",
      });
      return response.data;
  } catch (error) {
    console.error("Xendit API Error:", error.response?.data || error);
    throw new Error(error.response?.data?.message || "Failed to create customer");
  }
};
