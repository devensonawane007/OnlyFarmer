import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const getAllCropPrices = () => {
  return API.get("/price/all");
};

export default API;

// 🚛 Truck APIs
export const getAvailableTrucks = () => API.get("/trucks/available");
export const bookTruck = (data) => API.post("/trucks/book", data);

// 🌱 Tips of the Day API  ✅ (ADDED)
export const getTipOfTheDay = () => API.get("/tips/today");
