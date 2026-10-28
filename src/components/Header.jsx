"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  signInWithGoogle,
  signOut,
  onIdTokenChanged,
} from "@/src/lib/firebase/auth.js";
import { addFakeRestaurantsAndReviews } from "@/src/lib/firebase/firestore.js";
import { setCookie, deleteCookie } from "cookies-next";

function useUserSession(initialUser) {
  useEffect(() => {
    return onIdTokenChanged(async (user) => {
      if (user) {
        const idToken = await user.getIdToken();
        await setCookie("__session", idToken);
      } else {
        await deleteCookie("__session");
      }

      if (initialUser?.uid === user?.uid) {
        return;
      }

      window.location.reload();
    });
  }, [initialUser]);

  return initialUser;
}

export default function Header({ initialUser }) {
  const user = useUserSession(initialUser);

  const handleSignOut = (event) => {
    event.preventDefault();
    signOut();
  };

  const handleSignIn = (event) => {
    event.preventDefault();
    signInWithGoogle();
  };

  const handleAddSampleHotels = async (event) => {
    event.preventDefault();

    try {
      await addFakeRestaurantsAndReviews();
      window.location.reload();
    } catch (error) {
      console.error("Error adding sample hotels:", error);
      alert("Could not add sample hotels. Check the browser console for details.");
    }
  };

  return (
    <header>
      <Link href="/" className="logo">
        SonomaStay
      </Link>

      {user ? (
        <div className="profile">
          <p>
            <img
              className="profileImage"
              src={user.photoURL || "/profile.svg"}
              alt=""
            />
            {user.displayName}
          </p>

          <div className="menu">
            <ul>
              <li>{user.displayName}</li>

              <li>
                <a href="#" onClick={handleAddSampleHotels}>
                  Add Sample Hotels
                </a>
              </li>

              <li>
                <a href="#" onClick={handleSignOut}>
                  Sign Out
                </a>
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="profile">
          <a href="#" onClick={handleSignIn}>
            <img src="/profile.svg" alt="" />
            Sign In with Google
          </a>
        </div>
      )}
    </header>
  );
}