"use server"

import { ID, Query } from "node-appwrite"
import { createAdminClient } from "../appwrite"
import { appwriteConfig } from "../appwrite/config"
import { parseStringify } from "../utils"

const getUserByEmail = async (email: string) => {
  const { databases } = await createAdminClient()

  const result = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    [Query.equal("email", [email])]
  )

  return result.total > 0 ? result.documents[0] : null
}

const handleError = (error: unknown, message: string) => {
  console.log(error, message)
  throw error;
}

const sendEmailOTP = async ({ email }: {email: string}) => {
  const { account } = await createAdminClient()

  try {
    const session = await account.createEmailToken(ID.unique(), email)

    return session.userId
  } catch (error) {
    handleError(error, "Failed to send email OTP")
  }
}

export const createAccount = async ({ fullName, email }: { fullName: string, email: string }) => {
  const existingUser = await getUserByEmail(email)

  const accountId = await sendEmailOTP({ email})

  if(!accountId) throw new Error("Failed to create account")

  if(!existingUser) {
    const { databases } = await createAdminClient()

    await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      ID.unique(),
      { 
        email, 
        fullName,
        avatar: "https://images.unsplash.com/photo-1499714608240-22fc6ad53fb2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=880&q=80",
        accountId
      },
    )
  }

  return parseStringify({ accountId })
}