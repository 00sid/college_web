import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../index";

export const getResearchData = async () => {
  try {
    // console.log("Fetching Research Data:");

    const menuRef = collection(db, "Research Data");

    // Simple query without orderBy to avoid index requirements
    const q = query(menuRef, where("isApproved", "==", true));

    const querySnapshot = await getDocs(q);
    // console.log("Query snapshot size:", querySnapshot.size);

    const items = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const sortedItems = items.sort((a, b) => {
      const dateA = a.approvedTime ? new Date(a.approvedTime) : new Date(0);
      const dateB = b.approvedTime ? new Date(b.apovedTime) : new Date(0);

      return dateB - dateA; // newest first
    });

    // console.log("Fetched and sorted items:", sortedItems);
    return sortedItems;
  } catch (error) {
    // console.error("Error in getMenuItemsByCategory:", error);

    // More specific error messages
    if (error.code === "failed-precondition") {
      throw new Error(
        "Firestore index required. Click the link in browser console or remove orderBy from query."
      );
    } else if (error.code === "permission-denied") {
      throw new Error("Permission denied. Check Firestore security rules.");
    } else if (error.code === "not-found") {
      throw new Error(
        'Collection not found. Make sure "menuItems" collection exists.'
      );
    } else {
      throw new Error(`Failed to fetch menu items: ${error.message}`);
    }
  }
};
