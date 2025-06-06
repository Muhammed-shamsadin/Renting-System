import { Skeleton } from "@/components/ui/skeleton"
import { useUserProfile } from "@/features/users/useUserProfile"
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar"
import { Mail } from "lucide-react"


const BookedUser = ({ userid }: { userid: string }) => {
    const { realUser, loading } = useUserProfile(userid)

      const getInitials = (firstName?: string, lastName?: string) => {
        if (firstName && lastName) {
          return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
        }
        return "R"
      }

  return (
    <>
      {loading ? (
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12">
            <Avatar className="h-12 w-12">
              <AvatarImage
                className="h-12 w-12 rounded-full object-cover"
                src={realUser?.profile_picture || ""}
                alt={`${realUser?.first_name} ${realUser?.last_name}`}
              />
              <AvatarFallback className="h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-lg">
                {getInitials(realUser?.first_name, realUser?.last_name)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-lg">
              {realUser?.first_name} {realUser?.last_name}
            </h4>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              {realUser?.email}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default BookedUser