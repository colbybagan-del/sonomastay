// Import the Google Gemini plugin for Genkit.
import { googleAI } from "@genkit-ai/google-genai";

// Import Genkit's AI generation function.
import { genkit } from "genkit";

// Import the function that retrieves guest reviews from Firestore.
import { getReviewsByRestaurantId } from "@/src/lib/firebase/firestore.js";

// Import Firebase authentication for server-side access.
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp";

// Import Firestore's database accessor.
import { getFirestore } from "firebase/firestore";

// Create a Genkit instance configured with Google's Gemini plugin.
const ai = genkit({
  plugins: [googleAI()],
});

// Generate an AI summary of a hotel's guest reviews.
export async function GeminiSummary({ restaurantId }) {
  try {
    // Make sure the Gemini API key is configured on the server.
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    // Get the Firebase app authenticated for the current user.
    const { firebaseServerApp } = await getAuthenticatedAppForUser();

    // Retrieve the hotel's reviews from Firestore.
    const reviews = await getReviewsByRestaurantId(
      getFirestore(firebaseServerApp),
      restaurantId
    );

    // Show a helpful message when there are no reviews to summarize.
    if (!reviews || reviews.length === 0) {
      return (
        <div className="restaurant__review_summary">
          <p>There are no guest reviews to summarize yet.</p>
        </div>
      );
    }

    // Combine the review text into one prompt for Gemini.
    const reviewText = reviews
      .map((review) => review.text)
      .filter((text) => typeof text === "string" && text.trim().length > 0)
      .join("\n");

    // Avoid sending an empty prompt to Gemini.
    if (!reviewText.trim()) {
      return (
        <div className="restaurant__review_summary">
          <p>There are no guest reviews to summarize yet.</p>
        </div>
      );
    }

    // Ask Gemini to summarize the main themes in one sentence.
    const response = await ai.generate({
      model: googleAI.model("gemini-flash-latest"),
      prompt: `Summarize the following hotel guest reviews in one clear, neutral sentence. Describe recurring opinions about the property, and do not invent details that the reviews do not mention.

Guest reviews:
${reviewText}`,
    });

    // Display the generated summary.
    return (
      <div className="restaurant__review_summary">
        <p>{response.text}</p>
        <p>✨ Summarized with Gemini</p>
      </div>
    );
  } catch (error) {
    // Log the detailed error so it can be investigated in the server logs.
    console.error("Error summarizing guest reviews:", error);

    // Display a user-friendly message instead of crashing the page.
    return (
      <div className="restaurant__review_summary">
        <p>Unable to summarize guest reviews right now.</p>
      </div>
    );
  }
}

// Display a placeholder while the summary is being generated.
export function GeminiSummarySkeleton() {
  return (
    <div className="restaurant__review_summary">
      <p>✨ Summarizing guest reviews with Gemini...</p>
    </div>
  );
}