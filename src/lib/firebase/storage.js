// Import the Firebase Storage functions used to upload images and retrieve their download URLs.
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// Import the application's Firebase Storage instance.
import { storage } from "@/src/lib/firebase/clientApp";

// Import the function that saves the uploaded image URL to the restaurant's Firestore document.
import { updateRestaurantImageReference } from "@/src/lib/firebase/firestore";

// Define an asynchronous function that uploads an image for a restaurant and saves its URL.
export async function updateRestaurantImage(restaurantId, image) {
  // Use try/catch to handle errors that occur while processing the image.
  try {
    // Check that a restaurant ID was provided.
    if (!restaurantId) {
      // Stop the function and report the missing restaurant ID.
      throw new Error("No restaurant ID has been provided.");
    }

    // Check that an image was provided and that it has a filename.
    if (!image || !image.name) {
      // Stop the function if the image is missing or invalid.
      throw new Error("A valid image has not been provided.");
    }

    // Upload the image to Firebase Storage and retrieve its public download URL.
    const publicImageUrl = await uploadImage(restaurantId, image);

    // Save the image URL to the restaurant's document in Firestore.
    await updateRestaurantImageReference(restaurantId, publicImageUrl);

    // Return the image URL so the calling component can use it.
    return publicImageUrl;
  } catch (error) {
    // Log the error if something goes wrong while processing the image.
    console.error("Error processing request:", error);
  }
}

// Define an asynchronous helper function that uploads an image to Firebase Storage.
async function uploadImage(restaurantId, image) {
  // Create a storage path using the restaurant ID and image filename.
  const filePath = `images/${restaurantId}/${image.name}`;

  // Create a reference to the image's location in Firebase Storage.
  const newImageRef = ref(storage, filePath);

  // Upload the image file to the specified storage location.
  await uploadBytesResumable(newImageRef, image);

  // Retrieve and return the download URL for the uploaded image.
  return await getDownloadURL(newImageRef);
}

// End of the image upload functions.