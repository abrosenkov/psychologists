import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,

  headers: {
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  },
});

export default api;