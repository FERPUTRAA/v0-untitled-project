import { getCurrentUserProfile } from "@/actions/user-actions"
import { getNearbyUsersList } from "@/actions/user-actions"
import { getFriendRequestsForCurrentUser } from "@/actions/user-actions"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const user = await getCurrentUserProfile()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: nearbyUsers } = await getNearbyUsersList(5)
  const { data: friendRequests } = await getFriendRequestsForCurrentUser()

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Selamat datang, {user.fullName}!</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Orang di Sekitar Anda</h2>
          {nearbyUsers && nearbyUsers.length > 0 ? (
            <ul className="space-y-3">
              {nearbyUsers.map((nearbyUser: any) => (
                <li key={nearbyUser.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">{nearbyUser.avatarEmoji}</div>
                    <div>
                      <p className="font-medium">{nearbyUser.fullName}</p>
                      <p className="text-sm text-gray-500">{nearbyUser.distance} km dari Anda</p>
                    </div>
                  </div>
                  <a
                    href={`/users/${nearbyUser.id}`}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                  >
                    Lihat Profil
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Tidak ada orang di sekitar Anda saat ini.</p>
          )}
          <div className="mt-4">
            <a href="/dashboard/nearby" className="text-blue-500 hover:underline text-sm font-medium">
              Lihat lebih banyak →
            </a>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Permintaan Pertemanan</h2>
          {friendRequests && friendRequests.length > 0 ? (
            <ul className="space-y-3">
              {friendRequests.map((request: any) => (
                <li key={request.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">{request.user.avatarEmoji}</div>
                    <div>
                      <p className="font-medium">{request.user.fullName}</p>
                      <p className="text-sm text-gray-500">Ingin berteman dengan Anda</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
                      // Implementasi fungsi untuk menerima permintaan
                    >
                      Terima
                    </button>
                    <button
                      className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300"
                      // Implementasi fungsi untuk menolak permintaan
                    >
                      Tolak
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Tidak ada permintaan pertemanan saat ini.</p>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Aktivitas Terbaru</h2>
        <p className="text-gray-500">Belum ada aktivitas terbaru.</p>
      </div>
    </div>
  )
}
