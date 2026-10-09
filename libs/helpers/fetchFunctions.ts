import axios from "axios";

export const getItemDetails = async (itemId: string) =>
	await axios.get("/api/items/" + itemId);
