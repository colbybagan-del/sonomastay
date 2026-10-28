import {
  randomNumberBetween,
  getRandomDateAfter,
  getRandomDateBefore,
} from "@/src/lib/utils.js";
import { randomData } from "@/src/lib/randomData.js";
import { Timestamp } from "firebase/firestore";

const hotelPhotos = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80",
];

export async function generateFakeRestaurantsAndReviews() {
  const hotelsToAdd = 8;
  const data = [];

  for (let i = 0; i < hotelsToAdd; i++) {
    const hotelTimestamp = Timestamp.fromDate(getRandomDateBefore());
    const ratingsData = [];

    for (let j = 0; j < randomNumberBetween(2, 5); j++) {
      const review =
        randomData.restaurantReviews[
          randomNumberBetween(0, randomData.restaurantReviews.length - 1)
        ];

      ratingsData.push({
        rating: review.rating,
        text: review.text,
        userId: `Sample Guest ${i + 1}-${j + 1}`,
        timestamp: Timestamp.fromDate(
          getRandomDateAfter(hotelTimestamp.toDate())
        ),
      });
    }

    const sumRating = ratingsData.reduce(
      (total, review) => total + review.rating,
      0
    );

    const hotelData = {
      category:
        randomData.restaurantCategories[
          randomNumberBetween(0, randomData.restaurantCategories.length - 1)
        ],
      name: randomData.restaurantNames[
        i % randomData.restaurantNames.length
      ],
      avgRating: sumRating / ratingsData.length,
      city:
        randomData.restaurantCities[
          randomNumberBetween(0, randomData.restaurantCities.length - 1)
        ],
      numRatings: ratingsData.length,
      sumRating,
      price: randomNumberBetween(1, 4),
      photo: hotelPhotos[i % hotelPhotos.length],
      timestamp: hotelTimestamp,
    };

    data.push({
      restaurantData: hotelData,
      ratingsData,
    });
  }

  return data;
}