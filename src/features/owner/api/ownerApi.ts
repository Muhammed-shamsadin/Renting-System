import { getAuthToken } from "@/lib/cookies"
import apiClient from "../../../api/client"
import { convertApiListingToFeaturedListing, publicAxiosInstance, type ApiListingResponse, type FeaturedListing } from "../../../api/publicApi"
// import type { export Booking } from "./fakeOwnerApi"
import type { Booking } from "@/types/listing.types"
import { get } from "lodash"
import type { Review } from "@/types/listing.types"


export interface CreateListingPayload {
  address: string
  availability_end: string
  availability_start: string
  category_id: string
  city: string
  country: string
  description: string
  price: number
  region: string
  status: "booked" | "available" | "inactive" | "pending" | "cancelled" | "completed"
  title: string
}

// export interface ListingResponse {
//   id: string
//   title: string
//   description: string
//   address: string
//   city: string
//   region: string
//   country: string
//   price: number
//   status: "completed" | "booked" | "inactive" | "pending"
//   availability_start: string
//   availability_end: string
//   category_id: string
//   owner_id: string
//   views_count: number
//   created_at: string
//   updated_at: string
// }

export const ownerApi = {
  // Create a new listing
  createListing: async (payload: CreateListingPayload): Promise<FeaturedListing> => {
    try {
      console.log('Sending payload to /v1/listings:', payload);
      console.log('Request URL:', publicAxiosInstance.defaults.baseURL + '/listings');
      console.log('Auth token:', getAuthToken());
      const formattedPayload = {
        ...payload
      };
      const response = await publicAxiosInstance.post<ApiListingResponse>("/listings", formattedPayload)

      return await convertApiListingToFeaturedListing(response.data)
    } catch (error) {
      console.error("Error creating listing:", error)
      throw error
    }
  },

  // Get categories for listings
  getCategories: async () => {
    try {
      const response = await publicAxiosInstance.get("/categories")
      return response.data
    } catch (error) {
      console.error("Error fetching categories:", error)
      throw error
    }
  },

  // Upload media for a listing
  uploadListingMedia: async (listingId: string, images: File[]): Promise<string[]> => {
    try {
      const formData = new FormData()

      // Append each image to the form data
      images.forEach((image) => {
        formData.append("images", image)
      })

      const response = await publicAxiosInstance.post(`/listings/${listingId}/media`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      return response.data
    } catch (error) {
      console.error("Error uploading listing media:", error)
      throw error
    }
  },
  getOwnerProperties: async (userId: string): Promise<FeaturedListing[]> => {
    try {
      const response = await publicAxiosInstance.get<ApiListingResponse[]>(`/users/${userId}/listings`)
      console.log("Owner properties response:", response.data)
      return await Promise.all(
        (response.data ?? []).map(convertApiListingToFeaturedListing)
      )
    } catch (error) {
      throw error
    }
  },

  // get listing by Id ...
  getListingById: async (listingId: string): Promise<FeaturedListing> => {
    try {
      const response = await publicAxiosInstance.get<ApiListingResponse>(`/listings/${listingId}`)
      return await convertApiListingToFeaturedListing(response.data)
    } catch (error) {
      console.error("Error fetching listing by ID:", error)
      throw error
    }
  },

  // get listing media 
  getListingMedia: async (listingId: string): Promise<string[]> => {
    try {
      const response = await publicAxiosInstance.get(`/listings/${listingId}/media`)
      return response.data
    } catch (error) {
      console.error("Error fetching listing media:", error)
      throw error
    }
  },

  // get listing review 
  getListingReview: async (listingId: string): Promise<string[]> => {
    try {
      const response = await publicAxiosInstance.get(`listings/${listingId}/reviews`)
      return response.data;
    } catch (error) {
      console.error("Error fetching reviews:", error);

      // console.error("Error fetching reviews: ", error)
      throw error
    }
  },

  updateListing: async (listingId: string, data: Partial<CreateListingPayload>): Promise<FeaturedListing> => {
    try {
      console.log("Updating listing with ID:", listingId)
      const response = await apiClient.patch(`/listings/${listingId}`, data)
      return response.data
    } catch (error) {
      console.error("Error updating listing:", error)
      throw error
    }
  },
  

  //GET Booking history of a Listing /listings/{id}/bookings which can also be filtered by status
  getListingBookings: async (listingId: string): Promise<Booking[]> => {
    try {
      const response = await publicAxiosInstance.get<Booking[]>(`/listings/${listingId}/bookings`)
      return response.data ?? []
    } catch (error) {
      console.error("Error fetching listing bookings:", error)
      return []
    }
  },

  //get owner bookings
  getOwnerBookings: async (ownerId: string): Promise<Booking[]> => {
    try {
      const response = await publicAxiosInstance.get<Booking[]>(`/users/${ownerId}/bookings`)
      return response.data ?? []
    } catch (error) {
      console.error("Error fetching owner bookings:", error)
      return []
    }
  },


  // Update booking status (real API)
  confirmBookingStatus: async (bookingId: string, listingId: string): Promise<void> => {
    try {
      const response = await publicAxiosInstance.patch(`/listings/${listingId}/bookings/${bookingId}/confirm`)
      console.log("Booking status updated successfully:", response.data);
      return response.data
    } catch (error) {
      console.error("Error updating booking status:", error);
      throw error;
    }
  },

  // Cancel booking (real API)
  cancelBooking: async (bookingId: string): Promise<void> => {
    try {
      
      const response = await publicAxiosInstance.get(`/bookings/${bookingId}/cancel`)
      console.log("Booking cancelled successfully:", response.data);
      return response.data
    } catch (error) {
      console.error("Error cancelling booking:", error);
      throw error;
    }
  },


  //  REVIEW API ENDPOINTS
  getListingReviews: async (listingId: string): Promise<Review[]> => {
    try {
      const response = await publicAxiosInstance.get<Review[]>(`/listings/${listingId}/reviews`)
      return response.data
    } catch (error) {
      console.error("Error fetching listing reviews:", error)
      throw error
    }
  },

  deleteListing: async (listingId: string): Promise<void> => {
    try {
      const response = await publicAxiosInstance.delete(`/listings/${listingId}`)
      console.log("Listing deleted successfully:", response.data)
      return response.data
    } catch (error) {
      console.error("Error deleting review:", error)
      throw error
    }
  }

  // get Listing booking (not implemented yet)
  // getListingBookings: async (listingId: string): Promise<string[]> => {
  //   try {
  //     const response = await publicAxiosInstance.get<string []>(`/bookings?listing_id=${listingId}`);
  //     return response.data;
  //   } catch (error) {
  //     console.error("Error fetching listing bookings:", error);
  //     throw error;
  //   }
  // },

  // // Update owner business information
  // updateOwnerInfo: async (ownerId: string, data: UpdateOwnerInfoPayload) => {
  //   try {
  //     const response = await apiClient.patch(`/owners/${ownerId}`, data)
  //     return response.data
  //   } catch (error) {
  //     throw error
  //   }
  // },

  // // Get owner statistics
  // getOwnerStats: async (ownerId: string) => {
  //   try {
  //     const response = await apiClient.get(`/owners/${ownerId}/stats`)
  //     return response.data
  //   } catch (error) {
  //     throw error
  //   }
  // },




}