import React from "react";
import renderStars from "@/src/components/Stars.jsx";

const RestaurantDetails = ({
  restaurant,
  userId,
  handleRestaurantImage,
  setIsOpen,
  isOpen,
  children,
}) => {
  return (
    <section className="img__section sonomastay-details">
      <img
        src={restaurant.photo}
        alt={`Photo of ${restaurant.name}`}
      />

      <div className="actions">
        {userId && (
          <button
            type="button"
            className="review"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={`Write a guest review for ${restaurant.name}`}
          >
            Write a review
          </button>
        )}

        {userId && (
          <label
            onChange={(event) => handleRestaurantImage(event.target)}
            htmlFor="upload-image"
            className="add"
          >
            <input
              name="hotel-image"
              type="file"
              id="upload-image"
              accept="image/*"
              className="file-input hidden w-full h-full"
            />
            <img
              className="add-image"
              src="/add.svg"
              alt="Upload a hotel photo"
            />
            <span>Add a photo</span>
          </label>
        )}
      </div>

      <div className="details__container">
        <div className="details">
          <p className="sonomastay-eyebrow">YOUR SONOMA COUNTY STAY</p>

          <h2>{restaurant.name}</h2>

          <div
            className="restaurant__rating"
            aria-label={`${Number(restaurant.avgRating || 0).toFixed(1)} out of 5 stars`}
          >
            <ul>{renderStars(restaurant.avgRating || 0)}</ul>
            <span>
              {Number(restaurant.avgRating || 0).toFixed(1)} ({restaurant.numRatings || 0} guest reviews)
            </span>
          </div>

          <p>
            {restaurant.category} <span aria-hidden="true">·</span>{" "}
            {restaurant.city}, Sonoma County
          </p>

          <p className="sonomastay-price">
            {"$".repeat(Math.max(1, Math.min(4, restaurant.price || 1)))}
            <span> · Nightly price tier</span>
          </p>

          {children}
        </div>
      </div>
    </section>
  );
};

export default RestaurantDetails;