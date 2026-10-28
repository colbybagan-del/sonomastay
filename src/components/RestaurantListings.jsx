"use client";

import Link from "next/link";
import { React, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import renderStars from "@/src/components/Stars.jsx";
import { getRestaurantsSnapshot } from "@/src/lib/firebase/firestore.js";
import Filters from "@/src/components/Filters.jsx";

const RestaurantItem = ({ restaurant }) => (
  <li key={restaurant.id} className="sonomastay-card">
    <Link href={`/restaurant/${restaurant.id}`}>
      <ActiveResturant restaurant={restaurant} />
    </Link>
  </li>
);

const ActiveResturant = ({ restaurant }) => (
  <div>
    <ImageCover photo={restaurant.photo} name={restaurant.name} />
    <ResturantDetails restaurant={restaurant} />
  </div>
);

const ImageCover = ({ photo, name }) => (
  <div className="image-cover">
    <img src={photo} alt={`Photo of ${name}`} />
  </div>
);

const ResturantDetails = ({ restaurant }) => (
  <div className="restaurant__details">
    <p className="sonomastay-eyebrow">SONOMA COUNTY</p>
    <h2>{restaurant.name}</h2>
    <RestaurantRating restaurant={restaurant} />
    <RestaurantMetadata restaurant={restaurant} />
  </div>
);

const RestaurantRating = ({ restaurant }) => (
  <div className="restaurant__rating">
    <ul>{renderStars(restaurant.avgRating || 0)}</ul>
    <span>
      {Number(restaurant.avgRating || 0).toFixed(1)} ·{" "}
      {restaurant.numRatings || 0} guest reviews
    </span>
  </div>
);

const RestaurantMetadata = ({ restaurant }) => (
  <div className="restaurant__meta">
    <p>
      {restaurant.category} <span aria-hidden="true">·</span>{" "}
      {restaurant.city}
    </p>
    <p className="sonomastay-price">
      {"$".repeat(Math.max(1, Math.min(4, restaurant.price || 1)))}
      <span> · Price tier</span>
    </p>
  </div>
);

export default function RestaurantListings({
  initialRestaurants,
  searchParams,
}) {
  const router = useRouter();

  const initialFilters = {
    city: searchParams.city || "",
    category: searchParams.category || "",
    price: searchParams.price || "",
    sort: searchParams.sort || "",
  };

  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    routerWithFilters(router, filters);
  }, [router, filters]);

  useEffect(() => {
    return getRestaurantsSnapshot((data) => {
      setRestaurants(data);
    }, filters);
  }, [filters]);

  return (
    <article className="sonomastay-listings">
      <header className="sonomastay-hero">
        <p className="sonomastay-eyebrow">DISCOVER SONOMA COUNTY</p>
        <h1>Find your place in wine country.</h1>
        <p>
          Explore welcoming stays, vineyard retreats, and charming places to
          unwind across Sonoma County.
        </p>
      </header>

      <Filters filters={filters} setFilters={setFilters} />

      {restaurants.length === 0 ? (
        <p>No stays match those filters. Try changing your selections.</p>
      ) : (
        <ul className="restaurants">
          {restaurants.map((restaurant) => (
            <RestaurantItem key={restaurant.id} restaurant={restaurant} />
          ))}
        </ul>
      )}
    </article>
  );
}

function routerWithFilters(router, filters) {
  const queryParams = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") {
      queryParams.append(key, value);
    }
  }

  const queryString = queryParams.toString();
  const nextUrl = queryString ? `/?${queryString}` : "/";
  router.replace(nextUrl, { scroll: false });
}