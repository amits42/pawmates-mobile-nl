// import { type NextRequest, NextResponse } from "next/server"
// import { sql } from "@vercel/postgres"
// import { db, getChatRoomId } from "@/lib/firebase"
// import { doc, setDoc, serverTimestamp } from "firebase/firestore"

// export async function POST(request: NextRequest) {
//   try {
//     const { bookingId, userId, userType } = await request.json()

//     if (!bookingId || !userId || !userType) {
//       return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
//     }

//     // Convert bookingId to string for Firebase room ID
//     const firebaseRoomId = getChatRoomId(bookingId.toString())

//     // Helper function to safely handle UUID or string comparison
//     const findExistingRoom = async () => {
//       try {
//         // Try UUID comparison first
//         return await sql`
//           SELECT cr.*, cr.booking_id::text as booking_id_text
//           FROM chat_rooms cr
//           WHERE cr.booking_id = ${bookingId}::uuid
//         `
//       } catch {
//         // If UUID fails, try string comparison
//         try {
//           return await sql`
//             SELECT cr.*, cr.booking_id::text as booking_id_text
//             FROM chat_rooms cr
//             WHERE cr.booking_id::text = ${bookingId.toString()}
//           `
//         } catch {
//           // If both fail, try by firebase_room_id
//           return await sql`
//             SELECT cr.*, cr.booking_id::text as booking_id_text
//             FROM chat_rooms cr
//             WHERE cr.firebase_room_id = ${firebaseRoomId}
//           `
//         }
//       }
//     }

//     const existingRoom = await findExistingRoom()
//     let chatRoom

//     if (existingRoom.rows.length === 0) {
//       // Helper function to safely insert booking_id
//       const createNewRoom = async () => {
//         try {
//           // Try inserting as UUID first
//           return await sql`
//             INSERT INTO chat_rooms (booking_id, firebase_room_id)
//             VALUES (${bookingId}::uuid, ${firebaseRoomId})
//             RETURNING *, booking_id::text as booking_id_text
//           `
//         } catch {
//           // If UUID fails, insert as string (if column allows)
//           return await sql`
//             INSERT INTO chat_rooms (booking_id, firebase_room_id)
//             VALUES (${bookingId.toString()}, ${firebaseRoomId})
//             RETURNING *, booking_id::text as booking_id_text
//           `
//         }
//       }

//       const newRoom = await createNewRoom()

//       // Helper function to safely handle user_id
//       const addParticipants = async () => {
//         try {
//           // Try with UUID casting
//           await sql`
//             INSERT INTO chat_participants (chat_room_id, user_id, user_type, display_name)
//             VALUES
//               (${newRoom.rows[0].id}, ${userId}::uuid, ${userType}, ${userType === "pet_owner" ? "Pet Owner" : userType === "sitter" ? "Pet Sitter" : "Support Team"})
//             ON CONFLICT DO NOTHING
//           `
//         } catch {
//           // Try without UUID casting
//           await sql`
//             INSERT INTO chat_participants (chat_room_id, user_id, user_type, display_name)
//             VALUES
//               (${newRoom.rows[0].id}, ${userId}, ${userType}, ${userType === "pet_owner" ? "Pet Owner" : userType === "sitter" ? "Pet Sitter" : "Support Team"})
//             ON CONFLICT DO NOTHING
//           `
//         }

//         // Add other participants for testing
//         try {
//           await sql`
//             INSERT INTO chat_participants (chat_room_id, user_id, user_type, display_name)
//             VALUES
//               (${newRoom.rows[0].id}, NULL, 'admin', 'Support Team')
//             ON CONFLICT DO NOTHING
//           `
//         } catch (error) {
//           console.log("Note: Could not add admin participant, continuing...")
//         }
//       }

//       await addParticipants()

//       // Initialize Firebase chat room
//       const chatRoomRef = doc(db, "chats", firebaseRoomId)
//       await setDoc(chatRoomRef, {
//         bookingId: bookingId.toString(),
//         participants: {
//           pet_owner: {
//             id: userType === "pet_owner" ? userId : "owner_123",
//             name: userType === "pet_owner" ? "Pet Owner" : "Pet Owner",
//           },
//           sitter: {
//             id: userType === "sitter" ? userId : "sitter_123",
//             name: userType === "sitter" ? "Pet Sitter" : "Pet Sitter",
//           },
//           admin: { id: "admin", name: "Support Team" },
//         },
//         createdAt: serverTimestamp(),
//         lastActivity: serverTimestamp(),
//       })

//       chatRoom = newRoom.rows[0]
//     } else {
//       chatRoom = existingRoom.rows[0]
//     }

//     // Get participants with flexible user_id handling
//     const getParticipants = async () => {
//       try {
//         return await sql`
//           SELECT user_id::text as user_id, user_type, display_name, joined_at, last_seen
//           FROM chat_participants
//           WHERE chat_room_id = ${chatRoom.id}
//         `
//       } catch {
//         return await sql`
//           SELECT user_id, user_type, display_name, joined_at, last_seen
//           FROM chat_participants
//           WHERE chat_room_id = ${chatRoom.id}
//         `
//       }
//     }

//     const participants = await getParticipants()

//     return NextResponse.json({
//       success: true,
//       chatRoom: {
//         id: chatRoom.id,
//         bookingId: chatRoom.booking_id_text || chatRoom.booking_id,
//         firebaseRoomId: chatRoom.firebase_room_id,
//         participants: participants.rows,
//       },
//     })
//   } catch (error) {
//     console.error("Error creating/getting chat room:", error)
//     return NextResponse.json(
//       {
//         error: "Internal server error",
//         details: error.message,
//       },
//       { status: 500 },
//     )
//   }
// }

// export async function GET(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url)
//     const userId = searchParams.get("userId")
//     const userType = searchParams.get("userType")

//     if (!userId || !userType) {
//       return NextResponse.json({ error: "Missing userId or userType" }, { status: 400 })
//     }

//     // Flexible query that handles both UUID and string user_ids
//     const getChatRooms = async () => {
//       if (userType === "admin") {
//         // Admin sees all rooms
//         return await sql`
//           SELECT cr.*, cr.booking_id::text as booking_id_text
//           FROM chat_rooms cr
//           WHERE cr.status = 'active'
//           ORDER BY cr.updated_at DESC
//         `
//       } else {
//         // Try UUID comparison first, then string
//         try {
//           return await sql`
//             SELECT cr.*, cr.booking_id::text as booking_id_text
//             FROM chat_rooms cr
//             JOIN chat_participants cp ON cr.id = cp.chat_room_id
//             WHERE cr.status = 'active'
//               AND cp.user_id = ${userId}::uuid
//               AND cp.user_type = ${userType}
//             ORDER BY cr.updated_at DESC
//           `
//         } catch {
//           return await sql`
//             SELECT cr.*, cr.booking_id::text as booking_id_text
//             FROM chat_rooms cr
//             JOIN chat_participants cp ON cr.id = cp.chat_room_id
//             WHERE cr.status = 'active'
//               AND cp.user_id::text = ${userId}
//               AND cp.user_type = ${userType}
//             ORDER BY cr.updated_at DESC
//           `
//         }
//       }
//     }

//     const result = await getChatRooms()
//     return NextResponse.json({ success: true, chatRooms: result.rows })
//   } catch (error) {
//     console.error("Error fetching chat rooms:", error)
//     return NextResponse.json(
//       {
//         error: "Internal server error",
//         details: error.message,
//       },
//       { status: 500 },
//     )
//   }
// }
