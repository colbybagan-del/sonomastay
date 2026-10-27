// Import the Google AI plugin that allows Genkit to communicate with Gemini.
import { googleAI } from "@genkit-ai/google-genai";
// Import Genkit, which provides the AI generation functionality.
import { genkit } from "genkit";
// Import the function that retrieves reviews for a specific restaurant from Firestore.
import { getReviewsByRestaurantId } from "@/src/lib/firebase/firestore.js";
// Import the function that initializes the authenticated Firebase application for the current user.
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp";
// Import getFirestore, which provides access to the Firestore database.
import { getFirestore } from "firebase/firestore";

// Define an asynchronous component that generates a summary of a restaurant's reviews.
export async function GeminiSummary({ restaurantId }) {
  // Retrieve the authenticated Firebase application for the current user.
  const { firebaseServerApp } = await getAuthenticatedAppForUser();

  // Connect to Firestore and retrieve the reviews belonging to this restaurant.
  const reviews = await getReviewsByRestaurantId(
    getFirestore(firebaseServerApp), // Get the Firestore database instance.
    restaurantId // Specify which restaurant's reviews to retrieve.
  );

  // Define a character that separates individual reviews in the AI prompt.
  const reviewSeparator = "@";

  // Create a prompt instructing Gemini to summarize the restaurant's reviews.
  const prompt = `
    Based on the following restaurant reviews, 
    where each review is separated by a '${reviewSeparator}' character, 
    create a one-sentence summary of what people think of the restaurant. 

    Here are the reviews: ${reviews.map((review) => review.text).join(reviewSeparator)}
  `;

  // Use try/catch to handle errors that might occur during AI generation.
  try {
    // Check whether the Gemini API key is available in the server environment.
    if (!process.env.GEMINI_API_KEY) {
      // Explain that the required environment variable must be configured.
      // The linked documentation explains how to configure Genkit.
      throw new Error(
        'GEMINI_API_KEY not set. Set it with "firebase apphosting:secrets:set GEMINI_API_KEY"'
      );
    }

    // Configure Genkit to use Google's Gemini AI plugin and the selected model.
    const ai = genkit({
      // Register the Google AI plugin so Genkit can access Gemini models.
      plugins: [googleAI()],
      // Set the Gemini model used to generate the summary.
      model: googleAI.model("gemini-3.8-flash"),
    });

    // Send the review prompt to Gemini and retrieve the generated text.
    const { text } = await ai.generate(prompt);

    // Display the generated summary and identify it as AI-generated.
    return (
      <div className="restaurant__review_summary">
        {/* Display Gemini's summary of the restaurant reviews. */}
        <p>{text}</p>
        {/* Tell users that Gemini generated the summary. */}
        <p>✨ Summarized with Gemini</p>
      </div>
    );
  } catch (e) {
    // Print error details to the server logs to help with troubleshooting.
    console.error(e);

    // Display a fallback message if the summary cannot be generated.
    return <p>Error summarizing reviews.</p>;
  }
}

// Define a loading component that appears while the review summary is being generated.
export function GeminiSummarySkeleton() {
  // Display a message letting users know that Gemini is processing the reviews.
  return (
    <div className="restaurant__review_summary">
      <p>✨ Summarizing reviews with Gemini...</p>
    </div>
  );
}