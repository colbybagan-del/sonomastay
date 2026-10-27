// Tell Next.js that this component runs on the client so it can use React hooks and browser features.
"use client";

// This component shows one individual restaurant.
// It receives data from src/app/restaurant/[id]/page.jsx.

// Import React and the hooks used to manage state, side effects, and loading components.
import { React, useState, useEffect, Suspense } from "react";
// Import dynamic so the ReviewDialog component can be loaded when needed.
import dynamic from "next/dynamic";
// Import the function that listens for changes to a restaurant in Firestore.
import { getRestaurantSnapshotById } from "@/src/lib/firebase/firestore.js";
// Import the hook used to get information about the current user.
import { useUser } from "@/src/lib/getUser";
// Import the component that displays the restaurant's details.
import RestaurantDetails from "@/src/components/RestaurantDetails.jsx";
// Import the function used to upload or update a restaurant's image.
import { updateRestaurantImage } from "@/src/lib/firebase/storage.js";

// Load the ReviewDialog component dynamically instead of importing it immediately.
const ReviewDialog = dynamic(() => import("@/src/components/ReviewDialog.jsx"));

// Define and export the Restaurant component.
// It receives the restaurant ID, initial restaurant data, initial user ID, and child content.
export default function Restaurant({
  id, // The ID of the restaurant being displayed.
  initialRestaurant, // The restaurant information loaded initially.
  initialUserId, // The user's ID provided by the server, if available.
  children, // Additional content passed into this component.
}) {
  // Store the restaurant details in state, starting with the initial restaurant data.
  const [restaurantDetails, setRestaurantDetails] = useState(initialRestaurant);

  // Store whether the review dialog is currently open.
  const [isOpen, setIsOpen] = useState(false);

  // Get the current user's ID, or use the initial user ID if the current ID is unavailable.
  // The user ID associates a review with its author and determines whether the review dialog is shown.
  const userId = useUser()?.uid || initialUserId;

  // Store the review's rating and text in state, starting with an empty review.
  const [review, setReview] = useState({
    rating: 0, // The initial rating is zero.
    text: "", // The initial review text is empty.
  });

  // Define a function that updates one field of the review when its value changes.
  const onChange = (value, name) => {
    // Keep the existing review values and update the field identified by name.
    setReview({ ...review, [name]: value });
  };

  // Define an asynchronous function for handling a restaurant image upload.
  async function handleRestaurantImage(target) {
    // Get the first selected file, or use null if no files were selected.
    const image = target.files ? target.files[0] : null;

    // Stop the function if no image was selected.
    if (!image) {
      return;
    }

    // Upload the image and receive its URL after the upload completes.
    const imageURL = await updateRestaurantImage(id, image);

    // Update the restaurant details with the new image URL.
    setRestaurantDetails({ ...restaurantDetails, photo: imageURL });
  }

  // Define a function that closes the review dialog and resets the review fields.
  const handleClose = () => {
    // Set the dialog's open state to false.
    setIsOpen(false);

    // Reset the review rating and text to their initial values.
    setReview({ rating: 0, text: "" });
  };

  // Run this effect when the component mounts or when the restaurant ID changes.
  useEffect(() => {
    // Listen for updates to this restaurant in Firestore.
    // Update the restaurant details whenever new data is received.
    // Return the listener cleanup function so the subscription can be stopped.
    return getRestaurantSnapshotById(id, (data) => {
      setRestaurantDetails(data);
    });
  }, [id]); // Re-run the effect when the restaurant ID changes.

  // Return the restaurant details and, when appropriate, the review dialog.
  return (
    <>
      {/* Display the restaurant details and pass in the data and event handlers it needs. */}
      <RestaurantDetails
        restaurant={restaurantDetails} // Pass the current restaurant information.
        userId={userId} // Pass the current user's ID.
        handleRestaurantImage={handleRestaurantImage} // Pass the image upload handler.
        setIsOpen={setIsOpen} // Allow the details component to open or close the review dialog.
        isOpen={isOpen} // Tell the details component whether the dialog is open.
      >
        {/* Display any additional content passed into the Restaurant component. */}
        {children}
      </RestaurantDetails>

      {/* Only show the review dialog when a user ID is available. */}
      {userId && (
        // Show a loading message while the dynamically imported review dialog loads.
        <Suspense fallback={<p>Loading...</p>}>
          {/* Render the review dialog and pass in its state and event handlers. */}
          <ReviewDialog
            isOpen={isOpen} // Tell the dialog whether it should be visible.
            handleClose={handleClose} // Pass the function that closes and resets the dialog.
            review={review} // Pass the current review rating and text.
            onChange={onChange} // Pass the function that updates review fields.
            userId={userId} // Pass the ID of the user writing the review.
            id={id} // Pass the ID of the restaurant being reviewed.
          />
        </Suspense>
      )}
    </>
  );
}