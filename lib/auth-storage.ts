import AsyncStorage from "@react-native-async-storage/async-storage"
import type { User, Sitter } from "@/types/auth"

const TOKEN_KEY = "auth_token"
const USER_KEY = "auth_user"
const SITTER_KEY = "auth_sitter"
const IS_NEW_USER_KEY = "is_new_user"

export const getStoredToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY)
  } catch (error) {
    console.error("Error reading token:", error)
    return null
  }
}

export const setStoredToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token)
  } catch (error) {
    console.error("Error storing token:", error)
  }
}

export const removeStoredToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY)
  } catch (error) {
    console.error("Error removing token:", error)
  }
}

export const getStoredUser = async (): Promise<User | null> => {
  try {
    const stored = await AsyncStorage.getItem(USER_KEY)
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error("Error reading user:", error)
    return null
  }
}

export const setStoredUser = async (user: User): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch (error) {
    console.error("Error storing user:", error)
  }
}

export const removeStoredUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_KEY)
  } catch (error) {
    console.error("Error removing user:", error)
  }
}

export const getStoredSitter = async (): Promise<Sitter | null> => {
  try {
    const stored = await AsyncStorage.getItem(SITTER_KEY)
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error("Error reading sitter:", error)
    return null
  }
}

export const setStoredSitter = async (sitter: Sitter): Promise<void> => {
  try {
    await AsyncStorage.setItem(SITTER_KEY, JSON.stringify(sitter))
  } catch (error) {
    console.error("Error storing sitter:", error)
  }
}

export const removeStoredSitter = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SITTER_KEY)
  } catch (error) {
    console.error("Error removing sitter:", error)
  }
}

export const getStoredIsNewUser = async (): Promise<boolean> => {
  try {
    const stored = await AsyncStorage.getItem(IS_NEW_USER_KEY)
    return stored === "true"
  } catch (error) {
    console.error("Error reading isNewUser:", error)
    return false
  }
}

export const setStoredIsNewUser = async (isNewUser: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(IS_NEW_USER_KEY, isNewUser.toString())
  } catch (error) {
    console.error("Error storing isNewUser:", error)
  }
}

export const removeStoredIsNewUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(IS_NEW_USER_KEY)
  } catch (error) {
    console.error("Error removing isNewUser:", error)
  }
}
