// import { db } from "./src/lib/firebase.js"; // Path from project root
// import { doc, setDoc } from "firebase/firestore";
// import { Timestamp } from "firebase/firestore";
// import fs from "fs/promises";

// // Define collections and their JSON file paths
// const collections = [
//   { name: "masterData", file: "./src/data/masterData.json" },
// ];

// // Function to convert ISO strings to Firestore Timestamps
// const convertTimestamps = (data) => {
//   const result = { ...data };
//   if (result.updatedAt) result.updatedAt = Timestamp.fromDate(new Date(result.updatedAt));
//   if (result.createdOnModelDate) result.createdOnModelDate = Timestamp.fromDate(new Date(result.createdOnModelDate));
//   if (result.originalPublishedDate) result.originalPublishedDate = Timestamp.fromDate(new Date(result.originalPublishedDate));
//   return result;
// };

// // Main function to populate Firestore
// async function populateFirestore() {
//   try {
//     for (const { name, file } of collections) {
//       console.log(`Populating ${name} collection...`);
//       const jsonData = await fs.readFile(file, "utf-8");
//       const data = JSON.parse(jsonData);

//       for (const [id, value] of Object.entries(data)) {
//         const convertedData = convertTimestamps(value);
//         await setDoc(doc(db, name, id), convertedData);
//         console.log(`Added ${id} to ${name}`);
//       }
//     }
//     console.log("All collections populated successfully!");
//   } catch (error) {
//     console.error("Error populating Firestore:", error);
//   }
// }

// // Run the population
// populateFirestore();