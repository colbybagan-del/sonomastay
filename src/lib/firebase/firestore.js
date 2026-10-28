// Generate sample hotels and guest reviews.
import { generateFakeRestaurantsAndReviews } from "@/src/lib/fakeRestaurants.js";

// Import the Firestore functions used by the application.
import {
  collection,
  onSnapshot,
  query,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  orderBy,
  Timestamp,
  runTransaction,
  where,
  addDoc,
} from "firebase/firestore";

// Import the application's Firebase database instance.
import { db } from "@/src/lib/firebase/clientApp";

// Update a hotel's saved photo URL.
export async function updateRestaurantImageReference(
  restaurantId,
  publicImageUrl
) {
  const restaurantRef = doc(db, "restaurants", restaurantId);

  await updateDoc(restaurantRef, {
    photo: publicImageUrl,
  });
}

// Update a hotel's rating totals and save the new guest review.
const updateWithRating = async (
  transaction,
  restaurantRef,
  newReviewRef,
  review
) => {
  const restaurantSnapshot = await transaction.get(restaurantRef);

  if (!restaurantSnapshot.exists()) {
    throw new Error("The hotel could not be found.");
  }

  const restaurant = restaurantSnapshot.data();
  const newNumRatings = (restaurant.numRatings || 0) + 1;
  const newSumRating =
    (restaurant.sumRating || 0) + Number(review.rating);
  const newAverage = newSumRating / newNumRatings;

  transaction.update(restaurantRef, {
    numRatings: newNumRatings,
    sumRating: newSumRating,
    avgRating: newAverage,
  });

  transaction.set(newReviewRef, {
    ...review,
    rating: Number(review.rating),
    timestamp: Timestamp.fromDate(new Date()),
  });
};

// Add a guest review and update the hotel's average rating.
export async function addReviewToRestaurant(
  database,
  restaurantId,
  review
) {
  if (!restaurantId) {
    throw new Error("No hotel ID has been provided.");
  }

  if (
    !review ||
    !Number.isFinite(Number(review.rating)) ||
    Number(review.rating) < 1 ||
    Number(review.rating) > 5 ||
    typeof review.text !== "string" ||
    !review.text.trim()
  ) {
    throw new Error("Please provide a valid rating and review.");
  }

  const restaurantRef = doc(database, "restaurants", restaurantId);

  const newReviewRef = doc(
    collection(database, "restaurants", restaurantId, "ratings")
  );

  await runTransaction(database, (transaction) =>
    updateWithRating(
      transaction,
      restaurantRef,
      newReviewRef,
      review
    )
  );
}

// Apply location, stay type, nightly price, and sorting filters.
function applyQueryFilters(
  firestoreQuery,
  { category, city, price, sort } = {}
) {
  if (category) {
    firestoreQuery = query(
      firestoreQuery,
      where("category", "==", category)
    );
  }

  if (city) {
    firestoreQuery = query(
      firestoreQuery,
      where("city", "==", city)
    );
  }

  if (price) {
    const priceNumber =
      typeof price === "number"
        ? price
        : String(price).length;

    firestoreQuery = query(
      firestoreQuery,
      where("price", "==", priceNumber)
    );
  }

  if (sort === "Review") {
    firestoreQuery = query(
      firestoreQuery,
      orderBy("numRatings", "desc")
    );
  } else {
    firestoreQuery = query(
      firestoreQuery,
      orderBy("avgRating", "desc")
    );
  }

  return firestoreQuery;
}

// Retrieve the filtered hotel listings.
export async function getRestaurants(
  database = db,
  filters = {}
) {
  const hotelsRef = collection(database, "restaurants");

  const hotelsQuery = applyQueryFilters(
    query(hotelsRef),
    filters
  );

  const snapshot = await getDocs(hotelsQuery);

  return snapshot.docs.map((hotelDoc) => ({
    ...hotelDoc.data(),
    id: hotelDoc.id,
  }));
}

// Listen for real-time changes to the hotel listings.
export function getRestaurantsSnapshot(callback, filters = {}) {
  const hotelsRef = collection(db, "restaurants");

  const hotelsQuery = applyQueryFilters(
    query(hotelsRef),
    filters
  );

  return onSnapshot(
    hotelsQuery,
    (snapshot) => {
      callback(
        snapshot.docs.map((hotelDoc) => ({
          ...hotelDoc.data(),
          id: hotelDoc.id,
        }))
      );
    },
    (error) => {
      console.error("Error listening for hotel listings:", error);
    }
  );
}

// Retrieve one hotel by its ID.
export async function getRestaurantById(
  database = db,
  restaurantId
) {
  if (!restaurantId) {
    return null;
  }

  const hotelRef = doc(database, "restaurants", restaurantId);
  const snapshot = await getDoc(hotelRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    ...snapshot.data(),
    id: snapshot.id,
  };
}

// Listen for real-time changes to one hotel's details.
export function getRestaurantSnapshotById(
  restaurantId,
  callback
) {
  const hotelRef = doc(db, "restaurants", restaurantId);

  return onSnapshot(
    hotelRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({
          ...snapshot.data(),
          id: snapshot.id,
        });
      }
    },
    (error) => {
      console.error("Error listening for hotel details:", error);
    }
  );
}

// Retrieve guest reviews for the hotel review list and Gemini summary.
export async function getReviewsByRestaurantId(
  database = db,
  restaurantId
) {
  if (!restaurantId) {
    return [];
  }

  const reviewsRef = collection(
    database,
    "restaurants",
    restaurantId,
    "ratings"
  );

  const reviewsQuery = query(
    reviewsRef,
    orderBy("timestamp", "desc")
  );

  const snapshot = await getDocs(reviewsQuery);

  return snapshot.docs.map((reviewDoc) => ({
    ...reviewDoc.data(),
    id: reviewDoc.id,
  }));
}

// Listen for live changes to guest reviews.
export function getReviewsSnapshotByRestaurantId(
  restaurantId,
  callback
) {
  const reviewsRef = collection(
    db,
    "restaurants",
    restaurantId,
    "ratings"
  );

  const reviewsQuery = query(
    reviewsRef,
    orderBy("timestamp", "desc")
  );

  return onSnapshot(
    reviewsQuery,
    (snapshot) => {
      callback(
        snapshot.docs.map((reviewDoc) => ({
          ...reviewDoc.data(),
          id: reviewDoc.id,
        }))
      );
    },
    (error) => {
      console.error("Error listening for guest reviews:", error);
    }
  );
}

// Add sample hotels and their guest reviews to Firestore.
export async function addSampleRestaurants(database = db) {
  const sampleData = await generateFakeRestaurantsAndReviews();

  for (const item of sampleData) {
    const hotelRef = await addDoc(
      collection(database, "restaurants"),
      item.restaurantData
    );

    for (const review of item.ratingsData) {
      await addDoc(
        collection(
          database,
          "restaurants",
          hotelRef.id,
          "ratings"
        ),
        review
      );
    }
  }
}

// Keep the function name expected by Header.jsx.
// The header passes a click event, so prevent the link's default action.
export async function addFakeRestaurantsAndReviews(event) {
  if (event && typeof event.preventDefault === "function") {
    event.preventDefault();
  }

  await addSampleRestaurants(db);
}