// Import the function that generates sample restaurants and reviews for testing.
import { generateFakeRestaurantsAndReviews } from "@/src/lib/fakeRestaurants.js";

// Import the Firestore functions used to read, write, query, and listen for database changes.
import {
  collection, // Reference a collection of documents in Firestore.
  onSnapshot, // Listen for real-time changes to documents or query results.
  query, // Create a Firestore query.
  getDocs, // Retrieve documents that match a query.
  doc, // Create a reference to a specific document.
  getDoc, // Retrieve one document from Firestore.
  updateDoc, // Update fields in an existing document.
  orderBy, // Sort query results by a field.
  Timestamp, // Work with Firestore timestamp values.
  runTransaction, // Run database operations together in a transaction.
  where, // Filter documents based on a field value.
  addDoc, // Add a new document to a collection.
  getFirestore, // Access a Firestore database instance.
} from "firebase/firestore";

// Import the application's Firebase database instance.
import { db } from "@/src/lib/firebase/clientApp";

// Define a function that updates the stored image URL for a restaurant.
export async function updateRestaurantImageReference(
  restaurantId, // The ID of the restaurant to update.
  publicImageUrl // The public URL of the restaurant's image.
) {
  // Create a reference to the restaurant document in the restaurants collection.
  const restaurantRef = doc(collection(db, "restaurants"), restaurantId);

  // Check that the restaurant document reference exists.
  if (restaurantRef) {
    // Update the restaurant document with the new image URL.
    await updateDoc(restaurantRef, { photo: publicImageUrl });
  }
}

// Define a helper function that updates a restaurant's rating totals and saves a review.
const updateWithRating = async (
  transaction, // The Firestore transaction used for database operations.
  docRef, // A reference to the restaurant document being updated.
  newRatingDocument, // A reference to the new review document.
  review // The review data, including its rating and text.
) => {
  // Retrieve the restaurant document within the transaction.
  const restaurant = await transaction.get(docRef);

  // Get the restaurant's stored data.
  const data = restaurant.data();

  // Increase the number of ratings by one, or start at one if there are no ratings yet.
  const newNumRatings = data?.numRatings ? data.numRatings + 1 : 1;

  // Add the new review's rating to the existing total rating.
  const newSumRating = (data?.sumRating || 0) + Number(review.rating);

  // Calculate the new average rating.
  const newAverage = newSumRating / newNumRatings;

  // Update the restaurant's rating totals and average in Firestore.
  transaction.update(docRef, {
    numRatings: newNumRatings, // Store the updated number of ratings.
    sumRating: newSumRating, // Store the updated sum of all ratings.
    avgRating: newAverage, // Store the newly calculated average rating.
  });

  // Save the new review as a document in the restaurant's ratings collection.
  transaction.set(newRatingDocument, {
    ...review, // Copy the review's existing fields into the new document.
    timestamp: Timestamp.fromDate(new Date()), // Add the current date and time to the review.
  });
};

// Define a function that adds a review to a restaurant and updates its rating.
export async function addReviewToRestaurant(db, restaurantId, review) {
  // Check that a restaurant ID was provided.
  if (!restaurantId) {
    // Stop the function and report the missing restaurant ID.
    throw new Error("No restaurant ID has been provided.");
  }

  // Check that review data was provided.
  if (!review) {
    // Stop the function and report that the review is invalid or missing.
    throw new Error("A valid review has not been provided.");
  }

  // Try to add the review and update the restaurant's rating.
  try {
    // Create a reference to the restaurant document.
    const docRef = doc(collection(db, "restaurants"), restaurantId);

    // Create a reference for a new document in this restaurant's ratings collection.
    const newRatingDocument = doc(
      collection(db, `restaurants/${restaurantId}/ratings`),
    );

    // Run the restaurant update and review save together in a Firestore transaction.
    // This helps keep the rating totals consistent when multiple reviews are submitted.
    await runTransaction(db, (transaction) =>
      updateWithRating(transaction, docRef, newRatingDocument, review),
    );
  } catch (error) {
    // Log a message and the error details if adding the rating fails.
    console.error(
      "There was an error adding the rating to the restaurant",
      error,
    );

    // Pass the error back to the calling function so it can handle the failure.
    throw error;
  }
}

// Define a helper function that applies filters and sorting to a Firestore query.
function applyQueryFilters(q, { category, city, price, sort }) {
  // Filter results by category when a category has been selected.
  if (category) {
    q = query(q, where("category", "==", category));
  }

  // Filter results by city when a city has been selected.
  if (city) {
    q = query(q, where("city", "==", city));
  }

  // Filter results by price when a price selection has been provided.
  if (price) {
    // Use the number of selected price options as the restaurant's price value.
    q = query(q, where("price", "==", price.length));
  }

  // Sort by average rating from highest to lowest if Rating is selected or no sort is provided.
  if (sort === "Rating" || !sort) {
    q = query(q, orderBy("avgRating", "desc"));
  // Otherwise, sort by the number of reviews from highest to lowest if Review is selected.
  } else if (sort === "Review") {
    q = query(q, orderBy("numRatings", "desc"));
  }

  // Return the query with the selected filters and sorting applied.
  return q;
}

// Define an asynchronous function that retrieves restaurants from Firestore